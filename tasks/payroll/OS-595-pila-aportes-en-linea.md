# OS-595 — NOM-16a Integración PILA (Aportes en Línea)

**Domain:** `[BACKEND]` `[FRONTEND]` `[PAYROLL]` `[REPORTS]` `[PRISMA]`  
**Branch:** `feature/OS-595-pila-export-aportes-en-linea`  
**Status:** `cerrado — fases 0–6 implementadas (pendiente merge PR)`  
**Norma:** Anexo Técnico 2 PILA — Aportes a Seguridad Social de Activos, **versión 29 (6 de enero de 2026)**  
**Depends on:** OS-380 (motor liquidación mensual — **mergeado**; consumir, no duplicar)

---

## 1. Objetivo

Permitir generar el **archivo plano** exigido por operadores de información (carga en Aportes en Línea / PILA) para el pago de aportes a seguridad social y parafiscales de un período, usando los **valores ya calculados por OS-380** (`PayrollCalculationService` vía `ReportsService.getPayrollReport` / proyección social-security).

No recalcular tasas ni inventar un segundo motor de aportes.  
No integrar API de pago con el operador.  
No emitir Nómina Electrónica DIAN (NOM-16b).

---

## 2. Alcance funcional inicial (v1)

| Parámetro                                     | Valor fijo v1                                               |
| --------------------------------------------- | ----------------------------------------------------------- |
| Tipo de planilla (reg. tipo 1, campo 8)       | **E** — Empleados                                           |
| Tipo de cotizante (reg. tipo 2, campo 5)      | **01** — Dependiente                                        |
| Forma de presentación (reg. tipo 1, campo 11) | **U** — Único                                               |
| Tipo aportante                                | **01** — Empleador                                          |
| Naturaleza jurídica                           | **2** — Privada                                             |
| Modalidad                                     | **1** — Electrónica (o la que asigne el operador al cargar) |
| Tenant                                        | Un empleador privado por tenant                             |
| Formato salida                                | Archivo plano de ancho fijo (Anexo Técnico 2)               |

**Incluye**

- Un registro tipo 1 (encabezado, 359 posiciones) + N registros tipo 2 (cotizante, hasta campo 98 / 693 posiciones según v29).
- Validaciones de elegibilidad previas a generar.
- Persistencia de archivo plano + snapshot JSON + estados.
- Confirmación **manual** de pago.
- UI mínima de generación/descarga (fases posteriores).

**Exclusiones explícitas**

- Planillas distintas de **E** (A, N, M, S, Y, U, K, F, J, X, Z, …).
- Cotizantes distintos de **01**.
- Forma **S** (sucursales) y multi-sucursal.
- Integración API / pago electrónico con Aportes en Línea.
- Nómina Electrónica DIAN (NOM-16b).
- Múltiples registros tipo 2 por el mismo cotizante (varios IBC / varias novedades en el mismo período) — **bloquea export** en v1.
- FSP (solidaridad / subsistencia) — **no calculado por OS-380**; ver §4 y bloqueos.
- Exoneración Ley 1607 / CREE — **no modelada**; ver §4.
- Aprendices (`APRENDIZAJE`), prestación de servicios (`PRESTACION`).
- UPC adicional, ESAP, MEN, cotizante 40.

---

## 3. Arquitectura

```
[UI Nómina / Reportes]
        │
        ▼
[PilaExportController]  ── roles PAYROLL_WRITE
        │
        ▼
[PilaExportService]
   ├─ PilaValidationService     (matriz caso soportado / no soportado)
   ├─ ReportsService.getPayrollReport / datos afiliación  ← OS-380 (sin motor paralelo)
   ├─ PilaFlatFileMapper        (Anexo Técnico 2 v29 → buffer fixed-width)
   ├─ PilaPeriodExportRepository
   └─ StorageService (domain PAYROLL)  ← archivo plano exacto
```

**Principio:** OS-595 es un **adaptador de formato + validación + trazabilidad**.  
Las cotizaciones, IBC y días base salen del motor mensual existente.

### Evidencia OS-380 en código

| Pieza                       | Ruta                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| Motor                       | `apps/api/src/payroll/service/payroll-calculation.service.ts`                   |
| Orquestación período        | `apps/api/src/reports/service/reports.service.ts` → `getPayrollReport`          |
| Proyección “PILA” JSON      | `getSocialSecurityReport` (solo aportes **patronales**; no es el plano Anexo 2) |
| Constantes %                | `apps/api/src/payroll/payroll.constants.ts`                                     |
| Incapacidades → liquidación | `payroll/utils/medical-leave-payroll.utils.ts`                                  |
| Novedades → liquidación     | `payroll/utils/payroll-novedad-payroll.utils.ts`                                |

---

## 4. Gaps OS-380 vs Anexo Técnico 2 (evidencia)

### 4.1 Fondo de Solidaridad Pensional (campos 51–52)

| Pregunta                                   | Respuesta | Evidencia                                                                                                                                                                   |
| ------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ¿OS-380 calcula FSP subcuenta solidaridad? | **No**    | `payroll.constants.ts` línea comentada: `GAP(Task04): fondo de solidaridad pensional (+1% sobre base > 4 SMLV — Ley 100 art. 27)`. Ningún campo en `EmployeePayrollPeriod`. |
| ¿OS-380 calcula subcuenta de subsistencia? | **No**    | Idem; sin lógica ni DTO.                                                                                                                                                    |

**Decisión v1:** si algún cotizante tiene IBC (contributionBase) **`>= 4 SMMLV`** del período → **bloquear exportación** con mensaje accionable (no inventar FSP en OS-595).  
Casos con IBC `< 4 SMMLV`: campos 51–52 en **cero**.

### 4.2 Exoneración salud / SENA / ICBF (Ley 1607, campo 76 + tarifas)

| Pregunta                                                      | Respuesta                                                | Evidencia                                                                                                                                                                    |
| ------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ¿Existe flag de exoneración aportante/cotizante?              | **No**                                                   | No hay campo en `Tenant` ni `EmployeeDetails`.                                                                                                                               |
| ¿OS-380 omite SENA/ICBF o reduce salud patronal por Ley 1607? | **No**                                                   | Siempre aplica `EMPLOYER_SENA_PCT` (2%), `EMPLOYER_ICBF_PCT` (3%), `EMPLOYER_HEALTH_PCT` (8.5%) si contrato no exento. Comentario GAP Ley 590 en constants, no implementado. |
| ¿Exento por tipo contrato?                                    | Solo `PRESTACION` / `APRENDIZAJE` → aportes patronales 0 | `EXEMPT_CONTRACT_TYPES` en calculation service — **no** es Ley 1607.                                                                                                         |

**Decisión v1:**

- Config tenant `exemptFromHealthSenaIcbfLey1607: boolean` (default `false`).
- Si `true` → **bloquear export** hasta que OS-380 (u otro ticket) calcule tarifas correctas (campo 54/66/68 y flag 76). No simular exoneración en el mapper PILA.
- Si `false` → emitir `N` en campo 76 y tarifas plenas derivadas del motor.

### 4.3 Días diferenciados por subsistema (campos 36–39)

| Pregunta                                                   | Respuesta                                                               | Evidencia                                                                                                                                         |
| ---------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| ¿OS-380 expone días cotizados pensión ≠ salud ≠ ARL ≠ CCF? | **No**                                                                  | Un solo `workedDays = attendance.presentDays`. Incapacidades/novedades ajustan `salaryBase` / montos, **no** cuatro contadores de días cotizados. |
| Vacaciones                                                 | Cuentan en `absentDays` del resumen; **no** reducen `workedDays` ni IBC | `buildAttendanceSummary(..., vacationDays)`                                                                                                       |

**Decisión v1 (happy path sin novedades bloqueantes):**

- Campos 36–39 = mismo valor derivado (regla documentada: `min(30, workedDays)` o 30 si mes completo sin ING/RET — ver validaciones).
- Si el período tiene IGE/VAC/SLN/ING/RET que **exigen** días distintos por subsistema según Anexo → **bloquear** (no inventar prorrateo PILA en v1).

### 4.4 IBC diferenciado por subsistema (campos 42–45, 95)

