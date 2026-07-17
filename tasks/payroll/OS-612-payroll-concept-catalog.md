# OS-612 — NOM-22 Catálogo normalizado de conceptos de nómina

**Domain:** `[BACKEND]` `[PAYROLL]` `[PRISMA]` `[REPORTS]` (FE mínimo solo lectura/reporte; sin CRUD)  
**Branch propuesta:** `feature/OS-612-payroll-concept-catalog`  
**Base:** `develop` (OS-380 motor mensual **mergeado** — consumir, no duplicar)  
**Status:** `PR1 — registry + modelo + seed GLOBAL (sin productores ni FK)`  
**Depends on:** OS-380 (mergeado), OS-591 (`SettlementLine` + códigos automáticos), OS-585 (patrón GLOBAL/`tenantScope`)  
**Consumidores futuros:** NOM-24 (informe comparativo / labels), NOM-25 (sin definición local en repo — ver §14)

> **PR0** congeló arquitectura. **PR1** implementó registry + `PayrollConcept` + seed GLOBAL + servicio de resolución (sin endpoints, sin FK `SettlementLine`, sin productores).

---

## 1. Objetivo

Definir e implementar un **catálogo único de conceptos de nómina** cuya identidad funcional sea un `code` inmutable, de modo que:

1. Los productores (OS-591, mapping OS-380, exports) dejen de inventar etiquetas en paralelo.
2. Los documentos históricos (`SettlementLine.code` / `name`) sigan siendo snapshots válidos.
3. Se pueda medir cobertura **usados vs. catalogados** sin reescribir historia ni crear un ledger mensual nuevo.

**No** es objetivo de v1 un CRUD administrativo ni un segundo motor de liquidación.

---

## 2. Alcance (v1 / este ticket)

| Incluye                                          | Detalle                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------- |
| Decisiones de identidad y scope                  | `code` inmutable; label mutable; GLOBAL + override de etiqueta            |
| Registry TypeScript + tabla mínima + seed GLOBAL | Códigos OS-591 + mapping obligatorio campos OS-380                        |
| Resolver central                                 | `code` → `{ displayName, lineNature, … }` con override tenant de etiqueta |
| Integración OS-591                               | Aggregator/manual usan registry; líneas nuevas pueden guardar `conceptId` |
| Adapter OS-380                                   | Mapping campo → código; labels Excel/PDF desde resolver                   |
| Reporte usados vs. catalogados                   | SettlementLine distinct + coverage de campos OS-380                       |
| Ajustes manuales controlados                     | Código fijo `AJUSTE_MANUAL` + descripción snapshot                        |
| Documentación SDD (este archivo)                 | PR0                                                                       |

### 2.1 Fuera de alcance

| Exclusión                                                           | Motivo                                                              |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| CRUD administrativo del catálogo                                    | Explícito v1; seed + registry bastan                                |
| Ledger / líneas persistidas de período OS-380                       | Sin persistencia de líneas mensuales hoy; ticket no la introduce    |
| Almacenar `conceptId` en filas OS-380 / `EmployeePayrollPeriod`     | OS-380 no persiste líneas; ver §10                                  |
| Vigencias (`validFrom`/`validTo`) en conceptos                      | Sin caso funcional comprobado en v1                                 |
| Flags de afectación de bases (IBC, neto, PILA, etc.)                | Sin caso funcional comprobado en v1                                 |
| Semilla FSP / Ley 1607                                              | Productor ausente en OS-380; no inventar códigos “fantasma” activos |
| Reescritura de `SettlementLine` históricas                          | Snapshot inmutable                                                  |
| Códigos dinámicos generados desde texto libre                       | Prohibido; ver §8.5                                                 |
| Sustituir `NovedadType` / `LeaveOrigin` / `LaborLegalParameter.key` | No son identidades de concepto                                      |
| Contabilidad / asientos (posibles NOM-18/NOM-25)                    | Fuera de este ticket                                                |
| Cambios PILA Anexo 2 por conceptos                                  | PILA consume montos OS-380; no requiere catálogo UI en v1           |

---

## 3. Decisiones congeladas (PR0)

