import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { BULK_IMPORT_MAX_FILE_BYTES } from '../turnos.constants';

export interface ValidatedExcelFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

const ALLOWED_EXTENSIONS = new Set(['.xlsx', '.xls']);

const ALLOWED_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream', // varios navegadores/OS no reportan el MIME correcto para .xlsx/.xls
]);

// .xlsx es un ZIP (PK\x03\x04, o PK\x05\x06 para un ZIP vacío); .xls legacy es OLE2/CFB.
const XLSX_SIGNATURES: number[][] = [
  [0x50, 0x4b, 0x03, 0x04],
  [0x50, 0x4b, 0x05, 0x06],
];
const XLS_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

function matchesSignature(buffer: Buffer, signature: number[]): boolean {
  if (buffer.length < signature.length) {
    return false;
  }
  return signature.every((byte, index): boolean => buffer[index] === byte);
}

function detectSpreadsheetFormat(buffer: Buffer): 'xlsx' | 'xls' | null {
  if (XLSX_SIGNATURES.some((signature): boolean => matchesSignature(buffer, signature))) {
    return 'xlsx';
  }
  if (matchesSignature(buffer, XLS_SIGNATURE)) {
    return 'xls';
  }
  return null;
}

function getExtension(filename: string): string {
  const match = /\.[^.]+$/.exec(filename.toLowerCase());
  return match ? match[0] : '';
}

@Injectable()
export class ExcelFileValidationPipe implements PipeTransform<
  Express.Multer.File,
  ValidatedExcelFile
> {
  transform(file: Express.Multer.File): ValidatedExcelFile {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    const extension = getExtension(file.originalname);
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      throw new BadRequestException('El archivo debe tener extensión .xlsx o .xls');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(`Tipo de archivo no permitido: ${file.mimetype}`);
    }

    if (file.size > BULK_IMPORT_MAX_FILE_BYTES) {
      throw new BadRequestException(
        `El archivo supera el tamaño máximo permitido de ${BULK_IMPORT_MAX_FILE_BYTES / 1024 / 1024} MB`,
      );
    }

    const detectedFormat = detectSpreadsheetFormat(file.buffer);
    if (!detectedFormat) {
      throw new BadRequestException('El contenido del archivo no corresponde a un Excel válido');
    }

    if (detectedFormat === 'xlsx' && extension !== '.xlsx') {
      throw new BadRequestException('El contenido del archivo es .xlsx pero la extensión es .xls');
    }
    if (detectedFormat === 'xls' && extension !== '.xls') {
      throw new BadRequestException('El contenido del archivo es .xls pero la extensión es .xlsx');
    }

    return {
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: file.size,
    };
  }
}