| Pregunta                          | Respuesta | Evidencia                                                                                               |
| --------------------------------- | --------- | ------------------------------------------------------------------------------------------------------- |
| ¿IBC pensión ≠ salud ≠ ARL ≠ CCF? | **No**    | Una sola `contributionBase` (integral 70% o salario prorrateado). Todas las cotizaciones usan esa base. |

**Decisión v1:** mapear `contributionBase` → campos 42, 43, 44, 45 y 95 (mismo entero COP). Aceptable para cotizante 01 sin novedades que rompan igualdad de IBC.  
Si en el futuro hay novedades que exijan IBC distinto por línea → fuera de v1 (multi-registro tipo 2).

### 4.5 Resumen gaps

| Capacidad PILA                 | OS-380 hoy                     | Impacto v1                                          |
| ------------------------------ | ------------------------------ | --------------------------------------------------- |
| FSP solidaridad/subsistencia   | Ausente                        | Bloqueo si IBC > 4 SMMLV                            |
| Exoneración Ley 1607           | Ausente                        | Bloqueo si config tenant = true; si false, emitir N |
| Días por subsistema            | Un solo workedDays             | OK solo sin novedades complejas                     |
| IBC por subsistema             | Un solo contributionBase       | OK v1 equal-IBC                                     |
| Cotización total salud/pensión | Empleado + empleador separados | Mapper **suma** ambos → campos 47/55                |

---

## 5. Novedades — mapeo a PILA

### 5.1 Matriz por novedad PILA

| Novedad PILA                                 | Fuente de datos existente                                                                                           | Efecto actual en días / IBC (OS-380)                                                                                            | Campos PILA                            | ¿v1?               | ¿Bloquea export?                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------ | ------------------------------------------------------------------------------------ |
| **ING**                                      | `EmployeeDetails.hireDate` / `contractStart`; `EmploymentContract.startDate`                                        | No marca flag; si ingreso mid-month, `presentDays` solo refleja marcaciones (puede sub-reportar días cotizados)                 | 15=X/R/C; 80 fecha                     | **Parcial**        | **Sí** si `hireDate` (o inicio contrato activo) cae **dentro** del período liquidado |
| **RET**                                      | `EmploymentContract.terminationDate` (status TERMINADO); `contractEnd`                                              | No marca flag; empleado inactivo puede excluirse del reporte                                                                    | 16; 81 fecha                           | **Parcial**        | **Sí** si terminación cae **dentro** del período                                     |
| **IGE**                                      | `MedicalLeave` `origin=COMUN`, status ≠ `RECHAZADA`, solapa período                                                 | Reduce `salaryBase` vía `medicalLeaveOrdinaryDaysExcluded`; días 1–2 empleador en gross; no genera días cotizados EPS separados | 25=X; 85–86 fechas; afecta 37/38/43/44 | **No v1 completo** | **Sí** si existe leave COMUN activa en el período                                    |
| **IRL** (relacionada)                        | `MedicalLeave` `origin=LABORAL`                                                                                     | Similar exclusión ordinario + `medicalLeaveEpsArlDays`                                                                          | 30 días IRL; 93–94; ARL                | **No v1**          | **Sí** si leave LABORAL en período                                                   |
| **VAC** (VAC-LR = X)                         | `VacationRequest` DISFRUTE `APROBADA` (vía `VacationsService.getApprovedDisfruteRanges`)                            | Solo ajusta `absentDays` en attendance summary; **no** cambia `workedDays` ni `contributionBase`                                | 27=X; 89–90                            | **No v1**          | **Sí** si hay ≥1 día DISFRUTE aprobado en el período                                 |
| **VAC-LR = L** (licencia remunerada)         | `PayrollNovedad` tipos con `isPaid=true` (LUTO, PATERNIDAD, MATERNIDAD, PERMISO_REMUNERADO, CALAMIDAD, DIA_FAMILIA) | `payrollNovedadPaidDays` informativo; **no** descuenta salaryBase                                                               | 27=L; fechas                           | **No v1**          | **Sí** si hay novedad paga distinta de “sin efecto PILA” — ver fila SLN/pagadas      |
| **SLN**                                      | `PayrollNovedad` `LICENCIA_NO_REMUNERADA` o `AUSENCIA_INJUSTIFICADA` / `isPaid=false`                               | Descuenta `salaryBase` (`payrollNovedadUnpaidDays` / deduction)                                                                 | 24=X/C; 83–84                          | **No v1**          | **Sí** si unpaid days > 0 en período                                                 |
| **LMA**                                      | `NovedadType.LICENCIA_MATERNIDAD` / `LICENCIA_PATERNIDAD` (nómina); no hay `LeaveOrigin` maternidad en MedicalLeave | Pagada (`isPaidDefault=true`); no marca LMA ni autorizaciones EPS (57–60 deben ir blanco/cero en entrada)                       | 26; 87–88                              | **No v1**          | **Sí** si existe en período (requiere reglas LMA + posible multi-línea)              |
| TDE/TAE/TDP/TAP/VSP/VST/VCT/AVP/Correcciones | Sin modelo de traslados/variaciones PILA                                                                            | N/A                                                                                                                             | 17–23, 28–29, …                        | **No**             | **Sí** si se detecta intento futuro; v1 no hay fuente → no aplica                    |

### 5.2 Política v1 de novedades (decisión cerrada)

**Caso soportado v1 (“línea limpia”):**

- Empleados `FIJO` | `INDEFINIDO` | `OBRA`, activos, cotizante 01.
- Sin ING/RET en el período.
- Sin `MedicalLeave` activa en el período.
- Sin vacaciones DISFRUTE aprobadas en el período.
- Sin `PayrollNovedad` `APROBADA` que intersecte el período.
- IBC ≤ 4 SMMLV.
- Tenant no marcado como exonerado Ley 1607.
- Datos maestros PILA completos (códigos, NIT/DV, DIVIPOLA, ARL aportante, actividad económica).

**Cualquier desviación de la lista anterior → `VALIDATION_FAILED`**, sin generar archivo.

Justificación: el motor no expone días/IBC por subsistema ni flags PILA; mapear mal sería archivo rechazable. Mejor bloquear con mensaje accionable que emitir plano incorrecto.

---

## 6. Matriz validación — soportado / no soportado / mensaje