| ID  | Decisión                                                                                                                                      | Estado        |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| D1  | Identidad funcional = **`code`** SCREAMING_SNAKE **inmutable**                                                                                | **Congelada** |
| D2  | `displayName` (alias ticket: `canonicalName`) = **etiqueta mutable**, nunca clave única                                                       | **Congelada** |
| D3  | **No** implementar `@@unique([tenantId, canonicalName])`                                                                                      | **Congelada** |
| D4  | Unique de catálogo: `@@unique([tenantScope, code])` (patrón OS-585 `tenantScope`)                                                             | **Congelada** |
| D5  | Fuente inicial: códigos OS-591 + mapping explícito campo→código OS-380                                                                        | **Congelada** |
| D6  | Catálogo **GLOBAL** con **override de tenant**                                                                                                | **Congelada** |
| D7  | Override tenant **solo** personaliza etiqueta (`displayName`), salvo evidencia futura aprobada                                                | **Congelada** |
| D8  | `SettlementLine.code` / `name` continúan como **snapshot histórico**                                                                          | **Congelada** |
| D9  | Líneas automáticas **nuevas** podrán guardar `conceptId` (FK nullable); histórico **no** se reescribe obligatoriamente                        | **Congelada** |
| D10 | OS-380 **no** tendrá ledger de líneas en este ticket                                                                                          | **Congelada** |
| D11 | Campos OS-380 tienen mapping **obligatorio** campo → código (TS const / tabla)                                                                | **Congelada** |
| D12 | `SettlementLineType`, `NovedadType`, `LeaveOrigin`, `LaborLegalParameter.key` **no** son identidades de concepto                              | **Congelada** |
| D13 | Sin CRUD admin en v1                                                                                                                          | **Congelada** |
| D14 | Sin vigencias ni flags de bases en v1                                                                                                         | **Congelada** |
| D15 | No sembrar FSP / Ley 1607 hasta que exista productor                                                                                          | **Congelada** |
| D16 | Ajustes libres: código fijo `AJUSTE_MANUAL` + descripción en snapshot; no códigos dinámicos                                                   | **Congelada** |
| D17 | Separar dimensiones: `lineNature` ∈ {`DEVENGO`,`DEDUCCION`,`APORTE_PATRONAL`,`INFORMATIVO`} — **no** un `ConceptCategory` monolítico mezclado | **Congelada** |
| D18 | Base de implementación: rama desde **`develop`**                                                                                              | **Congelada** |

---

## 4. Decisiones todavía abiertas

| ID  | Pregunta                                                                                                      | Nota                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| O1  | ¿NOM-25 es consumidor formal del catálogo (asientos / nómina electrónica / otro)?                             | **Sin definición en repo**; no bloquear PR1–PR5; revalidar al abrir NOM-25               |
| O2  | ¿El informe NOM-24 debe listar conceptos canónicos o solo totales por sede?                                   | Hoy el comparativo trabaja montos agregados; labels vía adapter OS-380 cuando exista PR4 |
| O3  | ¿Backfill `conceptId` en SettlementLine es best-effort por `code` exacto o también por alias de `name`?       | Preferencia PR0: **solo `code` exacto**; alias de name queda abierto                     |
| O4  | ¿Permiso RBAC nuevo para GET catálogo / reporte?                                                              | Posible reutilizar `nomina.*.read` existente; decidir en PR1/PR5                         |
| O5  | Nombre Prisma del modelo (`PayrollConcept` vs `PayrollConceptCatalog`)                                        | **Cerrado en PR1:** `PayrollConcept` / `@@map("payroll_concepts")`                       |
| O6  | ¿`PRIMA` (código OS-591 actual) se renombra a `PRIMA_SERVICIOS` en catálogo con alias, o se conserva `PRIMA`? | **Cerrado en PR1:** se conserva `PRIMA`                                                  |

---

## 5. Arquitectura actual (as-is)

```
OS-380 (on-demand)                    OS-591 (persistido)
EmployeePayrollPeriod fields    →     SettlementLine { code, name, type, … }
        │                                      │
        ├─ Excel/PDF headers hardcodeados      ├─ PDF liquidación usa name snapshot
        ├─ PILA consume montos (no labels UI)  └─ FE SettlementLinesTable muestra code/name
        └─ Sin conceptId / sin líneas DB

Paralelamente (NO son conceptos de línea):
  NovedadType, LeaveOrigin, LaborLegalParameter.key, EmployeeCatalogOption.pilaCode
```

### Evidencia en código (develop)

