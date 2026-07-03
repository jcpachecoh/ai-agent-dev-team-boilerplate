# MES-09 Task 04 — PDF Generation Endpoint

## Goal

Implement `GET /api/plant/orders/:id/pdf` producing a PDF that matches the physical **ORDEN DE PRODUCCIÓN** layout, populated from order detail data.

**Depends on:** Task 03  
**Blocks:** Web-app task 03, task 05 tests

---

## Scope

- Add PDF dependency to `apps/api` (`pdfkit` + `@types/pdfkit` or `pdf-lib`).
- Branding asset: copy Palos de Leña logo into `apps/api/assets/branding/palos-de-lena-logo.png`.
- `ProductionOrderPdfService` — layout builder.
- Controller route streaming PDF buffer.
- Filename: `OP-{number}.pdf`.

---

## Out of Scope

- Client-side PDF (web uses download from API).
- Multi-language templates (Spanish only, matching form).

---

## Files allowed

- `apps/api/package.json`
- `apps/api/assets/branding/**`
- `apps/api/src/mes/plant/**`

---

## Layout specification (match physical form)

Use **A4 portrait**, monospace/table borders, black headers on white (print-friendly).

### Header row

| Left              | Center                                    | Right                                                                 |
| ----------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| Logo (~40mm wide) | **ORDEN DE PRODUCCIÓN** (bold, uppercase) | Box: COPIA CONTROLADA — CÓDIGO: XXXXX, VERSIÓN: XXXXX, EMISIÓN: XXXXX |

### Order info band

Two-column grid:

- **ITEM:** `{recipe finished product / name}`
- **FECHA DE GENERACIÓN OP:** `{createdAt dd/MM/yy}`
- **OP. N°:** `{number}`
- **LOTE PT** (if `lotNumber`): optional sub-line

### Table 1 — Materiales

Columns: MATERIALES | LOTE | CANTIDAD REQUERIDA | CANTIDAD CONSUMIDA | UNIDAD DE MEDIDA

- One row per `ProductionOrderMaterial`
- Empty cells when null
- Format decimals with 3 places (match form: `24.000`)

### Production specs band

| Label                          | Value                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| FECHA DE PRODUCCIÓN            | `productionDate` or blank line                                                      |
| FECHA DE ENTREGA DE PRODUCCIÓN | `deliveryDate` or blank                                                             |
| PRODUCCIÓN ESPERADA KG         | `plannedQuantity`                                                                   |
| PRODUCCIÓN OBTENIDA (KGS)      | `producedQuantity` or blank                                                         |
| CANTIDAD DE BATCHES A PRODUCIR | `batchCount` (allow decimal display if stored as decimal elsewhere — use Int as-is) |
| PESO APROXIMADO POR PAQUETE    | `packageWeight` or blank                                                            |
| PESO TOTAL DEL BATCHE          | `batchWeight` or blank                                                              |

### Table 2 — Rutas de proceso

Columns: OPERACIÓN | HORA INICIAL | HORA FINAL | N° OPERARIOS | CANTIDAD ENTREGADA | RESPONSABLE

- Rows ordered by `ProductionPhase.order`
- Times: `HH:mm` from `startedAt` / `completedAt` (tenant TZ: America/Bogota default)

### Table 3 — Liberación MP (quality)

Section title: **LIBERACION MP**

Header row: (blank) | TEMPERATURA | COLOR | OLOR | TEXTURA

Rows for each `ProductionQualityCheckType` (Spanish labels):

- LIBERACION MP
- CORRECCION
- ACCION CORRECTIVA
- ENTREGA
- RECIBE

### Table 4 — Coproductos

Columns: ITEM | UM | CANTIDAD REAL | LOTE | VENCE

- Rows from `ProductionByproduct`
- VENCE: `dd/MM/yyyy`

### Footer

**OBSERVACIONES:** multi-line box with `notes` or empty ruled area (~4 lines).

---

## Service design

```typescript
@Injectable()
export class ProductionOrderPdfService {
  async buildPdf(tenantId: string, orderId: string): Promise<Buffer>;
}
```

- Load order via existing repository detail method (single query graph).
- No DB access in layout helpers — pass DTO.
- Handle missing sections gracefully (empty tables with header only).

---

## HTTP

```typescript
@Get('orders/:id/pdf')
@Roles(MesRole.SUPERVISOR, MesRole.OWNER)
async downloadPdf(@Param('id') id: string, @Res() res: Response) {
  const buffer = await this.pdfService.buildPdf(tenantId, id);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="OP-${number}.pdf"`,
    'Content-Length': buffer.length,
  });
  res.send(buffer);
}
```

---

## Acceptance criteria

- [ ] PDF opens in viewer; logo visible; tables aligned.
- [ ] All form sections present even when data empty.
- [ ] 404 when order not in tenant.
- [ ] Manual smoke: generate PDF for seeded OP with materials + 2 phases.
