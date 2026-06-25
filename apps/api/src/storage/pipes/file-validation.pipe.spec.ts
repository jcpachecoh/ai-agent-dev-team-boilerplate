import { BadRequestException } from '@nestjs/common';
import { FileValidationPipe } from './file-validation.pipe';

// Minimal valid magic-number buffers
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const WEBP = Buffer.concat([Buffer.alloc(8, 0x52), Buffer.from([0x57, 0x45, 0x42, 0x50])]);
const PDF = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);

function file(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'test.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: PNG.length,
    buffer: PNG,
    destination: '',
    filename: '',
    path: '',
    stream: null as unknown as NodeJS.ReadableStream,
    ...overrides,
  } as Express.Multer.File;
}

describe('FileValidationPipe', () => {
  let pipe: FileValidationPipe;

  beforeEach(() => {
    pipe = new FileValidationPipe();
  });

  it('lanza BadRequestException cuando no hay archivo', () => {
    expect(() => pipe.transform(null as unknown as Express.Multer.File)).toThrow(
      new BadRequestException('Archivo requerido'),
    );
  });

  it('lanza BadRequestException para MIME no permitido', () => {
    expect(() =>
      pipe.transform(file({ mimetype: 'text/plain', buffer: Buffer.from('hola') })),
    ).toThrow(BadRequestException);
    expect(() =>
      pipe.transform(file({ mimetype: 'text/plain', buffer: Buffer.from('hola') })),
    ).toThrow('no permitido');
  });

  it('lanza BadRequestException cuando supera 20 MB', () => {
    expect(() => pipe.transform(file({ size: 21 * 1024 * 1024 }))).toThrow(
      new BadRequestException('El archivo supera el tamaño máximo permitido de 20 MB'),
    );
  });

  it('lanza BadRequestException cuando el buffer no tiene magic number reconocido', () => {
    expect(() =>
      pipe.transform(file({ mimetype: 'image/png', buffer: Buffer.from('no-es-una-imagen') })),
    ).toThrow(
      new BadRequestException('El contenido del archivo no coincide con un tipo soportado'),
    );
  });

  it('lanza BadRequestException cuando magic number y MIME declarado no coinciden', () => {
    // Buffer PNG pero declara JPEG
    expect(() => pipe.transform(file({ mimetype: 'image/jpeg', buffer: PNG }))).toThrow(
      new BadRequestException('El tipo de archivo declarado no coincide con el contenido real'),
    );
  });

  it('acepta PNG válido', () => {
    const result = pipe.transform(file());
    expect(result.mimetype).toBe('image/png');
    expect(result.buffer).toEqual(PNG);
    expect(result.size).toBe(PNG.length);
  });

  it('acepta JPEG válido', () => {
    const result = pipe.transform(
      file({ mimetype: 'image/jpeg', buffer: JPEG, size: JPEG.length }),
    );
    expect(result.mimetype).toBe('image/jpeg');
  });

  it('normaliza image/jpg a image/jpeg', () => {
    const result = pipe.transform(file({ mimetype: 'image/jpg', buffer: JPEG, size: JPEG.length }));
    expect(result.mimetype).toBe('image/jpeg');
  });

  it('acepta WEBP válido', () => {
    const result = pipe.transform(
      file({ mimetype: 'image/webp', buffer: WEBP, size: WEBP.length }),
    );
    expect(result.mimetype).toBe('image/webp');
  });

  it('acepta PDF válido', () => {
    const result = pipe.transform(
      file({ mimetype: 'application/pdf', buffer: PDF, originalname: 'doc.pdf', size: PDF.length }),
    );
    expect(result.mimetype).toBe('application/pdf');
  });

  it('sanitiza el nombre del archivo eliminando caracteres especiales', () => {
    const result = pipe.transform(file({ originalname: 'Mi Foto!! (cópia).png' }));
    expect(result.originalname).toMatch(/^[a-z0-9._-]+$/);
  });

  it('trunca el nombre del archivo a 100 caracteres', () => {
    const result = pipe.transform(file({ originalname: 'a'.repeat(200) + '.png' }));
    expect(result.originalname.length).toBeLessThanOrEqual(100);
  });
});