| Pieza                  | Ruta                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| Motor OS-380           | `apps/api/src/payroll/service/payroll-calculation.service.ts`                            |
| Shape período          | `apps/api/src/payroll/interfaces/payroll-report.interfaces.ts` → `EmployeePayrollPeriod` |
| Orquestación           | `apps/api/src/reports/service/reports.service.ts` → `getPayrollReport`                   |
| Aggregator códigos     | `apps/api/src/payroll/service/final-settlement-aggregator.service.ts`                    |
| Modelo líneas          | `apps/api/prisma/schema.prisma` → `SettlementLine`                                       |
| Excel headers          | `apps/api/src/reports/service/report-excel.service.ts`                                   |
| Patrón GLOBAL/override | `LaborLegalParameter` / `TaxWithholdingBracket` (`tenantScope`)                          |

---

## 6. Fuentes de verdad actuales

| Dominio                | Fuente de verdad hoy                         | ¿Identidad de concepto?                            |
| ---------------------- | -------------------------------------------- | -------------------------------------------------- |
| Liquidación mensual    | Campos tipados `EmployeePayrollPeriod`       | **De facto** vía nombre de campo TS — sin catálogo |
| Liquidación definitiva | `SettlementLine.code` + `name` (snapshot)    | **Sí** (código string libre + label)               |
| Tipo contable línea    | `SettlementLineType` (`DEVENGO`/`DEDUCCION`) | No — es naturaleza, no concepto                    |
| Novedades              | `NovedadType`                                | No — tipo de evento                                |
| Incapacidades          | `LeaveOrigin` / montos en OS-380             | No — origen médico                                 |
| Parámetros legales     | `LaborLegalParameter.key`                    | No — parámetro, no línea                           |
| Fondos/EPS             | `EmployeeCatalogOption` (+ `pilaCode`)       | No — catálogo afiliación                           |

**Conclusión:** no hay una sola SoT de conceptos. OS-612 introduce el catálogo como SoT de **definición**; los documentos siguen siendo SoT de **histórico emitido**.

---

## 7. Arquitectura objetivo (to-be)

```
                    ┌─────────────────────────────────────┐
                    │  PayrollConcept (GLOBAL + override) │
                    │  PK id · unique(tenantScope, code)  │
                    │  code IMMUTABLE · displayName       │
                    │  lineNature                         │
                    └──────────────┬──────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
   TS Registry (cerrado)   Resolver central      Seed GLOBAL
   OS380_FIELD→code        resolve(code,tenant)  upsert by code
              │                    │
              ▼                    ▼
   Excel/PDF labels      OS-591 aggregator (nuevas líneas)
   (sin ledger OS-380)   SettlementLine.code/name snapshot
                         + conceptId nullable (forward only)
```

### 7.1 Reglas de resolución GLOBAL / tenant

1. Buscar override activo: `tenantScope = tenantId` + `code` + `deletedAt IS NULL`.
2. Si no hay override → fila GLOBAL: `tenantScope = 'GLOBAL'` + mismo `code`.
3. Override v1: **solo** puede diferir en `displayName` (y metadatos de auditoría).  
   `code`, `lineNature` y existencia del concepto **no** se overridean.
4. Si el código no existe en GLOBAL → error de programación / seed incompleto (fail-fast en productores automáticos).
5. Resolución de etiqueta para UI/export: `override.displayName ?? global.displayName`.
6. Snapshot al emitir documento: copiar `code` + `displayName` resuelto a `SettlementLine.code` / `name` (o header Excel). El documento **no** depende de mutaciones futuras del catálogo.

### 7.2 Qué no es `conceptId` en OS-380

Ver §10. El mapping campo→código es **obligatorio en código** (adapter), no una columna en el motor.

---

## 8. Matriz inicial de códigos canónicos

### 8.1 Liquidación definitiva (OS-591) — conservar codes existentes

| code                  | displayName inicial                           | lineNature                      | Productor                                |
| --------------------- | --------------------------------------------- | ------------------------------- | ---------------------------------------- |
| `SAL_PENDIENTE`       | Salario pendiente                             | DEVENGO                         | `final-settlement-aggregator.service.ts` |
| `CESANTIAS`           | Cesantías (saldo pendiente)                   | DEVENGO                         | idem / OS-588                            |
| `INTERESES_CESANTIAS` | Intereses sobre cesantías (saldo pendiente)   | DEVENGO                         | idem                                     |
| `PRIMA`               | Prima de servicios (saldo pendiente)          | DEVENGO                         | idem / PrimaService                      |
| `VACACIONES`          | Vacaciones pendientes                         | DEVENGO                         | idem / OS-589                            |
| `INDEMNIZACION`       | Indemnización por terminación sin justa causa | DEVENGO                         | idem                                     |
| `AJUSTE_MANUAL`       | Ajuste manual                                 | DEVENGO o DEDUCCION según línea | Manual OS-591                            |

