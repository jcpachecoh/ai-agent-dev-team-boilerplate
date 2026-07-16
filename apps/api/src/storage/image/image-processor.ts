import sharp from 'sharp';
import { ImageProfile } from '../enums/storage.enums';

interface ImageProcessingProfile {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  crop: boolean;
}

const PROFILES: Record<ImageProfile, ImageProcessingProfile | null> = {
  [ImageProfile.LOGO]: { maxWidth: 512, maxHeight: 512, quality: 85, crop: false },
  [ImageProfile.AVATAR]: { maxWidth: 400, maxHeight: 400, quality: 85, crop: true },
  [ImageProfile.PRODUCT]: { maxWidth: 800, maxHeight: 800, quality: 80, crop: false },
  [ImageProfile.RECIPE]: { maxWidth: 800, maxHeight: 800, quality: 80, crop: false },
  [ImageProfile.INCIDENT]: { maxWidth: 1920, maxHeight: 1080, quality: 75, crop: false },
  [ImageProfile.BANNER]: { maxWidth: 1200, maxHeight: 400, quality: 80, crop: false },
  [ImageProfile.NONE]: null,
};

const IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

export interface ProcessedImage {
  buffer: Buffer;
  mimeType: string;
  extension: string;
}

export async function processImage(
  buffer: Buffer,
  mimeType: string,
  profile: ImageProfile,
): Promise<ProcessedImage> {
  if (!IMAGE_MIME_TYPES.has(mimeType) || profile === ImageProfile.NONE) {
    return { buffer, mimeType, extension: extensionFromMime(mimeType) };
  }

  const config = PROFILES[profile];
  if (!config) {
    return { buffer, mimeType, extension: extensionFromMime(mimeType) };
  }

  const resizeOptions = config.crop
    ? ({ width: config.maxWidth, height: config.maxHeight, fit: 'cover' } as const)
    : ({
        width: config.maxWidth,
        height: config.maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      } as const);

  const processed = await sharp(buffer)
    .resize(resizeOptions)
    .webp({ quality: config.quality })
    .toBuffer();

  return { buffer: processed, mimeType: 'image/webp', extension: 'webp' };
}

export function extensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
  };
  return map[mimeType] ?? 'bin';
}
