# OS-563 — Employee Form Enhancements

## Objetivo

Complementar el formulario de creación/edición de empleados con campos adicionales requeridos para la operación de Palos de Leña: ubicación residencial, clasificación operacional (Centro de Costos, Clasificación mano de obra), beneficio no salarial, y beneficiarios familiares gestionados inline.

---

## Alcance

### Backend

- Nuevos enums: `CostCenter`, `LaborClassification`
- Nuevo valor en enum existente: `TUTOR` en `EmployeeRelationshipType`
- Nuevos campos en `EmployeeDetails`: `barrio`, `localidad`, `costCenter`, `laborClassification`, `nonSalaryAmount`
- DTOs actualizados: `CreateEmployeeDto`, `UpdateEmployeeDto`, nuevo `BeneficiaryInputDto`
- Beneficiarios gestionados inline (reusa `EmployeeSocialProfile`) con operación bulk-replace en update
- AuditLog integrado en service layer (`create` y `update`) con captura de `oldValue`/`newValue`
- Cargo: validación de `positionId` contra catálogo; sincronización de `position` con `EmployeePosition.title`; permite texto libre si no hay positionId

### Frontend

- Nuevos campos en formulario: Barrio, Localidad, Centro de Costos, Clasificación mano de obra, No salariales, Beneficiarios
- Label "Sede" → "Áreas"
- Cargo: select cuando hay `EmployeePosition` activos, input libre con ayuda cuando no
- Tabla de beneficiarios con filas removibles
- Tipos de beneficiario: Hijo (CHILD), Cónyuge (SPOUSE), Tutor (TUTOR)

### Seed

- 28 `EmployeePosition` base para Palos de Leña
- Empleados demo actualizados con nuevos campos

---

## Decisiones técnicas

| Decisión                 | Resolución                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `roleId` vs `costCenter` | `roleId` sigue siendo el rol de sistema (auth). `costCenter` es un campo operacional nuevo e independiente. No se renombran ni se mezclan. |
| Label "Sede" → "Áreas"   | Renombrado a "Áreas" en UI. El campo en BD sigue siendo `locationId`. No se creó un campo nuevo.                                           |
| `area` (legacy)          | Queda como campo heredado en schema. `laborClassification` es el nuevo campo tipado.                                                       |
| "Todos" en Clasificación | Solo opción UI/filtro. No se almacena en DB. Equivale a "sin filtro" en OS-578 y reportes.                                                 |
| `noSalariales`           | Campo simple `nonSalaryAmount Decimal?`. No tabla relacional.                                                                              |
| Beneficiarios            | Reusan `EmployeeSocialProfile`. Inline en formulario. Update = soft-delete-all + recrear.                                                  |
| Edad en beneficiarios    | UI recibe `age: number (0-99)`. Backend convierte a `birthDate = 1-ene del año (now.year - age)`.                                          |
| `TUTOR`                  | Nuevo valor en `EmployeeRelationshipType`. Formulario ofrece CHILD/SPOUSE/TUTOR.                                                           |
| AuditLog                 | Integrado en `PayrollService.create()` y `.update()`. UI de historial fuera de alcance.                                                    |
| Cargo                    | `EmployeePosition` como catálogo. Si sin cargos activos → texto libre con placeholder "Lista en configuración".                            |

---

## Modelo de datos

### Nuevos enums

```prisma
enum CostCenter {
  ADMINISTRATIVO
  OPERACIONES
  PLANTA
  GERENCIA
  INCAPACIDADES
}

enum LaborClassification {
  COCINA
  SERVICIO
  ADMINISTRATIVO
}
```

### Cambios en `EmployeeRelationshipType`

```prisma
enum EmployeeRelationshipType {
  SPOUSE
  CHILD
  FATHER
  MOTHER
  TUTOR    // NUEVO
  OTHER
}
```

### Campos nuevos en `EmployeeDetails`

```prisma
barrio              String?
localidad           String?
costCenter          CostCenter          @default(OPERACIONES)
laborClassification LaborClassification @default(ADMINISTRATIVO)
nonSalaryAmount     Decimal?            @db.Decimal(12,2)
```

### Índices nuevos

```prisma
@@index([tenantId, costCenter])
@@index([tenantId, laborClassification])
```

---

## Compatibilidad con OS-578

OS-578 filtra empleados para liquidación/asistencia. El mapeo correcto:

| Filtro OS-578    | Campo                 | Valor                   |
| ---------------- | --------------------- | ----------------------- |
| `administrativo` | `costCenter`          | `= ADMINISTRATIVO`      |
| `operaciones`    | `laborClassification` | `IN [COCINA, SERVICIO]` |
| `todos`          | —                     | Sin filtro (opción UI)  |

---

## Seed — EmployeePosition para Palos de Leña

38 posiciones en 6 grupos: Gerencia, Cocina, Servicio, Planta, Administrativo, Logística.
IDs fijos con prefijo `pos-pdl-` para idempotencia. Títulos en mayúsculas tal como los entregó el cliente.

