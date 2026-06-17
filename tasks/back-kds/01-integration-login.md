# BACK-KDS-01 — Integración login KDS con backend y React Query

**Domain:** `[BACK-KDS]` `[PLANT]` `[AUTH]` `[REACT-QUERY]`  
**Status:** `done`  
**Pantalla:** `apps/plant/src/screens/LoginScreen/LoginScreen.tsx`  
**Modelo base:** `apps/api/prisma/schema.prisma` → `OperationalUser`

---

## Objetivo

Conectar la pantalla de login operario del KDS con el backend real usando React Query, reemplazando el flujo demo/local por autenticación de cédula + PIN contra la tabla `operational_users`.

El login debe devolver una sesión tipada para Plant, persistir/poner disponible el token o datos de sesión para llamadas autenticadas, e invalidar/refrescar queries protegidas después de iniciar sesión.

---

## Contexto Actual

- `LoginScreen.tsx` usa estado local (`isSubmitting`, `successName`, `error`) y llama `authenticateOperatorPin(stationId, cedula, pin)`.
- `apps/plant/src/services/auth.service.ts` tiene fallback demo y llama un endpoint placeholder:
  `/api/plant/stations/:stationId/operators/auth`.
- `apps/plant/src/stores/session.store.ts` guarda solo `operatorId` y `operatorName`; todavía no contempla access token, refresh token, role, tenantId o sedeId.
- `apps/api/src/auth` existe para auth email/password de usuarios administrativos. No debe mezclarse con el login operativo KDS.
- La base para KDS está en `OperationalUser`:

```prisma
enum OperationalRole {
  OWNER
  SUPERVISOR
  MANAGER
  OPERATOR
}

model OperationalUser {
  id            String          @id @default(cuid())
  cedulaHash    String
  pinHash       String
  role          OperationalRole
  tenantId      String
  sedeId        String?
  isActive      Boolean         @default(true)
  loginAttempts Int             @default(0)
  lockedUntil   DateTime?
  lastLoginAt   DateTime?
  refreshToken  String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@unique([tenantId, cedulaHash])
  @@index([tenantId])
  @@index([tenantId, role])
  @@map("operational_users")
}
```

---

## Configuración de Base de Datos

Actualizar `.env` local con las credenciales reales de Railway. En `apps/api/.env.example` solo deben quedar placeholders seguros; no commitear contraseñas reales.

Valores de referencia para el entorno Railway:

```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<configurar-en-.env-o-secret-manager>
POSTGRES_DB=railway
POSTGRES_PORT=44926
```

Si el host no es local, agregar `POSTGRES_HOST` o definir `DATABASE_URL` completo según lo entregue Railway.

---

## Alcance Backend

### Endpoint operativo

Crear o completar un módulo/endpoint MES Auth separado de `apps/api/src/auth`:

```http
POST /api/plant/stations/:stationId/operators/auth
Content-Type: application/json

{
  "cedula": "123456789",
  "pin": "1234"
}
```

Respuesta exitosa sugerida:

```ts
interface OperatorLoginResponse {
  accessToken: string;
  refreshToken?: string;
  operator: {
    id: string;
    name?: string;
    role: 'OWNER' | 'SUPERVISOR' | 'MANAGER' | 'OPERATOR';
    tenantId: string;
    sedeId?: string | null;
  };
}
```

### Reglas backend

- Buscar por `tenantId` + `cedulaHash`; el hash debe usar el mismo algoritmo definido para MES Auth.
- Comparar `pin` contra `pinHash` con bcrypt.
- Rechazar usuarios inactivos (`isActive=false`) con `403`.
- Manejar `lockedUntil`, `loginAttempts`, lockout y reset de intentos según las tareas MES Auth.
- Actualizar `lastLoginAt` en login exitoso.
- No exponer si la cédula existe o no.
- Firmar token con secretos MES (`MES_JWT_SECRET`, `MES_JWT_REFRESH_SECRET`).

---

## Alcance Frontend

### React Query Provider

La app Plant debe estar envuelta por un provider de alto nivel con una única instancia de `QueryClient`.

Archivos probables:

- `apps/plant/src/main.tsx`
- `apps/plant/src/App.tsx` o provider equivalente
- `apps/plant/src/services/query-client.ts` (crear si aplica)

Configuración sugerida:

```ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
```

### Función API dedicada

Crear una función tipada para login operativo:

```ts
export interface OperatorLoginInput {
  stationId: string;
  cedula: string;
  pin: string;
}

export interface OperatorLoginResponse {
  accessToken: string;
  refreshToken?: string;
  operator: {
    id: string;
    name?: string;
    role: 'OWNER' | 'SUPERVISOR' | 'MANAGER' | 'OPERATOR';
    tenantId: string;
    sedeId?: string | null;
  };
}

export function loginOperator(input: OperatorLoginInput): Promise<OperatorLoginResponse>;
```

Ubicación sugerida:

- `apps/plant/src/services/auth.service.ts`
- o `apps/plant/src/api/auth.api.ts` si se separan API clients.

### Hook con `useMutation`

Crear un hook o integrar directamente en `LoginScreen.tsx`:

```ts
const queryClient = useQueryClient();

const loginMutation = useMutation({
  mutationFn: loginOperator,
  onSuccess: (session) => {
    sessionStore.login({
      operatorId: session.operator.id,
      operatorName: session.operator.name ?? 'Operario',
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      role: session.operator.role,
      tenantId: session.operator.tenantId,
      sedeId: session.operator.sedeId,
    });
    queryClient.invalidateQueries({ queryKey: ['me'] });
    queryClient.invalidateQueries({ queryKey: ['plant-session'] });
  },
});
```