| Código                 | Caso                                  | Resultado                                     | Validación                                     | Mensaje accionable (ES)                                                                                                                              |
| ---------------------- | ------------------------------------- | --------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OK_CLEAN`             | Empleado línea limpia (§5.2)          | Permitir                                      | —                                              | —                                                                                                                                                    |
| `ERR_CONTRACT`         | `PRESTACION` o `APRENDIZAJE`          | Bloquear empleado o excluir con error de lote | `contractType ∈ {FIJO,INDEFINIDO,OBRA}`        | `El empleado {nombre} ({cedula}) tiene contrato {tipo}. La planilla E v1 solo admite dependientes 01 (FIJO/INDEFINIDO/OBRA).`                        |
| `ERR_DOC_TYPE`         | `DocumentType.PEP` u otro no mapeable | Bloquear                                      | Map solo CC/CE/TI/PA                           | `Documento {tipo} de {nombre} no es válido en PILA. Use CC, CE, TI o pasaporte (PA).`                                                                |
| `ERR_PERSONAL_NAME`    | Falta primer apellido o primer nombre | Bloquear                                      | `EmployeePersonalData`                         | `Complete nombres y apellidos en el perfil de {nombre} antes de generar PILA.`                                                                       |
| `ERR_AFFILIATION_CODE` | EPS/AFP/ARL/CCF sin `pilaCode`        | Bloquear                                      | Catálogo `pilaCode` no null                    | `Falta código PILA de {EPS\|AFP\|ARL\|CCF} para {nombre}. Configure el código oficial en el catálogo de nómina.`                                     |
| `ERR_TENANT_NIT_DV`    | NIT o DV ausente/inválido             | Bloquear tenant                               | `Tenant.nit` + `Tenant.verificationDigit`      | `Configure NIT y dígito de verificación del empleador en datos del tenant.`                                                                          |
| `ERR_TENANT_ARL`       | Sin código ARL aportante              | Bloquear                                      | Config PILA tenant                             | `Configure el código ARL del aportante en la configuración PILA del tenant.`                                                                         |
| `ERR_TENANT_ACT_ECON`  | Sin actividad económica ARL           | Bloquear                                      | Config campo 98                                | `Configure la actividad económica ARL (Decreto 768/2022) en la configuración PILA del tenant.`                                                       |
| `ERR_DIVIPOLA`         | Sede sin códigos depto/municipio      | Bloquear                                      | `Location.departmentCode` + `municipalityCode` | `La sede laboral "{sede}" no tiene códigos DIVIPOLA. Complételos en sedes.`                                                                          |
| `ERR_ING_IN_PERIOD`    | Ingreso en el período                 | Bloquear                                      | hire/contract start ∈ período                  | `Hay ingreso en el período ({fecha}) para {nombre}. La v1 no emite novedad ING; liquide este caso fuera de RestOpsIQ o espere soporte de novedades.` |
| `ERR_RET_IN_PERIOD`    | Retiro en el período                  | Bloquear                                      | termination ∈ período                          | Idem RET.                                                                                                                                            |
| `ERR_IGE`              | Incapacidad común en período          | Bloquear                                      | MedicalLeave COMUN                             | `Hay incapacidad común en el período para {nombre}. La v1 no soporta novedad IGE.`                                                                   |
| `ERR_IRL`              | Incapacidad laboral en período        | Bloquear                                      | MedicalLeave LABORAL                           | Idem IRL.                                                                                                                                            |
| `ERR_VAC`              | Vacaciones disfrute en período        | Bloquear                                      | Vacation DISFRUTE                              | `Hay vacaciones aprobadas en el período para {nombre}. La v1 no soporta novedad VAC.`                                                                |
| `ERR_NOVEDAD`          | Novedad nómina APROBADA en período    | Bloquear                                      | PayrollNovedad                                 | `Hay novedad {tipo} aprobada en el período para {nombre}. La v1 no soporta SLN/LMA/licencias en PILA.`                                               |
| `ERR_FSP`              | IBC >= 4 SMMLV                        | Bloquear                                      | contributionBase vs SMLV período               | `{nombre} tiene IBC >= 4 SMMLV. OS-380 no calcula Fondo de Solidaridad Pensional; no se puede generar planilla válida hasta resolver ese cálculo.`   |
| `ERR_EXONERATION`      | Tenant exonerado Ley 1607             | Bloquear                                      | flag config                                    | `El tenant está marcado como exonerado Ley 1607, pero OS-380 aún no aplica tarifas de exoneración. Desactive el flag o espere el ticket de cálculo.` |
| `ERR_NO_EMPLOYEES`     | Cero cotizantes tras filtros          | Bloquear                                      | count > 0                                      | `No hay empleados elegibles para planilla E en el período {periodo}.`                                                                                |
| `ERR_ALREADY_PAID`     | Regenerar sobre PAID sin void         | Bloquear                                      | estado ≠ PAID o VOID previo                    | `La planilla del período {periodo} está marcada como PAGADA. Anúlela (VOIDED) antes de regenerar.`                                                   |

Regla de lote: **cualquier** `ERR_*` en un empleado del período → estado `VALIDATION_FAILED` (no se genera archivo parcial en v1).

---

## 7. Máquina de estados

```
                 ┌──────────────────┐
                 │ VALIDATION_FAILED│◄── validación lote falla
                 └────────▲─────────┘
                          │
┌─────────┐  validate   ┌─┴──────────┐  map+store   ┌───────────┐
│ PENDING │────────────►│ (transient)│─────────────►│ GENERATED │
└─────────┘  (opcional) └────────────┘              └─────┬─────┘
     ▲                                                    │
     │              mark paid (manual)                    │
     │         ┌──────────────────────────────────────────┤
     │         ▼                                          │
     │   ┌─────────┐                                      │
     │   │  PAID   │                                      │
     │   └────┬────┘                                      │
     │        │ void                                      │
     │        ▼                                           │
     │   ┌─────────┐     void desde GENERATED             │
     └───│ VOIDED  │◄─────────────────────────────────────┘
         └─────────┘
```

| Estado              | Significado                                                                  |
| ------------------- | ---------------------------------------------------------------------------- |
| `PENDING`           | Solicitud de generación creada; aún no validada o en cola (opcional si sync) |
| `VALIDATION_FAILED` | Matriz §6 falló; **sin** archivo persistido (o archivo previo intacto)       |
| `GENERATED`         | Archivo plano + snapshot JSON persistidos; descargable; aún no pagado        |
| `PAID`              | Usuario confirmó pago manual ante el operador                                |
| `VOIDED`            | Anulado; no es la versión vigente del período                                |

Transiciones permitidas:

| Desde      | Hacia               | Condición                                   |
| ---------- | ------------------- | ------------------------------------------- |
| — / VOIDED | PENDING → GENERATED | Validación OK + persistencia                |
| —          | VALIDATION_FAILED   | Validación KO                               |
| GENERATED  | PAID                | Confirmación manual con campos obligatorios |
| GENERATED  | VOIDED              | Anulación explícita                         |
| PAID       | VOIDED              | Anulación explícita (auditoría)             |
| VOIDED     | GENERATED           | Nueva generación (nueva versión)            |
| PAID       | GENERATED           | **Prohibido** sin pasar por VOIDED          |

---

## 8. Regeneración, versionado y pago

### 8.1 Regeneración

- Permitida desde `VOIDED` o si **no** existe versión `GENERATED`/`PAID` vigente.
- Si existe `GENERATED` vigente: regenerar = **VOID** implícito o explícito de la versión anterior + nueva versión (`version` incrementa).
- Si existe `PAID`: exigir `VOIDED` primero (`ERR_ALREADY_PAID`).

### 8.2 Versionado

- Clave natural: `(tenantId, periodHealth YYYY-MM)`.
- Campo `version` entero monotónico (1, 2, …).
- Solo una fila “vigente” no voided por período (`isCurrent` o unique parcial vía aplicación: status ∈ {GENERATED, PAID}).
- Nombre archivo sugerido: `pila-E-{nit}-{periodHealth}-v{version}.txt`.

### 8.3 Después de PAID

- Descarga del archivo histórico: **permitida** (solo lectura).
- Regeneración: **bloqueada** hasta VOIDED.
- Edición de snapshot: **prohibida**.

### 8.4 Confirmación manual de pago — campos obligatorios

| Campo                    | Tipo                                   | Obligatorio    |
| ------------------------ | -------------------------------------- | -------------- |
| `paidAt`                 | DateTime                               | Sí             |
| `paidConfirmedByUserId`  | string                                 | Sí (actor JWT) |
| `operatorPlanillaNumber` | string (nº planilla/radicado operador) | Sí             |
| `paymentReference`       | string                                 | No (opcional)  |
| `notes`                  | string                                 | No             |

Al pasar a `PAID`, persistir estos campos; no se llama API del operador.

---

## 9. Persistencia (decisión cerrada)

**No aceptar** solo checksum + recomputación en vivo.

| Artefacto                | ¿Persistir? | Cómo                                                                                                                                       |
| ------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Archivo plano exacto** | **Sí**      | `StorageObject` `domain=PAYROLL`, `entityType=PilaPeriodExport`, mime `text/plain`                                                         |
| **Snapshot JSON**        | **Sí**      | Columna `snapshotJson Json` en `PilaPeriodExport` (encabezado + filas cotizante + metadatos de validación + `payrollPeriod` inputs usados) |
| Checksum                 | Sí (además) | `StorageObject.checksum` + denormalizado en export row                                                                                     |

**Justificación:** el motor OS-380 es determinista _solo si_ no cambian asistencia, novedades, salarios ni parámetros; la trazabilidad legal/operativa exige el **byte-exact file** que se cargó/descargó y un JSON auditable sin re-ejecutar el mapper.

Patrón de storage existente: `StorageObject` + `StorageDomain.PAYROLL` (cartas vacaciones, soportes incapacidades/novedades).

---

## 10. Ubicación laboral (DIVIPOLA) — decisión cerrada

**Fuente laboral:** `EmployeeDetails.locationId` → modelo `Location` (sede de trabajo del empleado).

**Evidencia:**

- Reportes de nómina filtran y agrupan por `employeeDetails.locationId` / `locationName` (`ReportsService`, DTOs “Filter by location (employeeDetails.locationId)”).
- `Location` representa sedes operativas del tenant (asistencia, overtime, geofence).

**No usar** `EmployeePersonalData.departamento` / `ciudad` (residencia) para campos 9–10 del registro tipo 2.

**Implementado en Fase 1:** `Location.departmentCode` (VarChar 2) y `Location.municipalityCode` (VarChar 3), opcionales. Sedes demo Bogotá: `11` / `001`.  
Módulo `geo` (`colombia-locations.ts`) sigue siendo referencia de nombres; el código municipio oficial vive en la sede.

---

## 11. Configuración PILA mínima del tenant — decisión cerrada (Fase 1)

**Elegido: entidad relacionada tipada `TenantPilaConfig` (1:1 con Tenant).**

No columnas dispersas en `Tenant` (ya cargado).  
No JSON opaco (`LaborLegalParameter` es key-value de tarifas legales, patrón distinto).  
No reutilizar `LaborLegalParameter` para códigos ARL/actividad (semántica incorrecta).  
No reutilizar `Supplier.dv` en Tenant (semántica de proveedor ≠ aportante).

### Campos `TenantPilaConfig` (implementados)

| Campo                             | Tipo                    | Uso PILA                  |
| --------------------------------- | ----------------------- | ------------------------- |
| `tenantId`                        | `@unique` FK            | 1:1                       |
| `documentType`                    | VarChar(2) default `NI` | Campo 5 tipo 1            |
| `claseAportante`                  | VarChar(1) default `B`  | Clase aportante           |
| `naturalezaJuridica`              | VarChar(1) default `2`  | Privada                   |
| `formaPresentacion`               | VarChar(1) default `U`  | Forma U v1                |
| `tipoAportante`                   | VarChar(2) default `01` | Empleador                 |
| `arlCode`                         | VarChar(10)?            | Reg tipo 1 campo 14       |
| `actividadEconomicaArl`           | VarChar(7)?             | Reg tipo 2 campo 98       |
| `exemptFromHealthSenaIcbfLey1607` | Boolean default false   | Si true bloquea export v1 |
| `createdAt` / `updatedAt`         |                         |                           |

**No** se duplicó NIT/DV en `TenantPilaConfig`: se usan `Tenant.nit` + `Tenant.verificationDigit`.

### Tenant — `verificationDigit` (no `dv`)

| Decisión        | Detalle                                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Campo           | `Tenant.verificationDigit String?`                                                                                           |
| Por qué no `dv` | Evitar ambigüedad con `Supplier.dv` y nombres cortos opacos; el SDD Fase 0 decía `dv` — **corregido** a `verificationDigit`. |
| `nit`           | Solo dígitos base, **sin** DV embebido ni guion. Demo: `900000000` + `verificationDigit: '1'`.                               |

### Catálogo administradoras — `pilaCode`

| Decisión          | Detalle                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| Campo             | `EmployeeCatalogOption.pilaCode String? @db.VarChar(10)`                                         |
| Por qué no `code` | `Location` ya tiene `code` interno (PL-01…); `pilaCode` deja explícito el semántica regulatoria. |
| Unique            | `@@unique([tenantId, type, pilaCode])` — scope tenant; PostgreSQL permite múltiples `NULL`.      |
| Tipos con código  | `EPS`, `PENSION_FUND`, `ARL`, `CAJA_COMPENSACION`                                                |
| Tipos sin código  | `AREA`, `DEPARTMENT`, `CESANTIAS_FUND` → `pilaCode` null                                         |

---

## 12. Modelo Prisma Fase 1 (implementado)

**Incluido en Fase 1**

```prisma
model Tenant {
  nit               String?  @unique  // solo dígitos, sin DV
  verificationDigit String?
  pilaConfig        TenantPilaConfig?
  // …
}

