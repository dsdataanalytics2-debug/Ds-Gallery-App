/**
 * Captures a frame from a video file at a specific time.
 */
export async function captureVideoFrame(
  file: File,
  timeInSeconds: number = 3,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      // Seek to the requested time
      video.currentTime = Math.min(timeInSeconds, video.duration);
    };

    video.onseeked = () => {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      try {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Failed to capture frame"));
              }
              // Clean up
              URL.revokeObjectURL(video.src);
            },
            "image/jpeg",
            0.85,
          );
        } else {
          reject(new Error("Failed to get canvas context"));
          URL.revokeObjectURL(video.src);
        }
      } catch (error) {
        console.error("Video thumbnail generation failed:", error);
        reject(new Error("Video thumbnail generation failed"));
        URL.revokeObjectURL(video.src);
      }
    };

    video.onerror = () => {
      reject(new Error("Error loading video"));
      URL.revokeObjectURL(video.src);
    };
  });
}