> Subconceptos en metadata de pending-salary (`SALARIO_BASE_PENDIENTE`, `DESCUENTO_NOVEDADES_NO_REMUNERADAS`, `HORAS_EXTRA_PENDIENTES`) **no** son códigos de catálogo v1; permanecen en `metadata` de `SAL_PENDIENTE` hasta un ticket que los eleve.

### 8.2 Mapping obligatorio OS-380 (campo → code)

| Campo `EmployeePayrollPeriod`   | code                              | lineNature      | Notas                                                                                        |
| ------------------------------- | --------------------------------- | --------------- | -------------------------------------------------------------------------------------------- |
| `salaryBase`                    | `SALARIO_BASE`                    | DEVENGO         |                                                                                              |
| `transportSubsidy`              | `AUXILIO_TRANSPORTE`              | DEVENGO         |                                                                                              |
| `overtimePay`                   | `HORAS_EXTRA`                     | DEVENGO         | Desglose tipado sigue en `overtimeBreakdown`; codes HE\_\* opcionales en fase endurecimiento |
| `medicalLeaveEmployerPay`       | `INCAPACIDAD_EMPLEADOR`           | DEVENGO         |                                                                                              |
| `medicalLeaveEpsArlPay`         | `INCAPACIDAD_EPS_ARL`             | INFORMATIVO     | No suma neto empleado de la misma forma; etiqueta de reporte                                 |
| `payrollNovedadUnpaidDeduction` | `DESCUENTO_NOVEDAD_NO_REMUNERADA` | DEDUCCION       | Agregado; no 1:1 con `NovedadType`                                                           |
| `healthDeduction`               | `APORTE_SALUD_EMPLEADO`           | DEDUCCION       |                                                                                              |
| `pensionDeduction`              | `APORTE_PENSION_EMPLEADO`         | DEDUCCION       |                                                                                              |
| `incomeTaxWithholding`          | `RETENCION_FUENTE`                | DEDUCCION       | OS-594                                                                                       |
| `employerHealthContribution`    | `APORTE_SALUD_PATRONAL`           | APORTE_PATRONAL |                                                                                              |
| `employerPensionContribution`   | `APORTE_PENSION_PATRONAL`         | APORTE_PATRONAL |                                                                                              |
| `employerArlContribution`       | `APORTE_ARL_PATRONAL`             | APORTE_PATRONAL |                                                                                              |
| `employerSenaContribution`      | `APORTE_SENA`                     | APORTE_PATRONAL |                                                                                              |
| `employerIcbfContribution`      | `APORTE_ICBF`                     | APORTE_PATRONAL |                                                                                              |
| `employerCajaContribution`      | `APORTE_CCF`                      | APORTE_PATRONAL |                                                                                              |

**No catalogar en v1 (sin productor):** `FSP_SOLIDARIDAD`, `FSP_SUBSISTENCIA`, conceptos Ley 1607.

### 8.3 Códigos internos no-catálogo (referencia)

| Identificador                                                | Tratamiento                                                                                                 |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `OVERTIME` / `OVERTIME:DIURNO`… (variable-average)           | Interno de cálculo; alinear labels a `HORAS_EXTRA` / HE\_\* en endurecimiento opcional                      |
| `NovedadType.*`                                              | Evento; no fila de catálogo                                                                                 |
| `LaborLegalParameter` keys (`SMLV`, `AUXILIO_TRANSPORTE`, …) | Parámetro; el code de concepto `AUXILIO_TRANSPORTE` es **distinto** de la key legal aunque compartan string |

### 8.4 Ajustes manuales

- Código único: `AJUSTE_MANUAL`.
- `SettlementLine.name` / justificación = texto snapshot del usuario.
- `SettlementLineType` sigue discriminando DEVENGO vs DEDUCCION.
- **Prohibido** generar `code` desde el texto del ajuste.

---

## 9. Compatibilidad histórica

