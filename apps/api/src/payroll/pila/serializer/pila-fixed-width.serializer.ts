import type { PilaPeriodDraft } from '../pila-preparation.interfaces';
import {
  PILA_FILE_ENCODING,
  PILA_LINE_TERMINATOR,
  PILA_TRAILING_NEWLINE,
  suggestedPilaFileName,
} from './pila-fixed-width.constants';
import { assertAsciiByteLength, PilaSerializationError } from './pila-fixed-width.format';
import { PilaRecordType1Serializer } from './pila-record-type1.serializer';
import { PilaRecordType2Serializer } from './pila-record-type2.serializer';

export interface PilaFlatFileResult {
  /** Contenido exacto del archivo (CRLF entre líneas). */
  content: string;
  /** Bytes ASCII del contenido. */
  bytes: Buffer;
  encoding: typeof PILA_FILE_ENCODING;
  lineTerminator: typeof PILA_LINE_TERMINATOR;
  suggestedFileName: string;
  type1Length: number;
  type2Lengths: number[];
  lineCount: number;
}

/**
 * Serializador puro: `PilaPeriodDraft` validado → archivo plano Anexo Técnico 2 v29.
 * Sin Prisma, OS-380, HTTP ni persistencia.
 */
export class PilaFixedWidthSerializer {
  private readonly type1 = new PilaRecordType1Serializer();
  private readonly type2 = new PilaRecordType2Serializer();

  serialize(draft: PilaPeriodDraft, options?: { version?: number }): PilaFlatFileResult {
    if (!draft.cotizantes.length) {
      throw new PilaSerializationError(
        'cotizantes',
        '[]',
        'El draft no tiene cotizantes para serializar',
      );
    }

    const totalIbc = draft.cotizantes.reduce((sum, c) => sum + c.contributionBase, 0);
    const header = this.type1.serialize(draft.aportante, draft.cotizantes.length, totalIbc);

    const detailLines = draft.cotizantes.map((c, index) => this.type2.serialize(c, index + 1));

    const lines = [header, ...detailLines];
    if (lines.length !== 1 + draft.cotizantes.length) {
      throw new PilaSerializationError(
        'lineCount',
        String(lines.length),
        'Cantidad de líneas inconsistente con cotizantes',
      );
    }

    let content = lines.join(PILA_LINE_TERMINATOR);
    if (PILA_TRAILING_NEWLINE) {
      content += PILA_LINE_TERMINATOR;
    }

    assertAsciiByteLength(content, content.length, 'pilaFlatFile.bytes');

    const bytes = Buffer.from(content, PILA_FILE_ENCODING);
    if (bytes.byteLength !== content.length) {
      throw new PilaSerializationError(
        'pilaFlatFile.bytes',
        `chars=${content.length},bytes=${bytes.byteLength}`,
        'Buffer ASCII no coincide con longitud en caracteres',
      );
    }

    return {
      content,
      bytes,
      encoding: PILA_FILE_ENCODING,
      lineTerminator: PILA_LINE_TERMINATOR,
      suggestedFileName: suggestedPilaFileName({
        nit: draft.aportante.nit,
        periodHealth: draft.aportante.periodHealth,
        version: options?.version,
      }),
      type1Length: header.length,
      type2Lengths: detailLines.map((l) => l.length),
      lineCount: lines.length,
    };
  }
}