### UI states

`LoginScreen.tsx` debe reaccionar a estados de React Query:

- `isPending`/`isLoading`: bloquear keypad y mostrar indicador de carga.
- `isSuccess`: mostrar feedback de éxito y nombre de operario antes de navegar.
- `isError`: mostrar `FieldAlertBanner` con mensaje amigable.

Nota: en React Query v5 el estado de carga de mutations es `isPending`; si el proyecto usa v4, usar `isLoading`.

---

## Manejo de Sesión

Actualizar `apps/plant/src/stores/session.store.ts` para que la sesión incluya:

- `operatorId`
- `operatorName`
- `accessToken`
- `refreshToken` si backend lo devuelve
- `role`
- `tenantId`
- `sedeId`
- `sessionStartedAt`

La sesión debe quedar disponible para futuras llamadas autenticadas. Usar almacenamiento seguro definido por el proyecto. Si no existe uno, mantener en memoria con Zustand y documentar la decisión.

`plantFetch` debe poder adjuntar `Authorization: Bearer <accessToken>` cuando exista sesión.

---

## Manejo de Errores

Crear un mapper de errores de auth para UI:

| Código                  | UI message                                            |
| ----------------------- | ----------------------------------------------------- |
| `400`                   | `Revise los datos ingresados.`                        |
| `401`                   | `Cédula o PIN incorrecto.`                            |
| `403`                   | `Usuario sin acceso autorizado para esta estación.`   |
| `423` si se usa lockout | `Usuario bloqueado temporalmente. Intente más tarde.` |
| `500`                   | `No pudimos iniciar sesión. Intente nuevamente.`      |

Si el backend devuelve detalles de validación, mapearlos a mensajes seguros y, cuando aplique, asociarlos al campo `cedula` o `pin`.

No mostrar mensajes técnicos, stacks, SQL errors, hashes, tokens ni detalles sensibles.

---

## Pruebas Requeridas

### Frontend

Agregar pruebas unitarias/integración para:

- `loginOperator` llama el endpoint con `stationId`, `cedula` y `pin` correctos.
- `LoginScreen` usa mutation y muestra loading mientras la promesa está pendiente.
- Login exitoso llama `session.store.login` con token/sesión.
- Login exitoso invalida/refresca queries protegidas (`me`, `plant-session` o las query keys definidas).
- Error `401` muestra `Cédula o PIN incorrecto.`
- Error `403` muestra mensaje de acceso no autorizado.
- Error `500` muestra mensaje genérico sin información sensible.

### Backend

Agregar o completar pruebas para:

- Login correcto con cédula + PIN válidos retorna access token y datos de operario.
- PIN incorrecto retorna `401` y aumenta `loginAttempts`.
- Usuario inactivo retorna `403`.
- Usuario bloqueado retorna el código definido (`401` genérico o `423`) sin filtrar datos sensibles.
- Login exitoso resetea intentos y actualiza `lastLoginAt`.

---

## Criterios de Aceptación

- [x] Plant está envuelta por `QueryClientProvider` con una sola instancia de `QueryClient`.
- [x] Existe función API dedicada y tipada para login operativo con `cedula` + `pin`.
- [x] `LoginScreen.tsx` usa `useMutation` para ejecutar login.
- [x] La UI reacciona a loading, success y error de la mutation.
- [x] La sesión/token devuelto queda almacenado de forma segura según el patrón del proyecto.
- [x] `plantFetch` o cliente HTTP equivalente puede usar el token en futuras llamadas.
- [x] Se invalidan/refrescan queries protegidas después del login exitoso.
- [x] Errores `401`, `403` y `500` se mapean a mensajes claros y seguros.
- [x] Validaciones del backend se muestran como errores amigables y, si aplica, por campo.
- [x] Backend autentica contra `OperationalUser` usando `cedulaHash` y `pinHash`.
- [x] `.env.example` no contiene contraseñas reales; las credenciales reales se configuran en `.env`/secrets.
- [x] Tests frontend cubren llamada API, estados de mutation, almacenamiento de sesión e invalidación de queries.
- [x] Tests backend cubren éxito, credenciales inválidas, acceso no autorizado y lockout/inactive user.

---

## Archivos Probables

Frontend:

- `apps/plant/src/main.tsx`
- `apps/plant/src/App.tsx`
- `apps/plant/src/screens/LoginScreen/LoginScreen.tsx`
- `apps/plant/src/services/auth.service.ts`
- `apps/plant/src/services/plant-api.service.ts`
- `apps/plant/src/stores/session.store.ts`
- `apps/plant/src/screens/LoginScreen/LoginScreen.test.tsx`

Backend:

- `apps/api/src/mes/auth/**` o módulo operativo equivalente
- `apps/api/src/auth/**` solo si se decide explícitamente extender el módulo existente sin mezclar email/password
- `apps/api/prisma/schema.prisma` solo si faltan campos necesarios
- `apps/api/.env.example`

---

## Fuera de Alcance

- Rediseñar la UI visual de `LoginScreen`.
- Crear usuarios operativos en UI administrativa.
- Migrar el login email/password de `apps/api/src/auth`.
- Persistir tokens en almacenamiento no definido por el proyecto sin decisión explícita.

---

## Validación

```bash
pnpm --filter @restopsiq/api typecheck
pnpm --filter @restopsiq/api test -- --testPathPattern=mes-auth
pnpm --filter @restopsiq/plant typecheck
pnpm --filter @restopsiq/plant test -- --run LoginScreen
```