| Artefacto                                       | Política                                                                         |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| `SettlementLine` existente                      | No UPDATE masivo de `code`/`name`. Siguen siendo la verdad del documento emitido |
| `conceptId` NULL en histórico                   | Válido indefinidamente                                                           |
| Backfill `conceptId`                            | Solo donde `code` coincide exactamente con catálogo GLOBAL; nunca cambiar `name` |
| PDF/Excel ya generados / descargados            | Fuera de alcance; no regenerar para “arreglar” labels                            |
| Exports regenerables (reporte nómina on-demand) | Pueden adoptar labels del resolver en PR4 **sin** mutar DB                       |
| `EmployeePaymentHistory.deductionBreakdown`     | JSON opaco; fuera de backfill v1                                                 |

---

## 10. Interpretación del AC `conceptId` para OS-380

**Afirmación congelada:** OS-612 **no** almacena `conceptId` en el motor OS-380 ni en `EmployeePayrollPeriod`, porque **no existe persistencia de líneas mensuales**.

| Interpretación correcta del AC                                                           | Interpretación incorrecta (rechazada)     |
| ---------------------------------------------------------------------------------------- | ----------------------------------------- |
| Mapping obligatorio campo→`code` en TypeScript/registry                                  | Columna `conceptId` en resultado OS-380   |
| Labels de Excel/PDF resueltos por `code` vía resolver                                    | Ledger `PayrollPeriodLine` en este ticket |
| Reporte “usados” OS-380 = coverage de campos mapeados (emitidos si monto ≠ 0 en corrida) | Distinct de líneas DB del período mensual |

Si un ticket futuro introduce persistencia de líneas de período, **entonces** esas líneas nuevas podrán llevar `conceptId`. Eso es **otro ticket**, no OS-612 v1.

---

## 11. Modelo de datos (implementado en PR1)

```prisma
enum PayrollConceptLineNature {
  DEVENGO
  DEDUCCION
  APORTE_PATRONAL
  INFORMATIVO
}

model PayrollConcept {
  id          String                   @id @default(cuid())
  tenantId    String? // null = GLOBAL; valor = override de etiqueta
  tenantScope String                   @default("GLOBAL")
  code        String
  displayName String
  lineNature  PayrollConceptLineNature
  deletedAt   DateTime?
  createdAt   DateTime                 @default(now())
  updatedAt   DateTime                 @updatedAt

  @@unique([tenantScope, code])
  @@index([tenantScope, code, deletedAt])
  @@index([deletedAt])
  @@map("payroll_concepts")
}
```

Migración única: `apps/api/prisma/migrations/20260717010000_os612_payroll_concept_catalog/`
(tabla `payroll_concepts` + `SettlementLine.conceptId` + backfill).

**Comportamiento inactivo (`deletedAt` set):**

- GLOBAL soft-deleted → `resolveEffective` / `findGlobalByCode` fallan (NotFound); un override no revive el concepto.
- Override soft-deleted → se ignora; se usa displayName GLOBAL.
- Seed GLOBAL **no** toca `deletedAt` (preserva desactivaciones) y **no** modifica filas tenant.

**Rechazado explícitamente:** `@@unique([tenantId, canonicalName])`.

Sin `validFrom`/`validTo`, sin flags IBC/neto, sin FK `SettlementLine` (PR3).

---

## 12. Migraciones previstas por fase

| Fase                  | Migración                         | Contenido                                                               |
| --------------------- | --------------------------------- | ----------------------------------------------------------------------- |
| PR0                   | —                                 | Ninguna                                                                 |
| PR1 + PR3 (unificado) | `…_os612_payroll_concept_catalog` | Tabla `payroll_concepts` + enum + `SettlementLine.conceptId` + backfill |
| PR2                   | —                                 | Sin schema (solo código resolver + aggregator)                          |
| PR4–PR7               | —                                 | Sin schema salvo hallazgos; no ledger OS-380                            |

Schema y migración **separados** de lógica según reglas del repo; no `prisma migrate dev` fuera del task de implementación.

---

## 13. Seeds

| Seed                                          | Contenido                                                       | Idempotencia                                     |
| --------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------ |
| `payroll-concepts.seed.ts` (nombre tentativo) | Upsert GLOBAL por `code` — matriz §8.1 + §8.2 + `AJUSTE_MANUAL` | `upsert` / find+update por `(tenantScope, code)` |
| Wiring en `seed.ts`                           | Llamada al seed de conceptos                                    | Igual que otros seeds payroll                    |
| FSP / Ley 1607                                | **No**                                                          | Hasta productor                                  |
| Overrides demo tenant                         | Opcional; no requerido v1                                       | —                                                |

---

## 14. Dependencias: OS-380, NOM-24, NOM-25

