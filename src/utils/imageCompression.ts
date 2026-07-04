export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeBytes?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.85,
  maxSizeBytes: 1.5 * 1024 * 1024,
};

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Blob | null {
  const dataUrl = canvas.toDataURL(type, quality);
  const parts = dataUrl.split(',');
  if (parts.length !== 2) return null;
  const byteString = atob(parts[1]);
  const mimeType = parts[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!file.type.startsWith('image/')) {
    return file;
  }

  if (file.size <= opts.maxSizeBytes!) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > opts.maxWidth!) {
        height = Math.round(height * (opts.maxWidth! / width));
        width = opts.maxWidth!;
      }
      if (height > opts.maxHeight!) {
        width = Math.round(width * (opts.maxHeight! / height));
        height = opts.maxHeight!;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      let quality = opts.quality!;
      let blob = canvasToBlob(canvas, 'image/jpeg', quality);
      while (blob && blob.size > opts.maxSizeBytes! && quality > 0.1) {
        quality = Math.round((quality - 0.1) * 100) / 100;
        blob = canvasToBlob(canvas, 'image/jpeg', quality);
      }

      if (blob) {
        const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
          type: 'image/jpeg',
        });
        resolve(compressedFile);
      } else {
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}
