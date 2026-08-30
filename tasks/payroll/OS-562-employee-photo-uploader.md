# OS-562 — Employee Photo Uploader

## Objetivo

Permitir a usuarios con permisos de escritura de nómina (`PAYROLL_WRITE_ROLES`) cargar, visualizar y actualizar la foto de perfil de un empleado usando Cloudflare R2 a través del `StorageModule` existente.

---

## Alcance

- Reutiliza `StorageModule` con el perfil `AVATAR` (256×256 px, crop, WebP).
- No se usa presigned URL — el endpoint `/api/storage/upload` resuelve el flujo completo.
- Solo `PAYROLL_WRITE_ROLES` (OWNER, SUPER_ADMIN, SUPERVISOR, MANAGER) puede cambiar la foto.
- No se implementa auto-edición de propia foto en este ticket (sin `self-edit`).

---

## Modelo de datos

### Migración

```
prisma/migrations/20260630140000_os562_add_employee_photo/migration.sql
```

Campo añadido a `EmployeeDetails`:

```prisma
photoStorageObjectId String?
photoStorageObject   StorageObject? @relation(fields: [photoStorageObjectId], references: [id], onDelete: SetNull)
```

La relación inversa `employeePhotos EmployeeDetails[]` se agregó a `StorageObject`.

### Campos en la respuesta del empleado

| Campo                  | Tipo             | Descripción                                    |
| ---------------------- | ---------------- | ---------------------------------------------- |
| `photoStorageObjectId` | `string \| null` | FK al `StorageObject` activo                   |
| `photoUrl`             | `string \| null` | URL pública calculada (`R2_PUBLIC_DOMAIN/key`) |

`photoUrl` se deriva en el mapper — no se persiste en la DB.

---

## Flujo de upload

```
[1] Frontend → POST /api/storage/upload
      FormData: { file, domain: USERS, imageProfile: AVATAR,
                  entityType: EmployeeDetails, entityId: <employeeDetailsId>,
                  visibility: PUBLIC }
      ← { id, publicUrl, originalName }

[2] Frontend → PATCH /api/employees/:userId
      Body: { photoStorageObjectId: <id del paso 1> }
      ← EmployeeResponseDto con photoStorageObjectId y photoUrl

[3] Frontend muestra publicUrl como avatar del empleado
```

---

## Validaciones

### Cliente (EmployeePhotoUploader)

- Tipos permitidos: `image/jpeg`, `image/png`, `image/webp`
- Tamaño máximo: 2 MB
- Toast de error si falla validación, red o respuesta sin `publicUrl`

### Backend (PayrollService.validateAndSwapPhoto)

- `StorageService.findById(id, tenantId)` — lanza `NotFoundException` si no existe o cross-tenant
- `domain === USERS` — `BadRequestException` si no cumple
- `entityType === 'EmployeeDetails' || entityType === null` — `BadRequestException` si es de otra entidad
- `entityId === employee.id || entityId === null` — `BadRequestException` si pertenece a otro empleado
- Soft-delete del `StorageObject` anterior si existía (via `StorageService.deleteFile`)
- Si `photoStorageObjectId === null`: quita la foto y soft-delete del anterior

---

## Seguridad

| Aspecto          | Implementación                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| Tenant isolation | `StorageService.findById` filtra por `tenantId`; el service valida que el empleado sea del tenant               |
| RBAC             | `PAYROLL_WRITE_ROLES` en `PATCH /employees/:userId` — no cambió                                                 |
| Cross-entity     | Se valida que `entityType` sea `EmployeeDetails` y `entityId` coincida con el `EmployeeDetails.id` del empleado |
| Self-edit        | No implementado en OS-562                                                                                       |

---

## Archivos modificados

### Backend

