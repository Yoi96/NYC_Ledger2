/**
 * Image compressor helper for mobile devices.
 * Downscales high-resolution mobile camera photos (e.g., 4000x3000, 15MB+)
 * to max 1280px and JPEG quality 0.82.
 * This prevents Express "413 Payload Too Large" errors and memory spikes on mobile browsers.
 */
export async function compressImageForAI(
  fileOrDataUrl: File | string,
  maxDimension = 1280,
  quality = 0.82
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    const processCanvas = () => {
      let width = img.width;
      let height = img.height;

      if (width === 0 || height === 0) {
        reject(new Error("Invalid image dimensions"));
        return;
      }

      // Calculate new dimensions respecting aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get 2D canvas context"));
        return;
      }

      // Draw image to canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Export as compressed JPEG
      const mimeType = "image/jpeg";
      const compressedDataUrl = canvas.toDataURL(mimeType, quality);

      resolve({
        base64: compressedDataUrl,
        mimeType,
      });
    };

    img.onload = processCanvas;
    img.onerror = (err) => reject(err);

    if (typeof fileOrDataUrl === "string") {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error("Failed to read image file"));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
