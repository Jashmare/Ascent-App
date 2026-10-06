import { fitWithin } from '../../lib/image';

export const PHOTO_MAX = 1600;

async function decode(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Fall through to an <img>, which some browsers decode more formats with.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Resizes a chosen photo so its long side is at most 1600px, as a JPEG Blob for IndexedDB.
 * Throws a plain-language error if the file isn't an image the browser can read.
 */
export async function resizePhoto(file: Blob, max = PHOTO_MAX): Promise<Blob> {
  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await decode(file);
  } catch {
    throw new Error(
      'That file isn’t a photo this browser can read. Choose a JPEG, PNG or WebP image.',
    );
  }
  const { width, height } = fitWithin(source.width, source.height, max);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Photos can’t be processed in this browser. Try another browser.');
  context.drawImage(source, 0, 0, width, height);
  if ('close' in source) source.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error('The photo couldn’t be saved. Try a smaller image.')),
      'image/jpeg',
      0.86,
    ),
  );
}