| Archivo                                                                   | Cambio                                                                          |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `prisma/schema.prisma`                                                    | `photoStorageObjectId` + relación en `EmployeeDetails` y `StorageObject`        |
| `prisma/migrations/20260630140000_os562_add_employee_photo/migration.sql` | Nueva                                                                           |
| `payroll/interfaces/payroll.interfaces.ts`                                | `photoStorageObjectId?` en `UpdateEmployeeData`                                 |
| `payroll/controller/dto/update-employee.dto.ts`                           | `photoStorageObjectId?` en DTO                                                  |
| `payroll/mapper/employees.mapper.ts`                                      | `photoStorageObjectId`, `photoUrl` en respuesta                                 |
| `payroll/repository/payroll.repository.ts`                                | Include `photoStorageObject`, campo en `normalizeEmployeeUpdate`                |
| `payroll/service/payroll.service.ts`                                      | Inyecta `StorageService`, `validateAndSwapPhoto`, campo en `buildUpdatePayload` |
| `payroll/test/payroll.service.spec.ts`                                    | 6 nuevos tests para flujo de foto                                               |

### Frontend

| Archivo                                                | Cambio                                                                                                          |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `payroll/types/payroll.types.ts`                       | `photoStorageObjectId`, `photoUrl` en `PayrollEmployee`; `photoStorageObjectId` en `UpdatePayrollEmployeeInput` |
| `payroll/api/employee-photo.api.ts`                    | Nuevo — `uploadEmployeePhoto`, `validateEmployeePhotoFile`                                                      |
| `payroll/api/employee-photo.api.test.ts`               | Nuevo — tests del API helper                                                                                    |
| `payroll/components/EmployeePhotoUploader.tsx`         | Nuevo componente                                                                                                |
| `payroll/components/EmployeePhotoUploader.module.scss` | Estilos del uploader                                                                                            |
| `payroll/components/PayrollEmployeeEditDrawer.tsx`     | Integra `EmployeePhotoUploader`                                                                                 |
| `packages/ui/.../EmpleadoAvatar.tsx`                   | Prop `photoUrl?` + render de `<img>`                                                                            |
| `packages/ui/.../EmpleadoAvatar.module.scss`           | Estilos `has-photo`, `.photo`, `size--lg`                                                                       |
| `packages/ui/.../empleado-types.ts`                    | `EmpleadoSize` incluye `'lg'`                                                                                   |

---

## QA

### Postman

Ver carpeta `12 — Employees / OS-562 Photo Upload` en la colección.

Flujo completo:

1. Upload Employee Photo → guarda `employeePhotoStorageObjectId`
2. Update Employee Photo → guarda `employeePhotoUrl`
3. Get Employee → verifica `photoStorageObjectId` y `photoUrl`

### UI manual

| Escenario                                    | Resultado esperado                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------ |
| Abrir drawer de edición de empleado sin foto | Avatar con iniciales, hint "JPG, PNG o WebP · máx. 2 MB"                 |
| Seleccionar JPG válido < 2 MB                | Toast "Subiendo foto...", luego "Foto actualizada", avatar muestra foto  |
| Seleccionar GIF (tipo inválido)              | Toast de error "Solo se permiten archivos JPG, PNG o WebP"               |
| Seleccionar archivo > 2 MB                   | Toast de error "El archivo no puede superar 2 MB"                        |
| Error de red en upload                       | Toast de error con mensaje del servidor                                  |
| Subir segunda foto                           | Foto anterior queda soft-deleted en StorageObject, nueva foto se muestra |

---

## Riesgos / Pendientes

1. **Self-edit**: Empleados con rol `OPERATOR` no pueden cambiar su propia foto por ahora — OS-563 si se requiere.
2. **Cleanup R2 asíncrono**: La eliminación del objeto físico en R2 queda marcada como `providerDeletePending: true` y se limpiará en un job futuro.
3. **Sin límite de fotos pendientes**: Si el upload falla después del POST a R2 pero antes del PATCH al empleado, queda un `StorageObject` huérfano. Se puede limpiar por job periódico.
