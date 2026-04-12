/**
 * Compresses a base64 image string by resizing it using a canvas.
 * @param base64 - The original base64 image string.
 * @param maxWidth - The maximum width for the resized image.
 * @param maxHeight - The maximum height for the resized image.
 * @param quality - The quality of the output image (0 to 1).
 * @returns A promise that resolves to the compressed base64 string.
 */
export async function compressImage(
  base64: string,
  maxWidth: number = 512,
  maxHeight: number = 512,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (error) => reject(error);
  });
}
