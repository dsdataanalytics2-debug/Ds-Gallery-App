import prisma from "@/lib/prisma";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";
import { getGoogleDriveClient } from "@/lib/gdrive-client";
import { Readable } from "stream";
import { Media } from "@/types";

/**
 * Safely converts a Node.js Readable stream to a Web ReadableStream.
 * Uses async iteration for robustness and better backpressure handling.
 */
function safeNodeToWebStream(nodeStream: Readable): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of nodeStream) {
          controller.enqueue(new Uint8Array(chunk));
        }
        controller.close();
      } catch (err: any) {
        // If the stream was destroyed/aborted, the loop will throw.
        // We only call error() if the controller is still "open".
        try {
          controller.error(err);
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      nodeStream.destroy();
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyAuth(request)) {
    return unauthorizedResponse();
  }

  let media: Media | null = null;
  try {
    const { id } = await params;
    media = (await prisma.media.findUnique({
      where: { id },
    })) as any;

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
    const mediaAny2 = media as Media;
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

          const webStream = safeNodeToWebStream(thumbResponse.data as Readable);

          return new Response(webStream as BodyInit, {
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

    // --- VIDEO/FILE STREAMING ---
    // Use native fetch with OAuth2 access token rather than googleapis stream.
    // The googleapis stream API strips Range response headers (Content-Range,
    // Content-Length) — these are REQUIRED for video seeking. Direct fetch works.

    const rangeHeader = request.headers.get("range");

    // Get a fresh OAuth2 access token from the Drive client
    const auth = (drive as any).context._options.auth;
    const tokenResponse = await auth.getAccessToken();
    const accessToken = tokenResponse?.token;

    if (!accessToken) {
      return new Response("Failed to acquire access token", { status: 502 });
    }

    // Build the direct Drive download URL
    const driveDirectUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`;

    // Forward the incoming Range header to Google Drive
    const fetchHeaders: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };
    if (rangeHeader) fetchHeaders["Range"] = rangeHeader;

    const driveResponse = await fetch(driveDirectUrl, {
      headers: fetchHeaders,
    });

    if (!driveResponse.ok && driveResponse.status !== 206) {
      console.error(`[Proxy] Drive fetch failed: ${driveResponse.status}`);
      return new Response(`Drive error: ${driveResponse.statusText}`, {
        status: driveResponse.status,
      });
    }

    // Build response headers — forward all important ones from Drive
    const responseHeaders = new Headers();
    const contentType =
      driveResponse.headers.get("content-type") || "video/mp4";
    responseHeaders.set("Content-Type", contentType);
    responseHeaders.set("Accept-Ranges", "bytes");

    const driveContentLength = driveResponse.headers.get("content-length");
    const driveContentRange = driveResponse.headers.get("content-range");

    if (driveContentLength)
      responseHeaders.set("Content-Length", driveContentLength);
    if (driveContentRange)
      responseHeaders.set("Content-Range", driveContentRange);

    // If Drive returns 206 but no Content-Range, construct it using DB fileSize
    if (rangeHeader && !driveContentRange && media.fileSize) {
      const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = rangeMatch[2]
          ? parseInt(rangeMatch[2], 10)
          : Number(media.fileSize) - 1;
        const total = Number(media.fileSize);
        responseHeaders.set("Content-Range", `bytes ${start}-${end}/${total}`);
        if (!driveContentLength) {
          responseHeaders.set("Content-Length", (end - start + 1).toString());
        }
      }
    }

    responseHeaders.set(
      "Access-Control-Expose-Headers",
      "Content-Range, Content-Length, Accept-Ranges",
    );

    // Diagnostic logging
    if (process.env.NODE_ENV === "development") {
      try {
        const fs = require("fs");
        const path = require("path");
        const logPath = path.join(process.cwd(), "proxy-diagnostics.log");
        fs.appendFileSync(
          logPath,
          `\n[${new Date().toISOString()}] fetch-proxy: ${id}
- Range: ${rangeHeader || "none"}
- Drive Status: ${driveResponse.status}
- Content-Type: ${contentType}
- Content-Length: ${responseHeaders.get("Content-Length") || "none"}
- Content-Range: ${responseHeaders.get("Content-Range") || "none"}
------------------------------------------------\n`,
        );
      } catch {
        /* Ignore */
      }
    }

    return new Response(driveResponse.body, {
      status: driveResponse.status,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Proxy Error:", err);

    // Detailed error logging
    if (process.env.NODE_ENV === "development") {
      try {
        const fs = require("fs");
        const path = require("path");
        const logPath = path.join(process.cwd(), "proxy-error.log");
        fs.appendFileSync(
          logPath,
          `\n[${new Date().toISOString()}] Proxy Exception: ${err.message}\n${err.stack}\n`,
        );
      } catch (logErr) {
        // Ignore
      }
    }

    // Automatic cache clearing for invalid_grant
    if (err.message === "invalid_grant" && media?.googleAccountId) {
      try {
        const {
          clearDriveClientCache,
        } = require("../../../../../lib/gdrive-client");
        clearDriveClientCache(media.googleAccountId);
        console.log(
          `[Proxy] Cleared GDrive cache for account ${media.googleAccountId} due to invalid_grant`,
        );
      } catch (cacheErr) {
        // Ignore errors during cache clearing
      }
    }

    // Emergency file logging for debugging
    try {
      const fs = require("fs");
      const path = require("path");
      const logPath = path.join(process.cwd(), "proxy-error.log");
      fs.appendFileSync(
        logPath,
        `\n[${new Date().toISOString()}] Proxy Error: ${err.message}\n${err.stack}\n`,
      );
    } catch (logErr) {
      console.error("Failed to write proxy-error.log:", logErr);
    }

    return new Response(err.message || "Proxy failed", { status: 500 });
  }
}