| Dependencia | Relación con OS-612                                                                                                                             | Bloqueo                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **OS-380**  | Productor de montos; mapping campo→code; **sin** ledger nuevo                                                                                   | No bloquea: mergeado en `develop`                                                       |
| **NOM-24**  | Informe comparativo / costos por sede (CONN-06). Puede consumir labels del resolver vía mismos montos OS-380; **no** requiere `conceptId` en DB | No bloquea PR1–PR5; coordinar labels en PR4 si el informe muestra desglose de conceptos |
| **NOM-25**  | **Sin especificación en este repositorio** al momento de PR0. Tratar como consumidor futuro desconocido                                         | No bloquear implementación; reabrir O1 cuando exista ticket                             |

Gaps OS-380 ya conocidos (FSP, Ley 1607) **no** se “arreglan” sembrando conceptos: se documentan como ausentes (D15).

---

## 15. Reporte usados vs. catalogados

### 15.1 Alcance real v1

| Fuente “usados”   | Métrica                                                      | Limitación                                                      |
| ----------------- | ------------------------------------------------------------ | --------------------------------------------------------------- |
| `SettlementLine`  | `DISTINCT code` (y opcionalmente pares code/name) por tenant | Solo liquidación final; `AJUSTE_MANUAL` agrupa textos distintos |
| Mapping OS-380    | Set fijo de campos §8.2; “usado en corrida” si monto ≠ 0     | No hay filas DB; no es ledger                                   |
| Headers Excel/PDF | Tras PR4: deben salir del resolver                           | Antes: hardcode = deuda visible en reporte de coverage          |

### 15.2 Fuera del reporte v1

- Reescribir documentos.
- Inferir conceptos desde `NovedadType` counts.
- Prometer 100% coverage de texto libre histórico.

### 15.3 API (orientativa PR5)

- `GET` read-only: lista catálogo resuelto (GLOBAL + override etiquetas).
- `GET` reporte: `{ catalogCodes, settlementLineCodes, os380FieldCoverage, orphans[] }`.
- Sin POST/PATCH/DELETE de conceptos en v1.

---

## 16. Riesgos

| Riesgo                                                | Severidad | Mitigación                                                    |
| ----------------------------------------------------- | --------- | ------------------------------------------------------------- |
| Tercera SoT si se crea tabla sin cablear productores  | Alta      | Plan de PRs: registry → OS-591 → FK → OS-380 labels → reporte |
| Unique por display name                               | Alta      | D3/D4 — unique por `(tenantScope, code)`                      |
| Confundir AC `conceptId` con persistencia OS-380      | Alta      | §10; tests/docs deben afirmar mapping, no columna             |
| Códigos dinámicos desde ajustes                       | Media     | D16 — solo `AJUSTE_MANUAL`                                    |
| Sembrar FSP sin motor                                 | Media     | D15                                                           |
| NOM-25 mal interpretado como bloqueante               | Baja      | O1; no bloquear                                               |
| Renombrar `PRIMA` → `PRIMA_SERVICIOS` rompe snapshots | Media     | O6 — conservar `PRIMA`                                        |

---

## 17. Plan de PRs

| PR      | Nombre                         | Entregable                                                                                                           | Schema     |
| ------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------- |
| **PR0** | SDD / decisiones               | Este archivo                                                                                                         | No         |
| **PR1** | Registry + tabla + seed        | Const TS cerrada; migración `payroll_concepts`; seed GLOBAL; tests unicidad `code`                                   | Sí (tabla) |
| **PR2** | Resolver + OS-591              | `PayrollConceptResolver`; aggregator toma `displayName` del resolver; deja de hardcodear strings de name (code fijo) | No         |
| **PR3** | FK SettlementLine              | `conceptId` nullable; escritura forward en líneas nuevas; backfill seguro por `code`                                 | Sí (FK)    |
| **PR4** | Adapter OS-380 + Excel/PDF     | Mapping §8.2; headers desde resolver                                                                                 | No         |
| **PR5** | Reporte usados vs. catalogados | Endpoint/servicio read-only + tests                                                                                  | No         |
| **PR6** | Ajustes manuales controlados   | Validar/forzar `AJUSTE_MANUAL`; snapshot de descripción                                                              | No         |
| **PR7** | Endurecimiento opcional        | Fallar CI/producers si emiten code ausente del catálogo; HE\_\* opcionales                                           | No         |

**Regla SDD:** un PR = un task de implementación con Files allowed. No saltar a PR3 sin PR1–PR2 mergeados (o stacked consciente).

