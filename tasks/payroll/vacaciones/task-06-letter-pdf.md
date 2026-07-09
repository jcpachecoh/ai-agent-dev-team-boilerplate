# OS-589 Task 06 — Carta PDF (aprobación / negación)

**Domain:** `[BACKEND]` `[PDF]` `[STORAGE]`  
**Status:** `pending`  
**Depends on:** [Task 05](./task-05-request-approval-service.md)  
**Epic:** [OS-589](./00-epic-and-decisions.md)

---

## Goal

Generar automáticamente la **carta formal en PDF** al aprobar o rechazar una solicitud de vacaciones, siguiendo las plantillas reales de Palos de Leña / INVERSIONES LLANES, almacenarla en storage y persistir `letterStorageObjectId` en `VacationRequest`.

---

## Referencia visual (fuente de verdad del layout)

Las plantillas oficiales a replicar son:

| Variante       | Referencia                                                                                                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Aprobación** | `FORMATO APROBACION DE VACACIONES` — logo arriba, título centrado, bloques de datos del empleado, periodo de causación, periodo de disfrute, pago en dinero, cierre y firma RRHH |
| **Negación**   | Carta formal con fecha + logo, bloque destinatario, asunto, cuerpo en párrafos, cierre y firma RRHH                                                                              |

Assets de referencia en el workspace (no commitear como dependencia de runtime; solo guía de diseño):

- Aprobación: `assets/image-59f974f1-cb0d-4f37-bad9-1ee994db2045.png`
- Negación: `assets/image-6c824a8a-ae30-438d-883d-67b8183d77ce.png`

---

## Scope

### Archivos

- `apps/api/src/vacations/service/vacation-letter.service.ts`
- `apps/api/src/vacations/templates/vacation-letter-approval.template.ts`
- `apps/api/src/vacations/templates/vacation-letter-rejection.template.ts`
- `apps/api/src/vacations/interfaces/vacation-letter.interfaces.ts` — contexto de datos para plantillas
- `apps/api/src/vacations/test/vacation-letter.service.spec.ts`

### `VacationLetterService`

```typescript
generateAndStoreLetter(
  tenantId: string,
  request: VacationRequestRecord,
  variant: 'APPROVAL' | 'REJECTION',
): Promise<{ storageObjectId: string }>

getLetterPresignedUrl(tenantId: string, requestId: string): Promise<string>
```

El servicio debe **cargar el contexto completo** de la carta (tenant, empleado, sede, balance/periodo de causación) antes de renderizar. No pasar solo `VacationRequestRecord` a las plantillas.

---

## Plantilla 1 — Aprobación (`FORMATO APROBACION DE VACACIONES`)

### Layout (orden vertical, A4 portrait)

1. **Encabezado**
   - Logo del tenant (`Tenant.logoUrl` — si no hay logo, placeholder documentado con iniciales o nombre comercial).
   - Título centrado en mayúsculas: **`FORMATO APROBACION DE VACACIONES`**
   - Razón social del empleador: `Tenant.legalName` (fallback: `Tenant.tradeName` → `Tenant.name`).
   - Línea de lugar y fecha: `{ciudad}, {día de la semana}, {día} de {mes} de {año}` — locale `es-CO`.
     - Ciudad: `Tenant.city` (fallback: ciudad de la sede del empleado → `"Ciudad"`).

2. **Bloque destinatario** (etiquetas en negrita, valores en mayúsculas donde aplique)

   | Campo en carta  | Fuente                                              |
   | --------------- | --------------------------------------------------- |
   | Nombre completo | `User` del empleado (`firstName` + `lastName`)      |
   | Cédula          | `User.cedula`                                       |
   | Cargo           | `EmployeeDetails.position`                          |
   | Correo          | `User.email`                                        |
   | Ciudad          | `EmployeeDetails.city` o sede → fallback `"Ciudad"` |

3. **Cuerpo introductorio**

   Texto fijo (adaptar solo nombres/fechas):

   > Por medio de la presente nos permitimos informarle que su solicitud de vacaciones ha sido **APROBADA**, correspondiente al periodo de causación comprendido entre las fechas que se detallan a continuación.

4. **Periodo de causación** (aniversario laboral que cubre el disfrute)

   | Campo          | Cálculo                                                                                          |
   | -------------- | ------------------------------------------------------------------------------------------------ |
   | PERIODO INICIO | Aniversario de `EmployeeDetails.hireDate` inmediatamente anterior al `startDate` de la solicitud |
   | PERIODO FINAL  | Día anterior al siguiente aniversario (inclusive 365/366 días de derecho)                        |

   Ejemplo (referencia visual): ingreso 14/02/2024, vacaciones jun–jul 2026 → periodo **14/02/2025 – 13/02/2026**.

   Formato de fecha en carta: `DD/MM/YYYY`.

