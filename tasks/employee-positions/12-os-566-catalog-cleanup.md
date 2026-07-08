# OS-566 — Fix información base de empleados (cargos oficiales)

## Goal

Dejar el catálogo de `EmployeePosition` (cargos) sin typos ni duplicados, alineado a la
fuente de verdad vigente, sin romper referencias existentes ni el organigrama de
supervisión (OS-550).

**Depende de:** OS-563 (campos de empleado), OS-550 (colaboradores + organigrama de
supervisión), seed oficial de sedes Palos de Leña, seed oficial de cargos.

---

## ⚠️ Corrección de fuente de verdad (segunda iteración de este ticket)

La primera iteración de OS-566 tomó como "cargos oficiales" la lista de 37 títulos escrita
en el texto del ticket. Esa lista **quedó reemplazada**: la fuente de verdad vigente es el
Excel `apps/api/docs/Organigrama_Palos_de_Lena_Supervision (1).xlsx` (hoja "Organigrama
Palos de Leña", columnas `Cargo` / `Cargo(s) que lo supervisa(n)`).

Hallazgo relevante durante esta segunda iteración: ese Excel **no es un catálogo HR nuevo**
— es la misma jerarquía de supervisión que `employee-org-chart.seed.ts` ya consumió
íntegramente en OS-550 (`ORG_CHART_POSITION_IDS` / `ORG_CHART_EDGES` son, celda por celda,
el mismo contenido de las 32 filas del Excel). No había nada nuevo que extraer de él; lo que
cambió es su **rol**: pasó de "fuente solo de la jerarquía de supervisión" a "fuente
completa de cargos oficiales", por decisión de producto confirmada explícitamente en este
ticket.

Consecuencia: de los 37 títulos de la lista vieja, solo 24 están referenciados por algún
alias del Excel (ver tabla de alias en `employee-org-chart.seed.ts`); sumados a los 8 cargos
nuevos del organigrama (`pos-pdl-039`..`046`), el catálogo oficial vigente queda en **32
cargos activos**. Los 13 títulos restantes de la lista vieja no aparecen en el Excel bajo
ningún alias — se desactivaron (ver más abajo), no se borraron.

## Confirmación de negocio y limpieza estructural (tercera iteración)

Negocio confirmó explícitamente: el Excel es la **única** fuente de cargos oficiales. En
esta iteración se eliminó el último vestigio de la lista vieja como fuente de "activo":
antes, `seedEmployeePositions` primero marcaba **los 37** títulos como `isActive: true` (por
ser parte de `EMPLOYEE_POSITIONS_PDL`) y recién en un segundo paso separado
(`DEPRECATED_EMPLOYEE_POSITION_IDS`) volvía a poner `isActive: false` a los 13 que no están
en el Excel — esto funcionaba (el resultado final era correcto porque el segundo paso
siempre corría después), pero dejaba la puerta abierta a que alguien mirara el primer loop y
concluyera, erróneamente, que "estar en `EMPLOYEE_POSITIONS_PDL`" seguía siendo motivo para
estar activo.

Se restructuró para que no exista ese doble paso: cada entrada de `EMPLOYEE_POSITIONS_PDL`
ahora trae su propio campo `isActive` (calculado una sola vez contra el Excel, con un
comentario que indica el alias correspondiente o la razón de la ausencia), y el único
`upsert` usa ese valor directamente (`isActive: pos.isActive`) — sin pase intermedio que
active de más. El array `DEPRECATED_EMPLOYEE_POSITION_IDS` se renombró a
`POSITION_MERGE_INTO_CANONICAL` y quedó reducido a su único caso real: la fusión
`pos-pdl-009 → pos-pdl-008` (typo-duplicado, requiere reasignar `EmployeeDetails` antes de
desactivar). Ya no existe ningún camino en el código donde "estaba en la lista vieja del
ticket" sea, por sí solo, motivo para mantener un cargo activo.

---

## Decisiones confirmadas

| Tema                       | Estado                     | Decisión                                                                                                                           |
| -------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Áreas / sedes              | Ya correcto                | `EmployeeDetails.locationId` ya es FK real a `Location`. No se toca.                                                               |
| Centro de Costos           | Ya correcto                | `CostCenter` ya es enum DB. No se toca.                                                                                            |
| Clasificación mano de obra | Ya correcto                | `LaborClassification` se mantiene `COCINA` \| `SERVICIO` \| `ADMINISTRATIVO`. `TODOS` NO se agrega al enum de DB — solo filtro UI. |
| Cargos oficiales           | **Alcance de este ticket** | Fuente de verdad = Excel del organigrama (32 cargos). Los 13 títulos fuera del Excel se desactivan, sin borrar.                    |

---

## Scope

- Actualizar `apps/api/prisma/seed.ts` (`EMPLOYEE_POSITIONS_PDL` / `seedEmployeePositions` /
  `POSITION_MERGE_INTO_CANONICAL`) para que el catálogo **activo** refleje el Excel, con
  `isActive` como único mecanismo de activación (sin pase intermedio que active de más).
- Preservar historial: cargos fuera del Excel se marcan `isActive: false`, nunca se borran ni
  se fuerza su reasignación sin alias claro.
- Mantener intactas las relaciones `EmployeePositionSupervisor` (ya sembradas en OS-550) y
  verificar que sigan resolviendo sin huérfanos.
- Documentar el cambio de fuente de verdad (este archivo).

## Out of scope

- Cambios a `Location`, `EmployeeDetails.area`, `CostCenter`, `LaborClassification`.
- Agregar `TODOS` a algún enum de DB.
- Cambios a `apps/api/src/**` o frontend.
- Nueva migración Prisma (no fue necesaria).
- Reescribir `employee-org-chart.seed.ts` (ya estaba 100% alineado al Excel desde OS-550;
  solo se corrigieron comentarios con los typos ya arreglados en la primera iteración).

## Files allowed

- `apps/api/prisma/seed.ts`
- `apps/api/prisma/seeds/employee-org-chart.seed.ts`
- `tasks/employee-positions/12-os-566-catalog-cleanup.md` (este archivo)

## Files forbidden

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- `apps/api/src/**`
- `apps/web-app/src/**`

---

## Catálogo oficial vigente (32 cargos activos = Excel del organigrama)

Los 24 cargos operativos existentes referenciados por alias desde el Excel, más los 8
cargos nuevos del organigrama, quedan `isActive: true`:

```
ADMINISTRADOR JUNIOR                    JEFE DE COMPRAS               (alias: Jefe de Abastecimiento)
ALMACENISTA                             JEFE DE TALENTO HUMANO        (alias: Líder de Talento Humano)
ANALISTA DE COMPRAS   (alias: Analista de Abastecimiento)             LIDER DE PLANTA DE PRODUCCION (alias: Líder de Producción)
ANALISTA FINANCIERA Y CONTABLE          PARRILLERO                    (alias: Parrilleros)
APRENDIZ SENA                           PARRILLERO JUNIOR             (alias: Parrilla Jr)
ASESOR DE VENTAS      (alias: Asesores de Venta)                      PROGRAMADOR
AUXILIAR DE CONDUCCION (alias: Aux. Conductor)                        SERVICIOS GENERALES
AUXILIAR TALENTO HUMANO
CHEF CORPORATIVO
COCINA
CONDUCTOR
DIRECTOR DE OPERACIONES
DIRECTORA COMERCIAL   (alias: Director Comercial y Mercadeo)
EJECUTIVO COMERCIAL
GERENTE DE PUNTO DE VENTA (alias: Gerente PDV/Administrador)
GERENTE GENERAL
IMPULSADOR            (alias: Impulsadores)

+ 8 cargos nuevos del organigrama (pos-pdl-039..046, employee-org-chart.seed.ts):
FUNDADORES, REVISORÍA FISCAL, DIRECTOR JURÍDICO - EXTERNO,
DIRECTOR ADMINISTRATIVO - FINANCIERO, COORDINADOR DE PLANTA, COCINA PLANTA,
ANALISTA TALENTO HUMANO, SST EXTERNO
```

Total activo verificado por SQL: **32**.

## Cargos desactivados (14) — sin alias en el Excel, historial preservado

| id            | title                                  | Motivo                                                                                                                |
| ------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `pos-pdl-009` | AUXLIAR DE COCINA Y PRODUCCION         | typo-duplicado de `pos-pdl-008` (arreglado en 1ª iteración) — empleados reasignados a `pos-pdl-008`                   |
| `pos-pdl-001` | ADMINISTRADOR                          | no aparece en el Excel                                                                                                |
| `pos-pdl-005` | GERENTE ADMINISTRATIVA                 | no aparece en el Excel                                                                                                |
| `pos-pdl-008` | AUXILIAR DE COCINA Y PRODUCCION        | no aparece en el Excel (el Excel solo tiene "Cocina" → `pos-pdl-011`, sin alias claro de que sea el mismo cargo)      |
| `pos-pdl-012` | COCINA FIN DE SEMANA                   | no aparece en el Excel                                                                                                |
| `pos-pdl-016` | ASESORA DE VENTAS FIN DE SEMANA        | no aparece en el Excel                                                                                                |
| `pos-pdl-017` | BARTENDER                              | no aparece en el Excel                                                                                                |
| `pos-pdl-019` | HOSTESS FIN DE SEMANA                  | no aparece en el Excel                                                                                                |
| `pos-pdl-021` | IMPULSADOR FIN DE SEMANA               | no aparece en el Excel                                                                                                |
| `pos-pdl-024` | ANALISTA DE GESTIÓN HUMANA             | no aparece en el Excel                                                                                                |
| `pos-pdl-027` | AUDITOR                                | no aparece en el Excel                                                                                                |
| `pos-pdl-028` | AUXILIAR ADMINISTRATIVO                | no aparece en el Excel                                                                                                |
| `pos-pdl-030` | CONTADOR                               | no aparece en el Excel                                                                                                |
| `pos-pdl-037` | AUXILIAR DE CONDUCCION Y MANTENIMIENTO | no aparece en el Excel (distinto de `pos-pdl-036` AUXILIAR DE CONDUCCION, que sí está aliasado como "Aux. Conductor") |

Ninguno se borró. El mecanismo, tras la limpieza estructural de la 3ª iteración:

1. **`isActive` por entrada en `EMPLOYEE_POSITIONS_PDL`** — cada uno de los 37 títulos trae
   su `isActive: true/false` calculado contra el Excel (con comentario inline del alias o de
   la razón de ausencia). El único `upsert` de `seedEmployeePositions` escribe ese valor tal
   cual — no hay paso posterior que lo pise. Esto cubre los 13 títulos sin alias en el Excel:
   quedan `isActive: false` desde su propia definición, sin tocar `EmployeeDetails` (sin
   alias claro no hay a dónde reasignar; solo se reporta — ver `groupBy` más abajo).
2. **`POSITION_MERGE_INTO_CANONICAL`** — reducido a su único caso real: `pos-pdl-009 →
pos-pdl-008` (typo-duplicado exacto, con alias claro). Para este caso puntual sí se
   reasigna `EmployeeDetails.positionId`/`position`/`area` al canónico antes de desactivar.
3. **Reporte de visibilidad** — al final de `seedEmployeePositions`, un `groupBy` sobre
   `EmployeeDetails` (`where: { positionRef: { isActive: false } }`) loguea cuántos
   empleados quedan con un `positionId` apuntando a un cargo hoy inactivo, cualquiera sea la
   razón — sin mutar nada. En el ambiente local esto imprime 0 líneas porque
   `seedBulkAttendanceCollaborators` (que corre después en el mismo `main()`) recalcula sus
   ~100 colaboradores sintéticos contra la lista de cargos activos en cada corrida y los
   realinea solo; en staging/prod, con empleados reales, si alguno quedó apuntando a un
   cargo recién desactivado, esta línea de log lo va a mostrar.

Este mecanismo es extensible — agregar/quitar cargos del catálogo oficial en el futuro es
cambiar el `isActive` de una entrada (o agregar una nueva), sin lógica ad-hoc nueva.

## Aliases del Excel (sin cambios funcionales, solo comentarios corregidos)

`employee-org-chart.seed.ts` ya mapeaba estos alias por `id` desde OS-550; la única
actualización fue de comentarios que aún citaban los typos ya corregidos en la 1ª iteración
de este ticket (`CHEF COORPORATIVO` → `CHEF CORPORATIVO`, `JEFE DE TALENO HUMANO` → `JEFE DE
TALENTO HUMANO`). La lógica de resolución de alias no cambió — ya estaba 100% alineada al
Excel.

---

## Validaciones ejecutadas (tercera iteración)

1. **Seed contra Postgres local** (`restopsiq_dev` en `localhost:15432`), corrido dos veces
   con la lógica restructurada:
   - Ambas corridas imprimieron exactamente el mismo log: `seeded 37 positions ... (24 active
per Excel del organigrama, 13 deprecated)`, `deactivated deprecated position pos-pdl-009
(...)`, `organigrama: 8 cargos nuevos` — **sin diferencias entre corrida 1 y 2, confirma
     idempotencia**.
   - El reporte de "employee(s) keep positionId=<inactivo>" no imprimió nada en ninguna
     corrida porque el seed de colaboradores bulk (que corre después) ya había realineado a
     todos los empleados sintéticos contra la lista de 32 cargos activos.
2. **SQL 1 — exactamente N activos, N = 32** (cargos únicos oficiales del Excel):
   `SELECT count(*) FROM employee_positions WHERE "tenantId"='palos-de-lena' AND "isActive"=true`
   → **32**.
3. **SQL 2 — 0 activos fuera del Excel**: los 13 ids deprecados (`pos-pdl-001, 005, 008, 012,
016, 017, 019, 021, 024, 027, 028, 030, 037`) filtrados por `isActive=true` → **0 filas**.
4. **SQL 3 — 0 duplicados activos por título normalizado**
   (`upper(trim(title))` con `count(*)>1` sobre activos) → **0 filas**.
5. **SQL 4 — 0 `EmployeeDetails.positionId` huérfanos** (`LEFT JOIN` contra
   `employee_positions` con `positionId IS NOT NULL AND ep.id IS NULL`) → **0 filas**.
6. **SQL 5 — 0 relaciones `EmployeePositionSupervisor` huérfanas** (`LEFT JOIN` de
   `positionId` y `supervisorPositionId`, ambos lados, contra `employee_positions`) →
   **0 filas**.
7. **SQL 6 — 0 relaciones de supervisión apuntando a cargos inactivos** (`JOIN` de ambos
   lados de `employee_position_supervisors` contra `employee_positions`, filtrando
   `isActive=false` en cualquiera de los dos) → **0 filas**. Se cumple por construcción:
   `ORG_CHART_POSITION_IDS`/`ORG_CHART_EDGES` solo referencian los 24 ids del catálogo viejo
   que quedaron `isActive: true` más los 8 nuevos del organigrama (siempre activos).
8. `pnpm typecheck` — 15/15 tasks OK.
9. `pnpm --filter api build` — OK, sin errores.
10. `npx jest employee-positions attendance-collaborators` — 8 suites, 123 tests, todos en
    verde. No se corrió `test:cov` completo: el cambio no tocó `apps/api/src/**`, solo seed.
    No existe un suite de tests dedicado a los archivos de seed (`find ... -iname
"*seed*.spec.ts"` → vacío) — se validó por SQL + doble corrida en su lugar.

---

## Riesgos / pendientes

- Empleados reales (no demo) que hoy tengan `positionId` apuntando a alguno de los 13 cargos
  desactivados **no se reasignarán automáticamente** — no hay alias claro en el Excel para
  decidir a dónde. El seed preserva su FK (referencia histórica válida) pero el cargo
  desaparece de los dropdowns de selección para altas/ediciones nuevas. El log de
  `seedEmployeePositions` reporta cuántos empleados quedan en esa situación en cada corrida
  (`employee(s) keep positionId=<id> (inactive, history preserved, not reassigned)`) — revisar
  ese log al correr el seed en staging/prod, antes de propagar a prod. Si el negocio
  efectivamente sigue usando cargos como BARTENDER, AUDITOR o CONTADOR operativamente, alguien
  va a necesitar reactivarlos manualmente o pedir que se agreguen al Excel oficial.
- El Excel es una jerarquía de supervisión, no fue diseñado como catálogo HR exhaustivo —
  cualquier cargo operativo real que no tenga una línea de reporte documentada ahí quedará
  fuera del catálogo oficial con este criterio. Vale la pena que producto confirme con RRHH
  que ninguno de los 13 desactivados sigue en uso activo antes de propagar este seed a
  staging/prod.
- Quedan sin resolver (fuera de alcance, ya documentado en la auditoría original de OS-566):
  el mismatch entre "11 Restaurante + Oficina Principal" y las 14 sedes reales sembradas, y la
  ambigüedad de que `EmployeeDetails.area` (columna DB) no es lo que la UI muestra como
  "Área" (que en realidad es `locationId`).