---

## 18. Acceptance Criteria — evidencia por fase

| AC     | Descripción                                                               | Evidencia esperada                       | Fase |
| ------ | ------------------------------------------------------------------------- | ---------------------------------------- | ---- |
| AC-0.1 | Decisiones de identidad y scope documentadas y rechazan unique por nombre | Este MD §3 D1–D4                         | PR0  |
| AC-0.2 | Documentación afirma que OS-380 **no** persiste `conceptId`               | §10 sin contradicciones                  | PR0  |
| AC-1.1 | Existe registry TS con codes §8.1+§8.2+`AJUSTE_MANUAL`                    | Archivo const + tests                    | PR1  |
| AC-1.2 | Tabla GLOBAL sembrada idempotente por `code`                              | Seed + `@@unique([tenantScope, code])`   | PR1  |
| AC-1.3 | No existe unique sobre displayName/canonicalName                          | Schema review                            | PR1  |
| AC-2.1 | Resolver aplica override solo de etiqueta                                 | Unit tests GLOBAL vs tenant              | PR2  |
| AC-2.2 | Aggregator OS-591 usa resolver para `name` de líneas automáticas          | Diff aggregator + tests                  | PR2  |
| AC-3.1 | `SettlementLine.conceptId` nullable; histórico intacto                    | Migración + filas viejas NULL            | PR3  |
| AC-3.2 | Líneas nuevas automáticas setean `conceptId` cuando hay match             | Service test                             | PR3  |
| AC-3.3 | Backfill no modifica `code`/`name`                                        | Script/migración solo UPDATE `conceptId` | PR3  |
| AC-4.1 | Todo campo §8.2 tiene mapping a code                                      | Const + test exhaustivo de keys          | PR4  |
| AC-4.2 | Excel/PDF nómina usan displayName del resolver                            | Snapshot/headers tests                   | PR4  |
| AC-4.3 | Ningún cambio introduce tabla de líneas mensuales OS-380                  | Diff schema vacío de ledger              | PR4  |
| AC-5.1 | Reporte lista orphans SettlementLine vs catálogo                          | API/test                                 | PR5  |
| AC-5.2 | Reporte lista coverage campos OS-380                                      | API/test                                 | PR5  |
| AC-6.1 | Manual lines usan `AJUSTE_MANUAL`; rechazo de codes inventados            | Validation tests                         | PR6  |
| AC-7.1 | (Opcional) producers fallan si code no catalogado                         | Guard + test                             | PR7  |

---

## 19. Divergencias respecto a la auditoría técnica previa

| Tema auditoría                                      | Decisión PR0                                         | Divergencia                             |
| --------------------------------------------------- | ---------------------------------------------------- | --------------------------------------- |
| Prefería posible rename `PRIMA` → `PRIMA_SERVICIOS` | Conservar `PRIMA` (O6)                               | Sí — compatibilidad snapshot priorizada |
| HE\_\* como canónicos de primer nivel               | `HORAS_EXTRA` agregado en v1; HE\_\* en PR7 opcional | Parcial — simplifica seed inicial       |
| Metadata pending-salary como codes                  | Quedan en metadata, no en catálogo v1                | Sí — reduce ruido del reporte           |
| `ConceptCategory` cuestionada                       | Reemplazada por `lineNature` acotado                 | Alineado (rechazo categoría mezclada)   |
| Unique `canonicalName`                              | Rechazada                                            | Alineado                                |
| Carpeta multi-task                                  | Un solo archivo `OS-612-payroll-concept-catalog.md`  | Alineado a precedente OS-595/OS-586     |

---

## 20. Postman

| Request               | Método / path                             | Notas                                                                     |
| --------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| Usados vs catalogados | `GET /api/reports/payroll-concepts/usage` | Insertado en colección reports (junto a sena-quota). Read-only. Sin CRUD. |

Roles: mismos `PAYROLL_MODULE_ROLES` que el resto de reportes de nómina.

---

## 21. Estado de implementación (rama `feature/OS-612-payroll-concept-catalog`)

