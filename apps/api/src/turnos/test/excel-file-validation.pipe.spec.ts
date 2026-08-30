import { BadRequestException } from '@nestjs/common';

import { ExcelFileValidationPipe } from '../pipes/excel-file-validation.pipe';

function buildFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'plantilla.xlsx',
    encoding: '7bit',
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 1024,
    buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]),
    stream: undefined as never,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  };
}

describe('ExcelFileValidationPipe', () => {
  const pipe = new ExcelFileValidationPipe();

  it('acepta un .xlsx válido (firma ZIP)', () => {
    const file = buildFile();
    const result = pipe.transform(file);
    expect(result.originalname).toBe('plantilla.xlsx');
  });

  it('acepta un .xls válido (firma OLE2)', () => {
    const file = buildFile({
      originalname: 'plantilla.xls',
      mimetype: 'application/vnd.ms-excel',
      buffer: Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00]),
    });
    const result = pipe.transform(file);
    expect(result.originalname).toBe('plantilla.xls');
  });

  it('rechaza sin archivo', () => {
    expect(() => pipe.transform(undefined as unknown as Express.Multer.File)).toThrow(
      BadRequestException,
    );
  });

  it('rechaza extensión no permitida', () => {
    const file = buildFile({ originalname: 'plantilla.csv' });
    expect(() => pipe.transform(file)).toThrow(BadRequestException);
  });

  it('rechaza MIME no permitido', () => {
    const file = buildFile({ mimetype: 'text/csv' });
    expect(() => pipe.transform(file)).toThrow(BadRequestException);
  });

  it('rechaza archivo que supera el tamaño máximo', () => {
    const file = buildFile({ size: 6 * 1024 * 1024 });
    expect(() => pipe.transform(file)).toThrow(BadRequestException);
  });

  it('rechaza contenido que no corresponde a ningún formato Excel', () => {
    const file = buildFile({ buffer: Buffer.from([0x00, 0x01, 0x02, 0x03]) });
    expect(() => pipe.transform(file)).toThrow(BadRequestException);
  });

  it('rechaza cuando el contenido es .xlsx pero la extensión declarada es .xls', () => {
    const file = buildFile({
      originalname: 'plantilla.xls',
      mimetype: 'application/vnd.ms-excel',
      buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    });
    expect(() => pipe.transform(file)).toThrow(BadRequestException);
  });
});
