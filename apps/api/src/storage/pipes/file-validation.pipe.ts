import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export interface ValidatedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/pdf',
]);

// Max 20 MB absolute ceiling; individual endpoints can enforce stricter limits
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

// Magic-number signatures for supported types (first N bytes)
const MAGIC_SIGNATURES: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/webp', bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
];

function detectMagicNumber(buffer: Buffer): string | null {
  for (const sig of MAGIC_SIGNATURES) {
    const offset = sig.offset ?? 0;
    if (buffer.length < offset + sig.bytes.length) continue;
    const match = sig.bytes.every((byte, i) => buffer[offset + i] === byte);
    if (match) {
      if (sig.mime === 'image/jpeg') return 'image/jpeg';
      return sig.mime;
    }
  }
  return null;
}

function sanitizeFilename(name: string): string {
  return name
    .normalize('NFC')
    .replace(/[^\w.\-]/g, '-')
    .replace(/\.{2,}/g, '-')
    .replace(/^[-.]/, '')
    .slice(0, 100)
    .toLowerCase();
}

@Injectable()
export class FileValidationPipe implements PipeTransform<Express.Multer.File, ValidatedFile> {
  transform(file: Express.Multer.File): ValidatedFile {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido: ${file.mimetype}. Permitidos: PNG, JPEG, WEBP, PDF`,
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `El archivo supera el tamaño máximo permitido de ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`,
      );
    }

    const detected = detectMagicNumber(file.buffer);
    if (!detected) {
      throw new BadRequestException('El contenido del archivo no coincide con un tipo soportado');
    }

    const normalizedDetected = detected === 'image/jpeg' ? 'image/jpeg' : detected;
    const normalizedDeclared = file.mimetype === 'image/jpg' ? 'image/jpeg' : file.mimetype;

    if (normalizedDetected !== normalizedDeclared) {
      throw new BadRequestException(
        'El tipo de archivo declarado no coincide con el contenido real',
      );
    }

    return {
      buffer: file.buffer,
      mimetype: normalizedDeclared,
      originalname: sanitizeFilename(file.originalname),
      size: file.size,
    };
  }
}
