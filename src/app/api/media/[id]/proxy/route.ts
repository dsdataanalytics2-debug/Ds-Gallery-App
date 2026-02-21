import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";
import { getOptionalAuthenticatedDrive } from "@/lib/oauth/token-storage";
import { google } from "googleapis";
import { Readable } from "stream";

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

    // Prioritize storageFileId, fallback to publicId for legacy Compatibility
    const mediaAny = media as any;
    const fileId = mediaAny.storageFileId || mediaAny.publicId;

    if (!fileId) {
      return new Response("Missing storage file ID", { status: 400 });
    }

    // Dual-Auth Logic
    let drive;
    const userDrive = await getOptionalAuthenticatedDrive();
    if (userDrive) {
      drive = userDrive;
    } else {
      const auth = new google.auth.JWT({
        email: process.env.GOOGLE_CLIENT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/drive"],
      });
      drive = google.drive({ version: "v3", auth });
    }

    // Special handling for thumbnails
    if (isThumbnail) {
      const metadata = media.metadata as any;
      const customThumbnailId = metadata?.thumbnailPublicId;

      if (customThumbnailId) {
        try {
          console.log(
            `[Proxy] Fetching custom thumbnail from Drive: ${customThumbnailId}`,
          );
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
          const nodeStream = thumbResponse.data as any;
          const webStream = new ReadableStream({
            start(controller) {
              nodeStream.on("data", (chunk: Buffer | Uint8Array) => {
                try {
                  controller.enqueue(new Uint8Array(chunk));
                } catch (e) {}
              });
              nodeStream.on("end", () => {
                try {
                  controller.close();
                } catch (e) {}
              });
              nodeStream.on("error", (err: Error) => {
                try {
                  controller.error(err);
                } catch (e) {}
              });
            },
            cancel() {
              nodeStream.destroy();
            },
          });

          return new Response(webStream as any, {
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
          const thumbRes = await fetch(thumbnailLink);
          if (thumbRes.ok) {
            const thumbBlob = await thumbRes.blob();
            return new Response(thumbBlob, {
              headers: {
                "Content-Type":
                  thumbRes.headers.get("Content-Type") || "image/jpeg",
                "Cache-Control": "public, max-age=3600",
              },
            });
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
    const driveRequestOptions: any = {
      fileId: fileId,
      alt: "media",
    };

    const driveRequestHeaders: any = {};
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
    const nodeStream = response.data as any;
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk: Buffer | Uint8Array) => {
          try {
            controller.enqueue(new Uint8Array(chunk));
          } catch (e) {}
        });
        nodeStream.on("end", () => {
          try {
            controller.close();
          } catch (e) {}
        });
        nodeStream.on("error", (err: Error) => {
          try {
            controller.error(err);
          } catch (e) {}
        });
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return new Response(webStream as any, {
      status: rangeHeader && contentRange ? 206 : 200,
      headers,
    });
  } catch (error: any) {
    console.error("Proxy Error:", error);
    return new Response(error.message || "Proxy failed", { status: 500 });
  }
}