5. **Periodo de disfrute de vacaciones**

   | Campo                 | Fuente                                                                                                      |
   | --------------------- | ----------------------------------------------------------------------------------------------------------- |
   | Fecha inicio disfrute | `VacationRequest.startDate`                                                                                 |
   | Fecha fin disfrute    | `VacationRequest.endDate`                                                                                   |
   | Reintegro laboral     | **Día calendario siguiente** a `endDate`, con nombre del día en español (ej. _Sábado, 18 de julio de 2026_) |
   | Número de días        | `VacationRequest.daysRequested` (entero si aplica)                                                          |

6. **Periodo de pago en dinero de vacaciones** (solo relevante si `type === COMPENSACION`)

   | Campo                    | Valor                                                                                                                                                           |
   | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | Días pagados en efectivo | `daysRequested` si `COMPENSACION`; **0** si `DISFRUTE`                                                                                                          |
   | Nota legal               | Texto fijo: _"El pago se realizará de manera proporcional en la cuenta de nómina dentro de los 5 días hábiles siguientes al inicio del periodo de vacaciones."_ |

7. **Cierre**

   Párrafo de despedida (texto fijo, tono formal):

   > Le deseamos un feliz descanso y agradecemos su compromiso con la compañía.

8. **Bloque de firma RRHH**
   - Línea de firma (espacio en blanco para firma manual).
   - Nombre del responsable de Talento Humano.
   - Cargo: `Jefe de Gestión Humana`.
   - Correo institucional de RRHH.

   **MVP (Q4 del epic):** usar constantes por tenant documentadas en código (`VACATION_LETTER_HR_SIGNATORY` en el servicio o valores desde `Tenant.email` como fallback). No crear tabla nueva de configuración en esta task.

---

## Plantilla 2 — Negación (`ASUNTO: Negación de aprobación`)

### Layout (A4 portrait, estilo carta)

1. **Encabezado**
   - Izquierda: `{ciudad}, {día de la semana}, {día} de {mes} de {año}` (misma regla de locale que aprobación).
   - Derecha: logo del tenant (mismo criterio que plantilla 1).

2. **Bloque destinatario** (mismo bloque que aprobación)

   ```
   Señor(a)
   {NOMBRE COMPLETO}
   {CÉDULA}
   {CARGO}
   {CORREO}
   {CIUDAD}
   ```

3. **Asunto** (negrita)

   **`ASUNTO: Negación de aprobación`**

4. **Cuerpo** — tres párrafos con datos dinámicos

   **Párrafo 1** (insertar `rejectionReason` en el segmento de condición incumplida):

   > En relación con su solicitud de vacaciones presentada el día **{fecha solicitud}**, referente al periodo comprendido entre el **{startDate}** y el **{endDate}**, se informa que no es posible aprobar el disfrute de las mismas, dado que el periodo solicitado no cumple con las condiciones establecidas en la política de vacaciones de la empresa, específicamente en lo relativo a **{rejectionReason}**.
   - `{fecha solicitud}` = `VacationRequest.createdAt` formateada.
   - `{rejectionReason}` = obligatorio (ya validado en task 05).

   **Párrafo 2** (texto fijo):

   > En cumplimiento de nuestras políticas internas y con el fin de garantizar la correcta planificación de las actividades del área, le solicitamos reprogramar su solicitud de vacaciones de acuerdo con las disposiciones establecidas en la política y protocolo de Vacaciones.

   **Párrafo 3** (texto fijo, correo RRHH dinámico):

   > Para cualquier consulta o ajuste de fechas, puede comunicarse con el área de Talento Humano al correo electrónico institucional **{hrEmail}**.

5. **Cierre**

   > Apreciamos su compromiso con la compañía.  
   > Cordialmente,

6. **Bloque de firma RRHH** (idéntico al de aprobación)

---

## Contexto de datos (`VacationLetterContext`)

Definir interfaz mínima que el servicio arma antes de renderizar:

```typescript
interface VacationLetterContext {
  tenant: {
    legalName: string;
    tradeName: string | null;
    logoUrl: string | null;
    city: string | null;
  };
  employee: {
    fullName: string;
    cedula: string;
    position: string;
    email: string;
    city: string;
    hireDate: Date;
  };
  request: VacationRequestRecord;
  accrualPeriod: { start: Date; end: Date };
  returnToWorkDate: Date;
  cashCompensationDays: number; // 0 si DISFRUTE
  hrSignatory: {
    name: string;
    title: string;
    email: string;
  };
  letterDate: Date; // fecha de emisión = now() al generar
}
```