| ID          | Título (exacto)                        | Área interna   |
| ----------- | -------------------------------------- | -------------- |
| pos-pdl-001 | ADMINISTRADOR                          | Gerencia       |
| pos-pdl-002 | ADMINISTRADOR JUNIOR                   | Gerencia       |
| pos-pdl-003 | DIRECTOR DE OPERACIONES                | Gerencia       |
| pos-pdl-004 | DIRECTORA COMERCIAL                    | Gerencia       |
| pos-pdl-005 | GERENTE ADMINISTRATIVA                 | Gerencia       |
| pos-pdl-006 | GERENTE DE PUNTO DE VENTA              | Gerencia       |
| pos-pdl-007 | GERENTE GENERAL                        | Gerencia       |
| pos-pdl-008 | AUXILIAR DE COCINA Y PRODUCCION        | Cocina         |
| pos-pdl-009 | AUXLIAR DE COCINA Y PRODUCCION ¹       | Cocina         |
| pos-pdl-010 | CHEF COORPORATIVO ²                    | Cocina         |
| pos-pdl-011 | COCINA                                 | Cocina         |
| pos-pdl-012 | COCINA FIN DE SEMANA                   | Cocina         |
| pos-pdl-013 | PARRILLERO                             | Cocina         |
| pos-pdl-014 | PARRILLERO JUNIOR                      | Cocina         |
| pos-pdl-015 | ASESOR DE VENTAS                       | Servicio       |
| pos-pdl-016 | ASESORA DE VENTAS FIN DE SEMANA        | Servicio       |
| pos-pdl-017 | BARTENDER                              | Servicio       |
| pos-pdl-018 | EJECUTIVO COMERCIAL                    | Servicio       |
| pos-pdl-019 | HOTESS FIN DE SEMANA ³                 | Servicio       |
| pos-pdl-020 | IMPULSADOR                             | Servicio       |
| pos-pdl-021 | IMPULSADOR FIN DE SEMANA               | Servicio       |
| pos-pdl-022 | LIDER DE PLANTA DE PRODUCCION          | Planta         |
| pos-pdl-023 | ANALISTA DE COMPRAS                    | Administrativo |
| pos-pdl-024 | ANALISTA DE GESTIÓN HUMANA             | Administrativo |
| pos-pdl-025 | ANALISTA FINANCIERA Y CONTABLE         | Administrativo |
| pos-pdl-026 | APRENDIZ SENA                          | Administrativo |
| pos-pdl-027 | AUDITOR                                | Administrativo |
| pos-pdl-028 | AUXILIAR ADMINISTRATIVO                | Administrativo |
| pos-pdl-029 | AUXILIAR TALENTO HUMANO                | Administrativo |
| pos-pdl-030 | CONTADOR                               | Administrativo |
| pos-pdl-031 | JEFE DE COMPRAS                        | Administrativo |
| pos-pdl-032 | JEFE DE TALENO HUMANO ⁴                | Administrativo |
| pos-pdl-033 | PROGRAMADOR                            | Administrativo |
| pos-pdl-034 | SERVICIOS GENERALES                    | Administrativo |
| pos-pdl-035 | ALMACENISTA                            | Logística      |
| pos-pdl-036 | AUXILIAR DE CONDUCCION                 | Logística      |
| pos-pdl-037 | AUXILIAR DE CONDUCCION Y MANTENIMIENTO | Logística      |
| pos-pdl-038 | CONDUCTOR                              | Logística      |

> ¹ Typo del cliente ("AUXLIAR" en lugar de "AUXILIAR") — mantenido exacto.
> ² Typo del cliente ("COORPORATIVO" en lugar de "CORPORATIVO") — mantenido exacto.
> ³ Typo del cliente ("HOTESS" en lugar de "HOSTESS") — mantenido exacto.
> ⁴ Typo del cliente ("TALENO" en lugar de "TALENTO") — mantenido exacto.

**Centro de Costos** (enum `CostCenter`): ADMINISTRATIVO · INCAPACIDADES · OPERACIONES · PLANTA · GERENCIA

**Clasificación mano de obra** (enum `LaborClassification`): COCINA · SERVICIO · ADMINISTRATIVO
"Todos" es opción UI/filtro únicamente — no se almacena en DB.

**Áreas** en formulario = campo `locationId` (sedes del restaurante). No campo nuevo.

---

## Riesgos y pendientes

| Riesgo                                | Mitigación                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| Datos legacy en `area` (String libre) | `laborClassification` es campo nuevo. `area` queda pero deja de ser UI principal.    |
| Seed no vincula `positionId`          | Los empleados demo usan texto libre `position`. Cargos se asignan manualmente en UI. |
| `TUTOR` requiere migración Prisma     | Aditivo, no rompe datos existentes.                                                  |
| AuditLog captura Decimal como string  | `salaryAmount` se serializa como string en JSON. Aceptable para auditoría.           |

---

## QA

### Backend

- POST `/employees` con `costCenter`, `laborClassification`, `barrio`, `localidad`, `nonSalaryAmount`, `beneficiaries`
- PATCH `/employees/:userId` con campos parciales
- GET `/employees/:userId` verifica nuevos campos en respuesta
- POST con `costCenter` inválido → 400
- POST con `nonSalaryAmount: -100` → 400
- POST con `barrio` > 100 chars → 400
- POST con `positionId` inexistente → 400
- POST sin `beneficiaries` → empleado creado normalmente
- POST con beneficiario `age: 150` → 400
- PATCH con `beneficiaries: []` → elimina todos los beneficiarios existentes

### Frontend

- Formulario renderiza todos los campos nuevos
- Centro de Costos es select obligatorio
- Áreas = locationId (antes "Sede")
- Cargo: select cuando hay posiciones activas, input libre cuando no
- Beneficiarios: agregar/remover filas, tipos dropdown
- No salariales: solo acepta positivos, 2 decimales
- Validaciones Zod bloquean submit inválido
