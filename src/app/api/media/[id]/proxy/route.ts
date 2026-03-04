import prisma from "@/lib/prisma";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";
import { getGoogleDriveClient } from "@/lib/gdrive-client";
import { Readable } from "stream";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return new Response("Media not found", { status: 404 });
    }

    // Modern check for gdrive
    const isDrive =
      media.storageType === "gdrive" || media.storageType === "google-drive";
    if (!isDrive) {
      return new Response("Not a Google Drive asset", { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const isThumbnail = searchParams.get("type") === "thumbnail";

    // Prioritize storageFileId, fallback to publicId for legacy compatibility
    const mediaAny2 = media as {
      storageFileId?: string;
      publicId?: string;
      googleAccountId?: string | null;
    };
    const fileId = mediaAny2.storageFileId || mediaAny2.publicId;

    if (!fileId) {
      return new Response("Missing storage file ID", { status: 400 });
    }

    const googleAccountId = media.googleAccountId;
    if (!googleAccountId) {
      return new Response(
        "Media is missing a linked Google account ID. This is required for security and account isolation.",
        { status: 400 },
      );
    }

    const drive = await getGoogleDriveClient(googleAccountId);

    // Special handling for thumbnails
    if (isThumbnail) {
      const metadata = media.metadata as { thumbnailPublicId?: string } | null;
      const customThumbnailId = metadata?.thumbnailPublicId;

      if (customThumbnailId) {
        try {
          const thumbResponse = await drive.files.get(
            {
              fileId: customThumbnailId,
              alt: "media",
              supportsAllDrives: true,
            },
            { responseType: "stream" },
          );

          const headers = new Headers();
          headers.set("Content-Type", "image/jpeg");
          headers.set("Cache-Control", "public, max-age=3600");

          // Convert Node.js Readable to Web ReadableStream (DRY - used below too)
          const nodeStream = thumbResponse.data as Readable;
          const webStream = new ReadableStream({
            start(controller) {
              nodeStream.on("data", (chunk: Buffer | Uint8Array) => {
                try {
                  controller.enqueue(new Uint8Array(chunk));
                } catch {
                  // Ignore enqueue errors
                }
              });
              nodeStream.on("end", () => {
                try {
                  controller.close();
                } catch {
                  // Ignore close errors
                }
              });
              nodeStream.on("error", (err: Error) => {
                try {
                  controller.error(err);
                } catch {
                  // Ignore error signaling errors
                }
              });
            },
            cancel() {
              nodeStream.destroy();
            },
          });

          return new Response(webStream as unknown as BodyInit, {
            status: 200,
            headers,
          });
        } catch (thumbError) {
          console.warn("[Proxy] Failed to fetch custom thumbnail:", thumbError);
        }
      }

      // Fallback: Use Drive's auto-generated thumbnailLink
      try {
        const fileMetadata = await drive.files.get({
          fileId: fileId,
          fields: "thumbnailLink",
          supportsAllDrives: true,
        });

        const thumbnailLink = fileMetadata.data.thumbnailLink;
        if (thumbnailLink) {
          // Stream the thumbnail directly instead of redirecting
          const response = await fetch(thumbnailLink.replace("=s220", "=s800"));
          if (response.ok) {
            const headers = new Headers();
            headers.set("Content-Type", "image/jpeg");
            headers.set("Cache-Control", "public, max-age=3600");
            return new Response(response.body, { status: 200, headers });
          }
        }
      } catch (thumbError) {
        console.warn(
          "[Proxy] Failed to fetch GDrive thumbnailLink:",
          thumbError,
        );
      }
    }

    // Handle Range requests for seeking
    const rangeHeader = request.headers.get("range");
    const driveRequestOptions = {
      fileId: fileId,
      alt: "media",
      supportsAllDrives: true,
    };

    const driveRequestHeaders: Record<string, string> = {};
    if (rangeHeader && !isThumbnail) {
      driveRequestHeaders.Range = rangeHeader;
    }

    const response = await drive.files.get(driveRequestOptions, {
      responseType: "stream",
      headers: driveRequestHeaders,
    });

    // Get headers from Google Drive response
    const headers = new Headers();
    const contentType = response.headers["content-type"];
    const contentLength = response.headers["content-length"];
    const contentRange = response.headers["content-range"];

    if (contentType) headers.set("Content-Type", contentType);
    if (contentLength) headers.set("Content-Length", contentLength);
    if (contentRange) headers.set("Content-Range", contentRange);

    // Enable range requests for seeking
    headers.set("Accept-Ranges", "bytes");

    // Convert Node.js Readable to Web ReadableStream
    const nodeStream = response.data as Readable;
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk: Buffer | Uint8Array) => {
          try {
            controller.enqueue(new Uint8Array(chunk));
          } catch {
            // Ignore enqueue errors
          }
        });
        nodeStream.on("end", () => {
          try {
            controller.close();
          } catch {
            // Ignore close errors
          }
        });
        nodeStream.on("error", (err: Error) => {
          try {
            controller.error(err);
          } catch {
            // Ignore error signaling errors
          }
        });
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return new Response(webStream as unknown as BodyInit, {
      status: rangeHeader && contentRange ? 206 : 200,
      headers,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Proxy Error:", err);
    return new Response(err.message || "Proxy failed", { status: 500 });
  }
}