| Fase         | Entregable                                                                | Estado              |
| ------------ | ------------------------------------------------------------------------- | ------------------- |
| PR0          | Este SDD                                                                  | Hecho               |
| PR1          | Registry TS + `payroll_concepts` + seed GLOBAL + `PayrollConceptsService` | Hecho               |
| PR2 / Fase 2 | Aggregator OS-591 → `resolveEffective` para `name`                        | Hecho               |
| PR3 / Fase 3 | `SettlementLine.conceptId` nullable + migración backfill por `code`       | Hecho               |
| PR4 / Fase 4 | Adapter `OS380_FIELD_TO_CONCEPT_CODE` + labels Excel/PDF                  | Hecho               |
| PR5 / Fase 5 | `GET /reports/payroll-concepts/usage` + Postman                           | Hecho               |
| PR6 / Fase 6 | Manual → `AJUSTE_MANUAL` + `conceptId`; rechazo codes inventados          | Hecho               |
| PR7          | Endurecimiento CI opcional HE\_\*                                         | Fuera de alcance v1 |

**Migración:**

- `20260717010000_os612_payroll_concept_catalog` (tabla + FK + backfill; unificada antes de merge)

**Seed:** `apps/api/prisma/seeds/payroll-concepts.seed.ts` (idempotente + re-backfill).

**Fuera de alcance confirmado:** ledger mensual OS-380; CRUD admin; FSP/Ley 1607; HE\_\*; cambios de cálculo; NOM-24/25; rename de codes históricos.

---

## 23. Seed runtime en imagen Docker (fix OS-612)

### Bug latente (OS-588)

`prisma/seeds/employee-compensation-history.seed-util.ts` importaba `EmployeeHistoryRepository` desde `../../src/payroll/repository/...`. En monorepo local eso funciona (`apps/api/src` existe). En el **runner** (`apps/api/Dockerfile`) solo se copian `dist` + `prisma` (+ packages/scripts) — **no** `/app/src`. Por tanto `npx prisma db seed` / `tsx prisma/seed.ts` fallaba con `MODULE_NOT_FOUND` **antes** de abrir PostgreSQL.

### Por qué se manifestó con OS-612

OS-612 añadió `seedPayrollConcepts` (también dependía de `src/payroll/payroll-concepts.constants`) y forzó a ejecutar el seed oficial en entornos con la imagen runner. El primer crash seguía siendo el import estático de compensación (línea temprana de `seed.ts`), no el registry OS-612.

### Solución compartida

| Decisión          | Detalle                                                                                                                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ubicación         | `apps/api/src/shared/**` — dentro de Nest `rootDir` (`tsconfig` `include: ["src"]`) y disponible como fuente TS para `tsx`                                                                                                         |
| Docker            | `COPY .../src/shared ./src/shared` **solo** ese árbol (no todo `src`, no imports desde `dist`)                                                                                                                                     |
| Historia salarial | Funciones puras `syncSalaryHistoryTx` / `syncFundHistoryTx` + `resolveInitialEffectiveDate` en `src/shared/employee-history/`; repository Nest delega; seed llama las funciones (sin `new EmployeeHistoryRepository({} as never)`) |
| Registry OS-612   | `src/shared/payroll/payroll-concepts.registry.ts`; `payroll-concepts.constants.ts` re-exporta para Nest                                                                                                                            |
| Otros seeds       | PILA codes/util, `GLOBAL_TENANT_SCOPE`, brackets RF — canónicos en `src/shared/`; paths Nest antiguos = re-exports                                                                                                                 |

### Archivos preexistentes tocados (además de `src/shared/` nuevo)

- `apps/api/Dockerfile` (COPY acotado)
- `employee-history.repository.ts`, `employee-history.interfaces.ts`
- Re-exports: `payroll-concepts.constants.ts`, `pila-admin-codes.ts`, `pila-master-data.util.ts`, `employee-history-effective-date.util.ts`, `tax-withholding-brackets.constants.ts`, `labor-legal-parameters.constants.ts` (scope)
- Seeds bajo `prisma/seeds/*` que apuntaban a `src/` no-shared

### Validación runner

Confirmar en imagen: `/app/src` (excepto `shared`) ausente; `/app/src/shared` presente; carga de seeds sin `MODULE_NOT_FOUND`; seed ×2 idempotente + 22 `PayrollConcept` GLOBAL.

---

## 22. Validación PR0 (histórico)

| Check                                            | Resultado           |
| ------------------------------------------------ | ------------------- |
| Archivo creado bajo `tasks/payroll/`             | Sí — este documento |
| §10 no afirma persistencia `conceptId` en OS-380 | Verificado          |
| Plan de PRs 1–7 documentado                      | §17                 |

---

_Última actualización: 2026-07-17 · OS-612 seed runtime fix (`src/shared` + Docker COPY acotado)_
