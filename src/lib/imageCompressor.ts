/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Compresses an image file or data URI to JPEG format and resizes it if it exceeds max size.
 * Returns a high-quality base64 JPEG string.
 */
export function compressImage(fileOrDataUri: File | string, maxDimension = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Calculate target dimensions keeping aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      
      // Create offscreen canvas to perform compression/resize
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      
      // Fill white background (useful if source image has transparent pixels)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      
      // Draw image onto canvas
      ctx.drawImage(img, 0, 0, width, height);
      
      try {
        // Export to base64 JPEG
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      } catch (e) {
        reject(e);
      }
    };
    
    img.onerror = (err) => {
      reject(new Error("Failed to load image for compression"));
    };

    if (fileOrDataUri instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error("FileReader result is empty"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(fileOrDataUri);
    } else {
      img.src = fileOrDataUri;
    }
  });
}