---

## Generación PDF

- Reutilizar patrón de `apps/api/src/reports/service/report-pdf.service.ts` (pdfkit).
- **Formato:** A4 **portrait** (carta, no landscape como reportes tabulares).
- Márgenes ~50 pt; tipografía legible (Helvetica o equivalente del proyecto).
- **No** duplicar infraestructura PDF completa; extraer helper compartido (fechas `es-CO`, dibujo de logo, bloque firma) solo si es mínimo y esta task lo permite.
- Nombre de archivo sugerido: `vacaciones-{APROBACION|NEGACION}-{requestId}.pdf`.

### Helpers de formato obligatorios

| Helper                                              | Ejemplo salida                            |
| --------------------------------------------------- | ----------------------------------------- |
| `formatLetterDateLong(date)`                        | `Bogotá D.C., jueves, 2 de julio de 2026` |
| `formatDateShort(date)`                             | `30/06/2026`                              |
| `formatReturnToWorkDate(date)`                      | `Sábado, 18 de julio de 2026`             |
| `computeAccrualPeriod(hireDate, vacationStartDate)` | `{ start, end }` del aniversario laboral  |

---

## Storage

- Subir PDF vía `StorageService` existente con `domain: StorageDomain.PAYROLL`, `visibility: PRIVATE`.
- `entityType: 'VacationRequest'`, `entityId: request.id`.
- Guardar `letterStorageObjectId` en la solicitud (update vía repository).
- `getLetterPresignedUrl(tenantId, requestId)` — patrón `MobileAttendanceService` / `EmployeeDocumentsService`.

---

## Integración con task 05

- `VacationsService` llama a `VacationLetterService` al llegar a `APROBADA` o `RECHAZADA`.
- Si falla la generación PDF, la transición de estado debe **revertirse** o quedar en error documentado (recomendado: transacción lógica — no marcar `APROBADA` sin carta).

---

## Out of scope

- Firma electrónica (solo espacio en blanco para firma manual).
- Envío por email de la carta.
- Frontend de descarga (task 09).
- Configuración UI de firmante RRHH por tenant (MVP: constantes/fallback documentado).
- Diseño gráfico avanzado más allá de replicar fielmente el layout de las referencias.

---

## Files allowed

- `apps/api/src/vacations/service/vacation-letter.service.ts` — create
- `apps/api/src/vacations/templates/**` — create
- `apps/api/src/vacations/interfaces/vacation-letter.interfaces.ts` — create
- `apps/api/src/vacations/test/vacation-letter.service.spec.ts` — create
- `apps/api/src/vacations/service/vacations.service.ts` — modify (wire letter service)
- `apps/api/src/reports/service/report-pdf.service.ts` — modify (solo si extracción mínima de helper reutilizable)

---

## Files forbidden

- `prisma/schema.prisma`
- `prisma/migrations/**`
- `package.json` / `pnpm-lock.yaml`
- `apps/api/src/app.module.ts`
- `apps/web-app/**`

---

## Acceptance criteria

- [ ] PDF de **aprobación** replica el layout de referencia: logo, título, razón social, fecha larga, bloque empleado, periodo de causación, periodo de disfrute, reintegro laboral, días, sección pago en dinero (0 si `DISFRUTE`), cierre y firma RRHH.
- [ ] PDF de **negación** replica el layout de referencia: fecha + logo, destinatario, asunto, 3 párrafos con `createdAt`, fechas del rango y `rejectionReason`, cierre y firma RRHH.
- [ ] Periodo de causación calculado desde `hireDate` y `startDate` (aniversario laboral).
- [ ] Reintegro laboral = día siguiente a `endDate` con nombre del día en español.
- [ ] Logo del tenant embebido si `logoUrl` existe; fallback documentado si no.
- [ ] Archivo almacenado en storage (`PAYROLL`); `letterStorageObjectId` persistido.
- [ ] URL prefirmada obtenible para descarga.
- [ ] Tests con `StorageService`, carga de contexto y PDF mockeados; casos `DISFRUTE` y `COMPENSACION`.
- [ ] `pnpm --filter=api test -- vacation-letter.service.spec` pasa.

---

## Validation commands

```bash
pnpm --filter=api test -- vacation-letter.service.spec
```
