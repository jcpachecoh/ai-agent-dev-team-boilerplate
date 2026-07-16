import * as fs from 'fs';
import * as path from 'path';

import { buildCleanPilaDraft } from '../pila/serializer/fixtures/pila-clean-draft.fixture';
import {
  PILA_FILE_ENCODING,
  PILA_LINE_TERMINATOR,
  PILA_RECORD_TYPE1_LENGTH,
  PILA_RECORD_TYPE2_LENGTH,
  suggestedPilaFileName,
} from '../pila/serializer/pila-fixed-width.constants';
import {
  assertAsciiByteLength,
  assertRecordLength,
  emptyAlpha,
  emptyNumeric,
  formatPilaMoney,
  formatPilaPeriod,
  formatPilaTariff,
  formatSequence,
  formatWorkCenter,
  padAlphaRight,
  padNumericLeft,
  PilaSerializationError,
  sanitizePilaAlpha,
} from '../pila/serializer/pila-fixed-width.format';
import { PilaFixedWidthSerializer } from '../pila/serializer/pila-fixed-width.serializer';
import { PilaRecordType1Serializer } from '../pila/serializer/pila-record-type1.serializer';
import { PilaRecordType2Serializer } from '../pila/serializer/pila-record-type2.serializer';

const goldenDir = path.join(__dirname, '../pila/serializer/fixtures/golden');

function readGolden(name: string): string {
  return fs.readFileSync(path.join(goldenDir, name), 'utf8');
}

describe('pila-fixed-width.format helpers', () => {
  it('padea alfanumérico a la derecha y numérico a la izquierda', () => {
    expect(padAlphaRight('ABC', 5, 'f')).toBe('ABC  ');
    expect(padNumericLeft(42, 5, 'f')).toBe('00042');
  });

  it('formatea tarifas y montos', () => {
    expect(formatPilaTariff(0.16, 7, 'tarifa')).toBe('0.16000');
    expect(formatPilaTariff(0.00522, 9, 'arl')).toBe('0.0052200');
    expect(formatPilaMoney(1_500_000, 9, 'ibc')).toBe('001500000');
  });

  it('cubre ramas de error de formato (overflow, inválidos, ASCII)', () => {
    expect(() => padNumericLeft('123456', 3, 'num')).toThrow(PilaSerializationError);
    expect(() => formatPilaMoney(-1, 9, 'money')).toThrow(PilaSerializationError);
    expect(() => formatPilaMoney(Number.NaN, 9, 'money')).toThrow(PilaSerializationError);
    expect(() => formatPilaTariff(-0.1, 7, 'tarifa')).toThrow(PilaSerializationError);
    expect(() => formatPilaTariff(Number.POSITIVE_INFINITY, 7, 'tarifa')).toThrow(
      PilaSerializationError,
    );
    expect(() => formatPilaPeriod('2026-13', 'period')).toThrow(PilaSerializationError);
    expect(() => formatSequence(0, 5, 'seq')).toThrow(PilaSerializationError);
    expect(() => formatWorkCenter('12345678901', 9, 'wc')).toThrow(PilaSerializationError);
    expect(() => assertRecordLength('abc', 2, 'rec')).toThrow(PilaSerializationError);
    expect(() => assertAsciiByteLength('AÑO', 3, 'ascii')).toThrow(PilaSerializationError);
    expect(() => assertAsciiByteLength('AB', 3, 'ascii')).toThrow(PilaSerializationError);
    expect(formatPilaPeriod('2026-07', 'period')).toBe('2026-07');
    expect(formatSequence(3, 5, 'seq')).toBe('00003');
    expect(formatWorkCenter('12', 9, 'wc')).toBe('000000012');
    expect(emptyAlpha(3)).toBe('   ');
    expect(emptyNumeric(3)).toBe('000');
    expect(formatPilaTariff(0.16, 4, 't')).toBe('0.16');
    // overflow de tarifa (formatted.length > length)
    expect(() => formatPilaTariff(12.345678, 4, 't')).toThrow(PilaSerializationError);
  });

  it('rechaza overflow y caracteres no numéricos', () => {
    expect(() => padAlphaRight('ABCDEFGHIJ', 5, 'name')).toThrow(PilaSerializationError);
    expect(() => padNumericLeft('12A', 5, 'num')).toThrow(PilaSerializationError);
  });

  it('sanitiza caracteres especiales / acentos', () => {
    expect(sanitizePilaAlpha('Pérez Niño')).toBe('PEREZ NINO');
    expect(sanitizePilaAlpha('A@B#C')).toBe('ABC');
    expect(sanitizePilaAlpha("O&'Brien")).toBe('OBRIEN');
    expect(sanitizePilaAlpha('14-11')).toBe('1411');
    expect(sanitizePilaAlpha('14-11', { allowHyphen: true })).toBe('14-11');
  });

  it("normaliza MUÑOZ, D'ANGELO y PÉREZ & ASOCIADOS", () => {
    expect(sanitizePilaAlpha('MUÑOZ')).toBe('MUNOZ');
    expect(sanitizePilaAlpha("D'ANGELO")).toBe('DANGELO');
    expect(sanitizePilaAlpha('PÉREZ & ASOCIADOS')).toBe('PEREZ ASOCIADOS');
  });

  it('colapsa espacios tras eliminar caracteres', () => {
    expect(sanitizePilaAlpha('ANA   MARÍA')).toBe('ANA MARIA');
    expect(sanitizePilaAlpha('  PEREZ  ')).toBe('PEREZ');
  });

  it('encoding ASCII: longitud en bytes === caracteres', () => {
    const cleaned = sanitizePilaAlpha('Ñandú & Co.');
    expect(cleaned).toBe('NANDU CO');
    expect(Buffer.byteLength(cleaned, 'ascii')).toBe(cleaned.length);
    expect([...cleaned].every((ch) => ch.charCodeAt(0) <= 127)).toBe(true);
  });

  it('campos vacíos se representan con espacios o ceros', () => {
    expect(padAlphaRight('', 3, 'a')).toBe('   ');
    expect(padNumericLeft('', 3, 'n')).toBe('000');
  });
});

