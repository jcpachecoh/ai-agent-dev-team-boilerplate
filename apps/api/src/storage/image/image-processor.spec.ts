jest.mock('sharp', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import sharp from 'sharp';
import { ImageProfile } from '../enums/storage.enums';
import { extensionFromMime, processImage } from './image-processor';

type SharpInstance = { resize: jest.Mock; webp: jest.Mock; toBuffer: jest.Mock };

describe('image-processor', () => {
  let instance: SharpInstance;

  beforeEach(() => {
    instance = {
      resize: jest.fn(),
      webp: jest.fn(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-webp')),
    };
    instance.resize.mockReturnValue(instance);
    instance.webp.mockReturnValue(instance);
    (sharp as jest.Mock).mockReturnValue(instance);
  });

  afterEach(() => jest.clearAllMocks());

  describe('processImage — passthrough', () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

    it('retorna buffer original para tipos no imagen (PDF)', async () => {
      const result = await processImage(buf, 'application/pdf', ImageProfile.NONE);
      expect(result).toEqual({ buffer: buf, mimeType: 'application/pdf', extension: 'pdf' });
      expect(sharp).not.toHaveBeenCalled();
    });

    it('retorna buffer original con ImageProfile.NONE aunque sea imagen', async () => {
      const result = await processImage(buf, 'image/png', ImageProfile.NONE);
      expect(result).toEqual({ buffer: buf, mimeType: 'image/png', extension: 'png' });
      expect(sharp).not.toHaveBeenCalled();
    });
  });

  describe('processImage — procesamiento con sharp', () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

    it('procesa LOGO con fit inside, 512×512, quality 85', async () => {
      const result = await processImage(buf, 'image/png', ImageProfile.LOGO);

      expect(sharp).toHaveBeenCalledWith(buf);
      expect(instance.resize).toHaveBeenCalledWith({
        width: 512,
        height: 512,
        fit: 'inside',
        withoutEnlargement: true,
      });
      expect(instance.webp).toHaveBeenCalledWith({ quality: 85 });
      expect(result.mimeType).toBe('image/webp');
      expect(result.extension).toBe('webp');
      expect(result.buffer).toEqual(Buffer.from('processed-webp'));
    });

    it('procesa AVATAR con fit cover (crop), 256×256', async () => {
      await processImage(buf, 'image/jpeg', ImageProfile.AVATAR);

      expect(instance.resize).toHaveBeenCalledWith({
        width: 256,
        height: 256,
        fit: 'cover',
      });
    });

    it('procesa PRODUCT con fit inside, 800×800', async () => {
      await processImage(buf, 'image/png', ImageProfile.PRODUCT);

      expect(instance.resize).toHaveBeenCalledWith(
        expect.objectContaining({ width: 800, height: 800, fit: 'inside' }),
      );
    });

    it('procesa RECIPE con fit inside, 800×800', async () => {
      await processImage(buf, 'image/webp', ImageProfile.RECIPE);

      expect(instance.resize).toHaveBeenCalledWith(
        expect.objectContaining({ width: 800, height: 800, fit: 'inside' }),
      );
    });

    it('procesa INCIDENT con 1920×1080', async () => {
      await processImage(buf, 'image/png', ImageProfile.INCIDENT);

      expect(instance.resize).toHaveBeenCalledWith(
        expect.objectContaining({ width: 1920, height: 1080 }),
      );
    });

    it('procesa BANNER con 1200×400', async () => {
      await processImage(buf, 'image/png', ImageProfile.BANNER);

      expect(instance.resize).toHaveBeenCalledWith(
        expect.objectContaining({ width: 1200, height: 400 }),
      );
    });
  });

  describe('extensionFromMime', () => {
    it.each([
      ['image/png', 'png'],
      ['image/jpeg', 'jpg'],
      ['image/jpg', 'jpg'],
      ['image/webp', 'webp'],
      ['application/pdf', 'pdf'],
      ['application/octet-stream', 'bin'],
    ])('%s → %s', (mime, expected) => {
      expect(extensionFromMime(mime)).toBe(expected);
    });
  });
});