model TenantPilaConfig {
  id                              String   @id @default(cuid())
  tenantId                        String   @unique
  documentType                    String   @default("NI") @db.VarChar(2)
  claseAportante                  String   @default("B") @db.VarChar(1)
  naturalezaJuridica              String   @default("2") @db.VarChar(1)
  formaPresentacion               String   @default("U") @db.VarChar(1)
  tipoAportante                   String   @default("01") @db.VarChar(2)
  arlCode                         String?  @db.VarChar(10)
  actividadEconomicaArl           String?  @db.VarChar(7)
  exemptFromHealthSenaIcbfLey1607 Boolean  @default(false)
  createdAt                       DateTime @default(now())
  updatedAt                       DateTime @updatedAt
  tenant Tenant @relation(...)
  @@map("tenant_pila_configs")
}

model Location {
  departmentCode   String? @db.VarChar(2)
  municipalityCode String? @db.VarChar(3)
  // …
}

model EmployeeCatalogOption {
  pilaCode String? @db.VarChar(10)
  @@unique([tenantId, type, pilaCode])
}
```

**Explícitamente NO creado en Fase 1** (queda para fases 2–3):

- `PilaPeriodExport`
- `PilaExportStatus` enum
- `StorageObject` entityType PILA
- mapper TXT / controllers / FE / Postman

Migración: `apps/api/prisma/migrations/20260715160000_os595_pila_master_data/`  
Compatibilidad: columnas opcionales; sin backfill regulatorio de filas históricas.

---

## 13. Seeds Fase 1 (implementados)

| Seed                                                      | Contenido                                                                                           |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `src/payroll/constants/pila-admin-codes.ts`               | Fuente única de filas `{name, pilaCode}`; documenta UGPP + Minsalud                                 |
| `employee-catalog.seed.ts` / `employee-catalog-prisma.ts` | Upsert idempotente con `pilaCode`; sin fuzzy match                                                  |
| `tenant-pila-config.seed.ts`                              | Demo: ARL `14-11`, actividad `5611001` (fixture demo, no certificado Decreto 768)                   |
| `seed.ts` tenant demo                                     | `nit: '900000000'`, `verificationDigit: '1'`; sedes Bogotá `11`/`001`; llama `seedTenantPilaConfig` |

### Fuente de códigos sembrados

- **Primaria:** UGPP — Listado códigos PILA administradoras (`bd_codigos_pila_2024` / Listado-Codigos-PILA), documentado `2026-07-15`.
- **Complemento EPS:** Minsalud listado EPS vigentes por régimen, 05-jun-2025.
- Política: solo match explícito nombre-seed ↔ fila oficial; si hay duda → `null`.

### Códigos dejados en `null` a propósito (sin certeza)

- EPS: EPM, Fondo de Pasivo Social Ferrocarriles.
- CCF: Confa, Comfenalco Valle del Agente, Comfamiliar Cartagena, Comfamiliar Neiva.
- Todos `AREA` / `DEPARTMENT` / `CESANTIAS_FUND`.

Sin seeds de FSP ni `exemptFromHealthSenaIcbfLey1607=true` en demo.

---

## 14. Matriz de campos (resumen contrato)

### Registro tipo 1 (empleador privado, planilla E, forma U)

Ver auditoría complementaria; valores fijos v1: campos 1=`01`, 8=`E`, 9–10 blancos, 11=`U`, 12–13 blancos, 21=`01`.  
Campos de sistema (2, 17, 18, 22): blancos o asignados al generar/pagar según reglas §8.

### Registro tipo 2 (cotizante 01, línea limpia)

- Novedades 15–30: blancos / IRL=0.
- Códigos 31, 33, 35, 77: desde catálogo `pilaCode`.
- Días 36–39: mismo valor derivado de OS-380 `workedDays` (regla §4.3).
- IBC 42–45, 95: `contributionBase`.
- Tarifas/cotizaciones: derivadas de constants + montos OS-380 (suma emp+pat donde aplique).
- 51–52: 0 (si pasó validación FSP).
- 56–60, 70–75, 97: blanco/cero.
- 76: `N`.
- 78: desde `ArlRiskLevel`.
- 80–94: blancos.
- 96: opcional; v1 puede emitir estimado `workedDays * 8` o 000 según decisión implementación Fase 2 (documentar en task de mapper).
- 98: `TenantPilaConfig.actividadEconomicaArl`.

---

## 15. Dependencias

| Dependencia                                     | Rol                                        |
| ----------------------------------------------- | ------------------------------------------ |
| OS-380                                          | Fuente de IBC, días base, cotizaciones     |
| NOM-04 reports                                  | Orquestación período                       |
| Catálogo empleados / OS-377                     | Afiliaciones                               |
| NOM-13 / NOM-14 / Vacaciones / OS-591 contratos | Detección de bloqueos por novedades        |
| Storage PAYROLL                                 | Persistencia archivo                       |
| OS-585 LaborLegalParameter                      | Solo lectura SMLV para umbral FSP (4×SMLV) |

**No bloqueantes de producto:** OS-380 cierre UI / persistencia de período mensual (v1 regenera desde motor en el momento de GENERATED y **congela** en snapshot+archivo).

---

## 16. Decisiones cerradas (Fase 0)

1. Planilla **E**, cotizante **01**, forma **U**, empleador privado.
2. Archivo plano Anexo 2 v29; no XLSX; no API operador; no DIAN.
3. Consumir OS-380; no motor paralelo.
4. Novedades PILA **no** se emiten en v1; su presencia **bloquea**.
5. FSP ausente en OS-380 → bloqueo si IBC pensional **`>= 4 SMMLV`** (SMLV vigente del período vía LaborLegalParameters).
6. Exoneración Ley 1607 no calculada → flag tenant; si true, bloqueo.
7. DIVIPOLA desde **Location** (sede), no residencia.
8. Config tipada `TenantPilaConfig` + `Tenant.verificationDigit` + `catalog.pilaCode` + DIVIPOLA en Location.
9. Estados: PENDING / VALIDATION_FAILED / GENERATED / PAID / VOIDED.
10. Persistencia: **plano exacto + snapshot JSON** (+ checksum).
11. Pago: confirmación manual con `paidAt`, actor, `operatorPlanillaNumber`.

---

## 17. Fases de implementación

| Fase   | Contenido                                                                        | Salida                                |
| ------ | -------------------------------------------------------------------------------- | ------------------------------------- |
| **0**  | Este SDD                                                                         | Contrato cerrado                      |
| **1**  | Prisma + seeds (config, `pilaCode`, DIVIPOLA) — **sin** `PilaPeriodExport`       | Migración + validate + tests mínimos  |
| **1b** | Retoques: DV DIAN, ARL vs catálogo, seeds no-null-overwrite, fixture documentado | Tests específicos                     |
| **2**  | `PilaPreparationService` + objeto intermedio + validaciones mínimas              | Draft listo para serializar (sin TXT) |
| **2b** | IBC desde OS-380 (`contributionBase` expuesto); FSP `>= 4 SMMLV`                 | Tests frontera                        |
| **3**  | Serializador fixed-width puro (tipo 1/2) + golden files                          | TXT en memoria, sin persistencia/HTTP |
| **4**  | `PilaPeriodExport` + Storage + endpoints + Postman                               | API usable                            |
| **5**  | FE reportes: generar / descargar / marcar pagado                                 | UX mínima                             |
| **6+** | Novedades PILA, FSP, exoneración (tickets aparte)                                | Ampliar matriz §5                     |

---

## 18. Files allowed / forbidden (por fase)

### Fase 0

- **Allowed:** `tasks/payroll/OS-595-pila-aportes-en-linea.md`
- **Forbidden:** código productivo, Prisma, migraciones, seeds, Postman, `apps/**`

### Fase 1 (ejecutada)

Ver lista en historial; migraciones + schema + seeds + TenantPilaConfig + `pilaCode`.

### Fase 1b + Fase 2 (ejecutada)

**Allowed / tocados:**

- Seeds/util: `pila-master-data.util.ts`, `employee-catalog.seed.ts`, `tenant-pila-config.seed.ts`, `seed.ts` (DV demo)
- `TenantPilaConfigService` + catálogo `findActiveByTypeAndPilaCode`
- `apps/api/src/payroll/pila/**` (interfaces, adapter, validation, service, error codes)
- `apps/api/src/reports/reports.module.ts` (registra `PilaPreparationService`, exporta ReportsService)
- Tests: `pila-*.spec.ts`, `tenant-pila-config.service.spec.ts`, `employee-catalog.repository.spec.ts`
- Este SDD

**Forbidden (respetado):** TXT fixed-width, `PilaPeriodExport`, StorageObject PILA, endpoints descarga, FE, Postman, alertas, pagos, Aportes en Línea API. Sin migración Prisma nueva en 1b/2.

---

## 19. Criterios de aceptación Fase 0

- [x] SDD creado con objetivo, alcance, exclusiones, arquitectura.
- [x] Gaps OS-380 documentados con evidencia de rutas.
- [x] Matriz novedades + bloqueos.
- [x] Matriz validación con mensajes.
- [x] Estados, regeneración, pago manual.
- [x] Persistencia plano + JSON.
- [x] DIVIPOLA = Location.
- [x] Config `TenantPilaConfig` tipada.
- [x] Propuesta Prisma + seeds + archivos Fase 1.
- [x] Sin cambios a código productivo en Fase 0.

---

## 20. Criterios / resultado Fase 1

- [x] Pre-check: sin DV tenant, sin código externo catálogo, sin config PILA, Location sin DIVIPOLA; `Location` = sede de `EmployeeDetails.locationId`.
- [x] `Tenant.verificationDigit` + nit normalizado (demo).
- [x] `EmployeeCatalogOption.pilaCode` + unique tenant-scoped.
- [x] `Location.departmentCode` / `municipalityCode`.
- [x] `TenantPilaConfig` 1:1 tipada (sin JSON).
- [x] Migración compatible (columnas opcionales, sin inventar códigos históricos).
- [x] Seeds idempotentes + fuente documentada.
- [x] Tests mínimos service/util/catálogo.
- [x] **No** `PilaPeriodExport` / enum export / Storage PILA / mapper / FE.

### Limitaciones pendientes (post Fase 1)

- Códigos `null` listados en §13 (requieren confirmación oficial).
- OS-380 gaps FSP / Ley 1607 / novedades (sin cambio en Fase 1).

---

## 21. Retoques Fase 1b (ejecutados)

| Punto                              | Decisión / resultado                                                                                                                                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actividad económica demo `5611001` | **Fixture de desarrollo** únicamente. Documentado en `tenant-pila-config.seed.ts` y aquí. No es actividad certificada Decreto 768. Se mantiene para probar el flujo.                                                       |
| NIT / DV demo                      | `900000000` + DV `5` (coherente DIAN módulo 11). Corregido desde DV `1` incorrecto. Utilidad `computeDianVerificationDigit` / `isNitVerificationDigitCoherent` en `pila-master-data.util.ts` (no existía otra en el repo). |
| `TenantPilaConfig.arlCode`         | Validado contra `EmployeeCatalogOption` tipo `ARL` con mismo `pilaCode` y `tenantId`. Sin FK nueva.                                                                                                                        |
| Permisos / aislamiento             | Sin controller HTTP de `TenantPilaConfig` (solo service exportado). Catálogo: `PAYROLL_MODULE_ROLES` + `JwtAuthGuard`/`RolesGuard`; `pilaCode` solo vía ese endpoint. Service siempre filtra por `tenantId` del caller.    |
| Seeds                              | Idempotentes; sin fuzzy match; `catalogSeedPilaCodeUpdate` **no** pisa códigos manuales con `null` del seed.                                                                                                               |

---

## 22. Fase 2 — objeto intermedio y arquitectura

### Estructura intermedia final

- **`PilaAportanteDraft`:** razón social, tipo doc, NIT, DV, planilla `E`, forma, tipo/clase aportante, naturaleza, ARL, actividad económica, períodos salud/otros, flag Ley 1607.
- **`PilaCotizanteDraft`:** employeeId, doc, nombres, cotizante `01`, códigos AFP/EPS/ARL/CCF, DIVIPOLA, días, salario, integral, IBC, aportes OS-380 + tasas informativas, clase riesgo, actividad, centro de trabajo.
- **`PilaTotalsDraft`:** conteo empleados, total nómina, totales aportes.
- **`PilaPeriodDraft`:** tenantId + period + aportante + cotizantes + totals.
- **`PilaPreparationResult`:** `{ ok: true, data }` o `{ ok: false, data: null, errors[] }` — no se ignora empleado inválido (falla lote completo).

### Arquitectura de preparación

```
PilaPreparationService.preparePeriod(tenantId, period, actor)
  1. obtención     → Tenant, TenantPilaConfig, ReportsService.getPayrollReport (OS-380),
                     catálogo, SMLV (LaborLegalParameters)
  2. adaptación    → pila-os380.adapter usa `row.contributionBase` del motor (expuesto en
                     PayrollEmployeeRowDto / EmployeePayrollPeriod). NO recalcula 70% INTEGRAL.
  3. enriquecimiento → batch EmployeeDetails+personalData+Location+match exacto nombre→pilaCode
  4. validación    → pila-validation (tenant + empleado + período)
  5. construcción  → PilaPeriodDraft solo si errors.length === 0
```

Registrado en `ReportsModule` (evita ciclo Payroll↔Reports). **No** modifica la lógica de cálculo de `PayrollCalculationService` (solo expone `contributionBase` en el resultado/DTO).

### Corrección Fase 2b — fuente del IBC

- `PayrollCalculationService` ya calculaba `contributionBase`; ahora se **persiste en el return** y se mapea a `PayrollEmployeeRowDto.contributionBase`.
- PILA copia ese valor; eliminado `deriveContributionBaseFromOs380` / `salaryBase * 0.7` del adaptador.

### Corrección Fase 2b — umbral FSP

- Bloqueo cuando `contributionBase >= 4 * SMLV` del período (`LaborLegalParametersService.getValueAt('SMLV', …)`).
- Tests frontera: `< 4`, `= 4`, `> 4`.

### Validaciones mínimas incluidas

Tenant: NIT/DV presentes y coherentes DIAN; config presente; ARL en catálogo; actividad económica; no exonerado v1.  
Empleado: contrato FIJO/INDEFINIDO/OBRA; doc CC/CE/TI/PA; nombres; EPS/AFP/ARL/CCF + `pilaCode`; DIVIPOLA sede; riesgo; sin novedades PILA; IBC **`< 4 SMMLV`** (bloquea si `>=`).  
Período: `YYYY-MM`; montos ≥ 0; datos OS-380.

### Códigos de error (estructurados)

Ver `pila-error-codes.ts`: entre otros `TENANT_PILA_CONFIG_MISSING`, `TENANT_NIT_DV_INVALID`, `TENANT_ARL_CODE_NOT_IN_CATALOG`, `TENANT_EXEMPT_LEY_1607`, `EMPLOYEE_EPS_PILA_CODE_MISSING`, `EMPLOYEE_HAS_UNSUPPORTED_PILA_EVENT`, `EMPLOYEE_REQUIRES_FSP`, `EMPLOYEE_UNSUPPORTED_CONTRACT`, `EMPLOYEE_UNSUPPORTED_DOCUMENT`, …

### Validaciones deliberadamente diferidas (post Fase 2; parcial Fase 3)

- Persistencia / estados / Storage / pago / FE / HTTP.
- Batch de vacaciones (API existente es por empleado; mismo patrón que ReportsService).
- Recálculo FSP / tarifas Ley 1607 en motor.

### Fuentes de datos

| Dato                              | Fuente                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------ |
| Liquidación / aportes             | `ReportsService.getPayrollReport` → OS-380                                     |
| IBC                               | `PayrollEmployeeRowDto.contributionBase` (motor OS-380)                        |
| SMLV                              | `LaborLegalParametersService.getValueAt('SMLV')`                               |
| Afiliaciones / DIVIPOLA / nombres | `EmployeeDetails` + catálogo `pilaCode` (match exacto de nombre)               |
| Config aportante                  | `TenantPilaConfig` + `Tenant.nit` / `verificationDigit`                        |
| Bloqueos novedad                  | MedicalLeaves / PayrollNovedades batch + VacationsService + ING/RET por fechas |

### Criterios Fase 2 / 2b

- [x] Objeto intermedio tipado.
- [x] Validaciones mínimas + errores estructurados.
- [x] IBC desde OS-380 sin recalcular en PILA.
- [x] FSP `>= 4 SMMLV` + tests frontera.
- [x] Tests específicos (feliz + fallos listados).
- [x] Sin persistencia / FE / Postman / alertas en Fase 2.

---

## 23. Fase 3 — serializador fixed-width

### Arquitectura

```
PilaPeriodDraft (ya validado)
  → PilaFixedWidthSerializer
       ├─ PilaRecordType1Serializer  (359 chars)
       ├─ PilaRecordType2Serializer  (693 chars c/u)
       └─ helpers: pad / money / tariff / period / sequence
  → { content, bytes, suggestedFileName }
```

Puro: sin Prisma, OS-380, preparación ni HTTP. Errores técnicos (`PilaSerializationError`) si overflow o contrato interno violado; no revalida negocio de Fase 2.

### Encoding y saltos de línea

| Decisión          | Valor                                                                          |
| ----------------- | ------------------------------------------------------------------------------ |
| Encoding          | **`ascii`** (cerrado Fase 4; Anexo no fija ANSI vs ASCII en extracto revisado) |
| Terminador        | `\r\n` (CRLF)                                                                  |
| Línea final extra | **No**                                                                         |
| Nombre sugerido   | `pila-E-{nit}-{periodHealth}-v{version}.txt`                                   |
| Longitud          | Validada en **bytes ASCII** (= caracteres tras sanitizar)                      |

**Tratamiento de caracteres (documentado, no silencioso):**

| Entrada                  | Tratamiento                                          |
| ------------------------ | ---------------------------------------------------- |
| A–Z, 0–9, espacio        | Conservados                                          |
| minúsculas               | → MAYÚSCULAS                                         |
| Tildes / diéresis / Ñ    | NFD → letra base (Ñ→N)                               |
| Guion `-`                | Solo en códigos AFP/EPS/ARL/CCF y períodos `YYYY-MM` |
| `&`, `'`, otros no ASCII | Eliminados                                           |
| Overflow de campo        | `PilaSerializationError` (no truncar)                |

Centralizado en `pila-fixed-width.constants.ts` / `pila-fixed-width.format.ts`.

### Campos efectivamente implementados (tipo 1 — 359)

| Campo | Contenido v1                          |
| ----- | ------------------------------------- |
| 1     | `01`                                  |
| 2     | `1` (electrónica)                     |
| 3     | secuencia `0001`                      |
| 4–7   | razón social, tipo doc, NIT, DV       |
| 8     | `E`                                   |
| 9–10  | blancos (planilla asociada)           |
| 11    | `U`                                   |
| 12–13 | blancos (sucursal)                    |
| 14    | ARL aportante                         |
| 15–16 | período otros / salud (`YYYY-MM`)     |
| 17–18 | ceros/blancos (operador)              |
| 19–20 | # empleados; sumatoria IBC cotizantes |
| 21    | tipo aportante                        |
| 22    | ceros (código operador)               |

### Campos tipo 2 (693) — línea limpia

Llenos desde draft: doc, nombres, cotizante `01`, DIVIPOLA, códigos AFP/EPS/CCF/ARL, días, salario, integral, IBC×4, tarifas/cotizaciones OS-380 (suma emp+pat donde aplica), ARL riesgo, horas=`min(999,días*8)`, actividad económica.  
**Blancos/ceros:** novedades 15–30, traslados, FSP 51–52, UPC/auth, ESAP/MEN, fechas 80–94/97, cotizante principal, exoneración=`N`.

### Limitaciones línea limpia

Sin novedades, sin FSP, un registro por empleado, cotizante 01, planilla E/forma U únicamente.

### Golden files

- `apps/api/src/payroll/pila/serializer/fixtures/golden/pila-clean-one-employee.txt`
- `.../pila-clean-two-employees.txt`  
  Fixture: `pila-clean-draft.fixture.ts`. Tests de determinismo byte-a-byte.

### Criterios Fase 3

- [x] Longitudes 359 / 693 verificadas.
- [x] Helpers + overflow técnico.
- [x] Golden + determinismo.
- [x] Sin persistencia / HTTP / FE / Postman / estados / pago / alertas.

---

## 23b. Fase 4 — persistencia, versionado y API

### Encoding final (Parte A)

Confirmado **ASCII** tras sanitización documentada (ver §23). Goldens actualizados para conservar guion en códigos ARL (`14-11`).

### Modelo Prisma `PilaPeriodExport`

Enum `PilaPeriodExportStatus`: **GENERATED | PAID | VOIDED** (no se persisten PENDING / VALIDATION_FAILED).

Campos: id, tenantId, periodHealth, periodOther, status, version (>0 CHECK), technicalVersion (`anexo2-v29`), fileName, fileChecksum, employeeCount, totalPayrollAmount, totalContribution, snapshotJson, storageObjectId (unique FK → StorageObject), generatedAt/By, paidAt/paidConfirmedBy, planNumber, paymentReference, voidedAt/By/voidReason, timestamps.

Constraints:

- `@@unique([tenantId, periodHealth, version])`
- Unique parcial SQL: una sola fila activa (`GENERATED`|`PAID`) por `(tenantId, periodHealth)`
- FK tenant CASCADE; storage RESTRICT

Migración: `apps/api/prisma/migrations/20260715180000_os595_pila_period_export/`

### Storage

- `StorageDomain.PAYROLL`, `visibility=PRIVATE`, mime `text/plain`
- `entityType=PilaPeriodExport`
- Bytes exactos del serializador; descarga vía `StorageService.getObjectBuffer` (nuevo en provider R2 + mock)
- No regenerar desde datos vivos al descargar

### Versionado

1. Primera generación → v1
2. Nueva generación → vN+1 (nunca sobrescribe)
3. GENERATED previa → VOIDED automático con razón `REGENERATED` (misma transacción)
4. PAID activo → bloqueo `ERR_ALREADY_PAID` hasta VOID explícito
5. Concurrencia: unique `(tenantId, periodHealth, version)` + unique parcial activa → `ERR_PILA_VERSION_CONFLICT`
6. Checksum SHA-256 sobre bytes almacenados

### Endpoints (`PilaReportsController` bajo `/api/reports/pila`)

| Método | Ruta                        | Roles                |
| ------ | --------------------------- | -------------------- |
| GET    | `/:period/validation`       | PAYROLL_MODULE_ROLES |
| POST   | `/:period/generate`         | PAYROLL_WRITE_ROLES  |
| GET    | `/` (filtros period/status) | PAYROLL_MODULE_ROLES |
| GET    | `/exports/:id/download`     | PAYROLL_MODULE_ROLES |
| PATCH  | `/exports/:id/paid`         | PAYROLL_WRITE_ROLES  |
| PATCH  | `/exports/:id/void`         | PAYROLL_WRITE_ROLES  |

- No acepta `tenantId` / `generatedBy` / `paidBy` del body
- List/download no exponen `snapshotJson` ni rutas internas de storage
- Descarga: bytes exactos; no cambia estado a DOWNLOADED
- Pago: solo GENERATED → PAID; campos planNumber, paymentReference?, paidAt
- Anulación: GENERATED o **PAID** (decisión explícita) con `reason` obligatorio
- Auditoría: `AuditAction.EXPORT` al generar; `UPDATE` al pagar/anular. Sin audit de descarga (no hay patrón reutilizable de download-only)

### Seguridad

- Tenant isolation en todas las queries (`findById(id, tenantId)`)
- Roles lectura vs escritura según tabla
- Snapshot y keys de storage no se exponen en listados

### Postman

Colección oficial: requests mínimos en carpeta NOM-04 Reports (validation, generate, generate error, list, download binario, paid, void).

### Limitaciones pendientes (post Fase 4)

- Frontend / dashboard / alerta vencimiento / scheduler / emails
- API Aportes en Línea / DIAN / FSP calc / Ley 1607 calc / novedades PILA
- Códigos catálogo `null` oficiales (§13)

### Criterios Fase 4

- [x] Encoding documentado + bytes + goldens
- [x] Modelo + migración + unique parcial
- [x] StorageObject + getObjectBuffer
- [x] Versionado + regeneración + bloqueo PAID
- [x] Endpoints + DTOs + roles
- [x] Tests específicos export + serializer
- [x] Postman mínimo
- [x] Sin FE / alertas / operador

### Retoques Fase 4b (revisión puntual)

| Punto       | Decisión                                                                                                                                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ASCII       | Solo en archivo plano; snapshot conserva nombres/razón social originales; colapso de espacios tras eliminar chars; tests MUÑOZ / D'ANGELO / PÉREZ & ASOCIADOS; aceptación final pendiente prueba real Aportes en Línea |
| PAID→VOIDED | Motivo obligatorio; conserva `paidAt` / `paidConfirmedBy` / `planNumber` / `paymentReference`; auditoría con evidencia; **no** regeneración automática (`ERR_PAID_HISTORY_BLOCKS_REGEN`)                               |
| Atomicidad  | `voidActiveAndCreate` transaccional (si falla v2, v1 activa); Storage cleanup solo si DB no persistió; post-persistencia (entityId/audit/HTTP) no borra export                                                         |
| Postman     | Diff limpio; download binario; validation error; paid/void; assert list sin `snapshotJson`                                                                                                                             |

---

## 25. Fase 5 — frontend PILA

### Integración (sin pantalla paralela)

- **Host:** `PayrollReportsScreen` (`apps/web-app/src/features/payroll/screens/PayrollReportsScreen.tsx`)
- Reutiliza el selector de período existente (`payrollPeriod` = `dateFrom.slice(0,7)`)
- Panel hermano bajo `NominaDashboardPreview`: `PilaPeriodPanel`

### Flujo

1. Validación (`GET .../validation`) — manual o previa a generar
2. Generar (`POST .../generate`) si `ok` y permisos escritura
3. Descargar bytes almacenados (`downloadExportBlob`)
4. Historial (`GET .../pila?period=`)
5. Marcar pagado / anular con modales (motivo obligatorio; warning si PAID)

### Estados derivados (solo FE)

| UI                | Origen                                    |
| ----------------- | ----------------------------------------- |
| Pendiente         | Sin export activa + validación no fallida |
| Con errores       | Validación `ok:false` y sin export activa |
| Generado / Pagado | Status backend activo                     |
| Anulado           | Solo en historial                         |

### Permisos

- Lectura/descarga/validar: roles módulo nómina (`useMe` + acceso a reportes)
- Generar / pagar / anular: `canWritePayrollEmployee` (OWNER/SUPER_ADMIN/SUPERVISOR/MANAGER; no NOMINA)

### Archivos FE

- `api/pila.client.ts`, `hooks/usePilaExportQueries.ts`, `types/pila.types.ts`
- `components/PilaPeriodPanel|StatusCard|ValidationErrors|ExportHistory|MarkPaidModal|VoidModal|StatusBadge`
- `utils/pila-display.ts`, `validation/pila.schema.ts`

### Limitaciones Fase 5

- Sin deep-link a perfil (ruta existente usa `userId`; errores traen `employeeDetailsId`)
- Sin alerta de vencimiento (Fase 6)
- Sin scheduler / emails / API operador / DIAN / FSP / Ley 1607 / novedades

### Criterios Fase 5

- [x] Integrado en reportes existentes
- [x] Validación con errores accionables
- [x] Generar / descargar / historial / pagar / anular
- [x] Permisos lectura vs escritura
- [x] Tests específicos FE
- [x] Sin pantalla paralela / sin alertas

---

## 26. Fase 6 / cierre — alerta de vencimiento PILA

### Norma / regla

- Fuente: tabla NIT (dos últimos dígitos **sin DV**) → N-ésimo día hábil del **mes de pago**.
- Período de cotización `YYYY-MM` → mes de pago = mes siguiente (dic→ene).
- Zona horaria “hoy”: `America/Bogota`.
- Festivos: `colombia-holidays.util.ts` (nacionales; sin locales).
- Umbral visual: `PILA_ALERT_THRESHOLD_DAYS = 5` (constante; sin migración).
- **Sin scheduler**: cálculo bajo demanda.

### Endpoint

`GET /api/reports/pila/:period/deadline` → `{ period, paymentMonth, dueDate, businessDayNumber, lastTwoNitDigits, daysRemaining, status, shouldAlert, timezone, message? }`

Estados derivados (no Prisma): `NOT_DUE | UPCOMING | DUE_TODAY | OVERDUE | PAID | CONFIG_INCOMPLETE`.  
`PAID` prevalece (no alerta de deuda). Sin NIT → `CONFIG_INCOMPLETE` sin fecha inventada.

### Frontend

- `PilaDeadlineAlertBanner` (patrón Cesantías): dashboard + `PilaPeriodPanel`.
- FE no recalcula la fecha; solo presenta respuesta backend.
- CTA → `/payroll/reports`.

### Utilidad

`apps/api/src/payroll/utils/pila-deadline.util.ts`

### Criterios cierre

- [x] Alerta + endpoint + banner
- [x] NIT sin DV + días hábiles
- [x] Download vía Storage (sin regenerar)
- [x] PAID no regenera; banner oculto si PAID
- [x] Postman + SDD actualizados

---

## 27. Extensión multi-formato (TXT + XLSX Aportes en Línea)

### Arquitectura

```
PilaPreparationService → PilaPeriodDraft → PilaTxtSerializer (Anexo 2)
                                         → PilaXlsxSerializer (plantilla oficial)
```

Fuente única: OS-380 + preparation + validaciones + catálogos + tenant config.  
**No** mapear TXT→XLSX. **No** duplicar cálculos.

### Límite XLSX

- Máximo **20** empleados por archivo (`ERR_PILA_XLSX_EMPLOYEE_LIMIT`).
- No truncar, no dividir, no inventar filas.
- Con >20: XLSX bloqueado; **TXT sigue disponible**.
- UI muestra el límite y recomienda TXT.

### Versionado independiente

- Unique `(tenantId, periodHealth, format, version)`.
- Generar XLSX no anula TXT (y viceversa).
- Regenerar formato F solo anula el GENERATED activo de F.
- PAID (historial de pago del período) bloquea regeneración de **ambos** formatos.
- Descarga histórica siempre desde Storage.

### Pago a nivel de período

Una evidencia de pago aplica a todos los GENERATED activos del período.  
**No** se persiste `paidUsingFormat`: el estado PAID es del período y no identifica cuál formato se cargó al operador.

### Catálogos XLSX

- Mapas código→etiqueta necesarios: `DatosPruebaEmp` solo tiene nombres; TXT usa códigos UGPP.
- Membresía exacta validada contra columnas de `DatosPruebaEmp` (sin fuzzy).
- Errores incluyen valor interno, hint, empleado y acción recomendada (usar TXT).

### Preservación plantilla

Sobre el **archivo generado**: `DatosPruebaEmp` veryHidden, protección Liquidaciones, dataValidations, estilos, anchos, merges, celdas de entrada desbloqueadas; filas no usadas limpias; asset original inmutable.

### Fase A — Auditoría plantilla (`docs/PlantillaXLSX..xlsx` → runtime `aportes-en-linea-v1`)

| Hallazgo                        | Valor                                                               |
| ------------------------------- | ------------------------------------------------------------------- |
| Hojas                           | `DatosPruebaEmp` (veryHidden, catálogos); `Liquidaciones` (entrada) |
| Fila datos                      | **19** (hasta 20 empleados: 19–38)                                  |
| Encabezado período              | A10=`periodOther`, C10=`periodHealth`                               |
| Tipo planilla / aportante / ARL | D10, I10, K10 (nombres, no códigos UGPP)                            |
| Fórmulas                        | **0**                                                               |
| dataValidations                 | 53 reglas (ExcelJS expande keys por celda)                          |
| Macros/VBA                      | No                                                                  |
| Protección                      | `sheetProtection` en Liquidaciones; celdas de entrada desbloqueadas |
| Versión interna                 | **`aportes-en-linea-v1`** (2026-07-15)                              |

El archivo original en `apps/api/docs/` **no se modifica**. Asset runtime: `apps/api/src/payroll/pila/templates/aportes-en-linea-v1.xlsx`.

### Persistencia

Migración: `20260715220000_os595_pila_export_format` — enum `PilaExportFormat` TXT|XLSX.

### Matriz de mapeo (resumen)

| Draft                                    | Hoja          | Celda/col         | Transformación                                | Obligatorio |
| ---------------------------------------- | ------------- | ----------------- | --------------------------------------------- | ----------- |
| periodOther / periodHealth               | Liquidaciones | A10 / C10         | YYYY-MM                                       | sí          |
| planilla E / EMPLEADOR / ARL nombre      | Liquidaciones | D10 / I10 / K10   | labels fijos + mapa ARL                       | sí          |
| documento / nombres                      | Liquidaciones | B–G fila 19+      | ASCII/case plantilla                          | sí          |
| dept / ciudad                            | Liquidaciones | H / I             | mapa dept; ciudad exacta (Bogotá puede vacío) | sí\*        |
| AFP/EPS/ARL/CCF                          | Liquidaciones | AX / BK / BV / CE | mapa etiqueta                                 | sí          |
| salario / días / IBC / tarifas / aportes | Liquidaciones | AU, AY–CM…        | redondeo enteros; tarifas decimal             | sí          |
| novedades / Ley 1607                     | Liquidaciones | P,R,… / CR        | `NO` (no inventar)                            | plantilla   |

\* Ciudad fuera de Bogotá: requiere `locationCityName` exacto en draft.

### API / Frontend

- `POST .../generate` body `{ format?: 'TXT' \| 'XLSX' }` (default TXT)
- List/download/metadata incluyen `format`
- Panel: `Archivo plano TXT — Anexo Técnico 2` / `Plantilla XLSX — Aportes en Línea`

### Archivos de validación operativa (sintéticos)

Generar con:

`node --import jiti/register apps/api/scripts/generate-os595-operator-samples.ts`

Salida local (gitignored): `apps/api/tmp/os595-operator-validation/`

### Prueba en Aportes en Línea

| Formato | Archivo                       | Canal           | Resultado                      | Mensaje del operador | Ajuste |
| ------- | ----------------------------- | --------------- | ------------------------------ | -------------------- | ------ |
| XLSX    | `VALIDACION-NO-REAL-…v1.xlsx` | Plantilla Excel | **PENDIENTE DE PRUEBA MANUAL** | —                    | —      |
| TXT     | `VALIDACION-NO-REAL-…v1.txt`  | Archivo plano   | **PENDIENTE DE PRUEBA MANUAL** | —                    | —      |

Sin credenciales de operador en este entorno. Encoding TXT vs operador: **pendiente de confirmación real**.

### Procedimiento manual

1. Abrir Aportes en Línea (preferible ambiente de pruebas).
2. Cargar primero el XLSX en el flujo de plantilla.
3. Cargar después el TXT en el flujo de archivo plano.
4. **No** confirmar pago ni acciones irreversibles.
5. Registrar aceptación/rechazo, mensaje exacto, fila/campo y captura.

### Validaciones globales (cierre extensión)

| Check                          | Resultado                                                                         |
| ------------------------------ | --------------------------------------------------------------------------------- |
| `pnpm typecheck`               | **PASS** (17/17)                                                                  |
| `pnpm --filter api build`      | **PASS**                                                                          |
| `pnpm --filter web-app build`  | **PASS**                                                                          |
| `pnpm build` monorepo          | **FAIL** `@restopsiq/plant` PWA/service worker (preexistente)                     |
| API tests + coverage           | **PASS** suites; branches **80%** (5959/7448)                                     |
| web-app tests completos        | **FAIL** preexistentes (`matchMedia`, Cesantías row, etc.); payroll PILA **PASS** |
| `pnpm lint`                    | **FAIL** `@restopsiq/plant` 218+ errors (preexistente)                            |
| `validate-structure.js`        | **PASS**                                                                          |
| `prisma validate` / `generate` | **PASS**                                                                          |
| `prisma migrate deploy`        | **N/A** (`DATABASE_URL` unset)                                                    |
| CI PR #245                     | **No consultable** (`gh` token inválido en entorno)                               |

### Fuera de alcance (sin cambio)

FSP, novedades PILA, Ley 1607, nuevos tipos planilla, API operador, DIAN.

### Riesgos restantes

- Carga real en operador pendiente
- Ciudades no-Bogotá: nombre exacto de lista
- Máx. 20 empleados en XLSX
- Encoding TXT pendiente de prueba real

### Criterios extensión

- [x] Auditoría documentada
- [x] Migración multi-formato
- [x] XLSX serializer + asset versionado + límite 20
- [x] API + FE dual formato
- [x] Tests específicos
- [x] Coverage API ≥80% branches
- [x] Postman + SDD
- [ ] Prueba real Aportes en Línea (manual)

---

## 24. Validaciones globales (cierre OS-595)

Ver tabla en §27 (extensión multi-formato). No declarar validado por operador hasta cargar TXT y XLSX realmente.

---

_Última actualización: 2026-07-15 — Cierre técnico multi-formato; prueba operador pendiente_