describe('PilaRecordType1Serializer', () => {
  const serializer = new PilaRecordType1Serializer();

  it('genera exactamente 359 caracteres', () => {
    const draft = buildCleanPilaDraft();
    const line = serializer.serialize(draft.aportante, 1, 1_500_000);
    expect(line).toHaveLength(PILA_RECORD_TYPE1_LENGTH);
  });

  it('conserva guion en código ARL y mide bytes ASCII', () => {
    const draft = buildCleanPilaDraft();
    const line = serializer.serialize(draft.aportante, 1, 1_500_000);
    expect(line.slice(298, 304)).toBe('14-11 ');
    expect(Buffer.byteLength(line, 'ascii')).toBe(PILA_RECORD_TYPE1_LENGTH);
  });

  it('incluye períodos salud/otros y secuencia 0001', () => {
    const draft = buildCleanPilaDraft();
    const line = serializer.serialize(draft.aportante, 1, 1_500_000);
    expect(line.slice(0, 2)).toBe('01');
    expect(line.slice(2, 3)).toBe('1');
    expect(line.slice(3, 7)).toBe('0001');
    expect(line.slice(304, 311)).toBe('2026-06'); // periodOther
    expect(line.slice(311, 318)).toBe('2026-07'); // periodHealth
  });
});

describe('PilaRecordType2Serializer', () => {
  const serializer = new PilaRecordType2Serializer();

  it('genera exactamente 693 caracteres', () => {
    const draft = buildCleanPilaDraft();
    const line = serializer.serialize(draft.cotizantes[0], 1);
    expect(line).toHaveLength(PILA_RECORD_TYPE2_LENGTH);
  });

  it('secuencias correctas y campos vacíos de novedades', () => {
    const draft = buildCleanPilaDraft();
    const line = serializer.serialize(draft.cotizantes[0], 3);
    expect(line.slice(0, 2)).toBe('02');
    expect(line.slice(2, 7)).toBe('00003');
    expect(line.slice(136, 151)).toBe(' '.repeat(15)); // novedades 15–29
  });
});

describe('PilaFixedWidthSerializer', () => {
  const serializer = new PilaFixedWidthSerializer();

  it('archivo con un empleado: 1 + N líneas y longitudes exactas', () => {
    const result = serializer.serialize(buildCleanPilaDraft({ employeeCount: 1 }));
    expect(result.lineCount).toBe(2);
    expect(result.type1Length).toBe(359);
    expect(result.type2Lengths).toEqual([693]);
    expect(result.encoding).toBe(PILA_FILE_ENCODING);
    expect(result.lineTerminator).toBe(PILA_LINE_TERMINATOR);
    expect(result.suggestedFileName).toBe(
      suggestedPilaFileName({ nit: '900000000', periodHealth: '2026-07' }),
    );
  });

  it('archivo con varios empleados', () => {
    const result = serializer.serialize(buildCleanPilaDraft({ employeeCount: 2 }));
    expect(result.lineCount).toBe(3);
    expect(result.type2Lengths).toEqual([693, 693]);
    const lines = result.content.split(PILA_LINE_TERMINATOR);
    expect(lines[1].slice(2, 7)).toBe('00001');
    expect(lines[2].slice(2, 7)).toBe('00002');
  });

  it('valor que excede longitud lanza error técnico', () => {
    const draft = buildCleanPilaDraft();
    draft.cotizantes[0].firstLastName = 'APELLIDODEMASIADOLARGOPARAELCAMPO';
    expect(() => serializer.serialize(draft)).toThrow(PilaSerializationError);
  });

  it('golden file un empleado', () => {
    const result = serializer.serialize(buildCleanPilaDraft({ employeeCount: 1 }));
    expect(result.content).toBe(readGolden('pila-clean-one-employee.txt'));
  });

  it('golden file dos empleados', () => {
    const result = serializer.serialize(buildCleanPilaDraft({ employeeCount: 2 }));
    expect(result.content).toBe(readGolden('pila-clean-two-employees.txt'));
  });

  it('determinismo: mismo draft produce exactamente los mismos bytes', () => {
    const draft = buildCleanPilaDraft({ employeeCount: 2 });
    const a = serializer.serialize(draft);
    const b = serializer.serialize(draft);
    expect(a.bytes.equals(b.bytes)).toBe(true);
    expect(a.content).toBe(b.content);
    expect(a.bytes.byteLength).toBe(a.content.length);
  });

  it('no muta nombres originales del draft al serializar (snapshot conserva Unicode)', () => {
    const draft = buildCleanPilaDraft();
    draft.cotizantes[0].firstLastName = 'MUÑOZ';
    draft.aportante.legalName = 'PÉREZ & ASOCIADOS';
    serializer.serialize(draft);
    expect(draft.cotizantes[0].firstLastName).toBe('MUÑOZ');
    expect(draft.aportante.legalName).toBe('PÉREZ & ASOCIADOS');
  });
});
