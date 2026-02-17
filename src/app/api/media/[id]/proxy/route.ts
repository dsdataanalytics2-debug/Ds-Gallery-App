import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth, unauthorizedResponse } from "@/lib/auth";
import { getAuthenticatedOAuthClient } from "@/lib/oauth/token-storage";
import { google } from "googleapis";
import { Readable } from "stream";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { searchParams } = new URL(request.url);
  const queryToken = searchParams.get("token");
  const authHeader = request.headers.get("authorization");

  const token =
    queryToken ||
    (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

  if (token !== "mock-jwt-token-for-demo") {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    console.log(`[Proxy] Requesting media ID: ${id}`);

    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      console.error(`[Proxy] Media not found for ID: ${id}`);
      return new Response("Media not found", { status: 404 });
    }

    if (media.storageType !== "google-drive" || !media.publicId) {
      console.error(
        `[Proxy] Not a Google Drive asset: storageType=${media.storageType}, publicId=${media.publicId}`,
      );
      return new Response("Not a Google Drive asset", { status: 400 });
    }

    const isThumbnail = searchParams.get("type") === "thumbnail";
    const metadata = media.metadata as any;
    const fileId =
      isThumbnail && metadata?.thumbnailPublicId
        ? metadata.thumbnailPublicId
        : media.publicId;

    console.log(
      `[Proxy] Fetching from Google Drive: ${fileId} (Thumbnail: ${isThumbnail})`,
    );

    const driveClient = await getAuthenticatedOAuthClient();
    const drive = google.drive({ version: "v3", auth: driveClient });

    // Handle Range requests for seeking
    const rangeHeader = request.headers.get("range");
    const driveRequestOptions: any = {
      fileId: fileId,
      alt: "media",
    };

    const driveRequestHeaders: any = {};
    if (rangeHeader && !isThumbnail) {
      // Ranges usually don't apply to thumbnails
      console.log(`[Proxy] Range request: ${rangeHeader}`);
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

    console.log(
      `[Proxy] Delivering stream: ${contentType}, length: ${contentLength}`,
    );

    // Convert Node.js Readable to Web ReadableStream robustly
    const nodeStream = response.data as Readable;
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) => {
          try {
            controller.enqueue(new Uint8Array(chunk));
          } catch (e) {
            // Ignore "Controller is already closed" errors
          }
        });
        nodeStream.on("end", () => {
          try {
            controller.close();
          } catch (e) {
            // Ignore "Controller is already closed" errors
          }
        });
        nodeStream.on("error", (err) => {
          try {
            controller.error(err);
          } catch (e) {
            // Ignore "Controller is already closed" errors
          }
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
