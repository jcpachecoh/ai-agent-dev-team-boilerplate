# TASK 07 — Páginas Legales (App Stores + Compliance)

**Estado:** [ ] Pendiente
**Depende de:** 02, 03

> **CRÍTICO para publicación en Google Play y Apple App Store.**
> Todas estas páginas deben estar en línea ANTES de someter la app a revisión.
> URLs deben ser permanentes y accesibles sin login.

---

## Layout compartido para páginas legales

```tsx
// components/legal/LegalPageLayout.tsx
interface LegalPageProps {
  title: string;
  lastUpdated: string; // "15 de julio de 2025"
  children: React.ReactNode;
}
```

Estilos: `max-w-3xl mx-auto prose prose-neutral` — tipografía bien estructurada con Tailwind Typography. Breadcrumb al tope. Tabla de contenidos sticky en desktop.

---

## 7.1 — Política de Privacidad (`/legal/privacidad`)

**URL canónica:** `https://opssynk.com/legal/privacidad`
**Requerida por:** Google Play Console, Apple App Store Connect, GDPR, Ley 1581/2012 Colombia

### Secciones obligatorias

1. **Quiénes somos** — Razón social, NIT, dirección, email de privacidad
2. **Datos que recopilamos**
   - Datos de registro (nombre, email, teléfono)
   - Datos de uso (logs, métricas de app)
   - Datos del dispositivo (OS, versión app, ID dispositivo)
   - Datos de ubicación (si aplica para domicilios)
   - Datos de empleados procesados en nombre del restaurante (controlador → procesador)
3. **Finalidad del tratamiento** — Para qué usamos cada dato
4. **Base legal** — Consentimiento / ejecución del contrato / interés legítimo
5. **Compartición con terceros** — Resend (email), Railway/OCI (hosting), proveedores de pago
6. **Transferencias internacionales** — Estándares contractuales
7. **Retención de datos** — Tiempos por tipo de dato
8. **Derechos del titular** — Acceso, rectificación, supresión, portabilidad, oposición
9. **Seguridad** — Encriptación, controles de acceso, auditorías
10. **Cookies** — Link a política de cookies
11. **Menores de edad** — No recopilamos datos de menores conscientemente
12. **Cambios a esta política** — Notificación por email 30 días antes
13. **Contacto** — privacidad@opssynk.com | Calle X, Bogotá, Colombia

**Nota sobre datos de empleados:** OpsSync actúa como **encargado del tratamiento** (procesador) de los datos de empleados. El restaurante (cliente) actúa como **responsable del tratamiento** (controlador). Responsabilidad documentada.

---

## 7.2 — Términos y Condiciones (`/legal/terminos`)

**URL canónica:** `https://opssynk.com/legal/terminos`
**Requerida por:** Apple App Store, Google Play, uso legal del servicio

### Secciones

1. **Aceptación de términos** — Al usar OpsSync aceptas estos términos
2. **Descripción del servicio** — Plataforma SaaS B2B para restaurantes
3. **Registro y cuenta** — Responsabilidades del cliente, credenciales
4. **Uso aceptable** — Qué está prohibido (scraping, ingeniería inversa, etc.)
5. **Plan de suscripción y pagos** — Ciclos, métodos de pago, vencimientos
6. **Cancelación** — Cómo cancelar, efecto inmediato o fin de período
7. **Propiedad intelectual** — OpsSync owns the platform; cliente owns their data
8. **Datos del cliente** — Copia y portabilidad de datos al cancelar (30 días)
9. **Confidencialidad** — Ambas partes
10. **Limitación de responsabilidad** — Cap en 3 meses de suscripción pagada
11. **Indemnización** — Cliente indemniza a OpsSync por uso indebido
12. **Fuerza mayor** — Eventos fuera de control
13. **Modificaciones al servicio** — Aviso 30 días antes de cambios mayores
14. **Ley aplicable** — Ley colombiana, jurisdicción Bogotá D.C.
15. **Contacto** — legal@opssynk.com

---

## 7.3 — EULA — Licencia de Uso de Software (`/legal/eula`)

**URL canónica:** `https://opssynk.com/legal/eula`
**Requerida por:** Apple App Store Connect (campo "License Agreement URL")
**También se puede referenciar desde:** Google Play (sección de privacidad)

### Secciones

1. **Partes** — OpsSync S.A.S. (licenciante) y usuario final (licenciatario)
2. **Concesión de licencia** — No exclusiva, no transferible, revocable, para uso del servicio
3. **Restricciones** — No copiar, no descompilar, no sublicenciar, no usar para fines ilegales
4. **Propiedad intelectual** — Todos los derechos reservados a OpsSync
5. **Actualizaciones** — Automáticas; nuevas versiones bajo mismos términos
6. **Terminación** — Viola los términos → licencia revocada inmediatamente
7. **Sin garantías** — Servicio "as-is" con limitaciones de garantía
8. **Responsabilidad limitada** — Según leyes aplicables de Colombia
9. **Ley aplicable** — Ley colombiana

---

## 7.4 — Política de Cookies (`/legal/cookies`)

**URL canónica:** `https://opssynk.com/legal/cookies`

### Secciones

1. **¿Qué son las cookies?** — Definición clara
2. **Cookies que usamos**

| Nombre              | Tipo        | Duración | Finalidad               |
| ------------------- | ----------- | -------- | ----------------------- |
| `session`           | Esencial    | Sesión   | Autenticación           |
| `_vercel_analytics` | Analytics   | 1 año    | Métricas de uso         |
| `cookie_consent`    | Preferencia | 1 año    | Recordar consentimiento |

3. **Cookies de terceros** — Vercel Analytics
4. **Control de cookies** — Cómo rechazarlas desde el navegador
5. **Consentimiento** — Banner de cookies implementado
6. **Actualizaciones** — Política puede cambiar, revisar periódicamente

**Banner de cookies:** Implementar componente `CookieBanner.tsx` que aparece en primera visita, guarda preferencia en `localStorage`.

---

## 7.5 — Eliminación de Datos (`/legal/eliminacion-datos`)

**URL canónica:** `https://opssynk.com/legal/eliminacion-datos`
**Requerida por:** Meta/Facebook (campo "Data Deletion Instructions URL"), Google Play

### Secciones

1. **Tu derecho a eliminar tus datos**
2. **Cómo solicitar eliminación** — 3 opciones:
   - Email a privacidad@opssynk.com con asunto "Eliminación de datos"
   - Formulario en esta página (name + email + ID de cuenta)
   - Desde dentro de la app: Configuración → Mi Cuenta → Eliminar cuenta
3. **¿Qué datos se eliminan?** — Lista completa
4. **¿Qué datos se retienen?** — Por obligación legal (facturas, nómina histórica: 5 años)
5. **Plazo de respuesta** — 30 días hábiles
6. **Confirmación** — Recibirás email de confirmación cuando se complete

**Formulario en la página:**

```
Nombre completo *
Email registrado *
ID de cuenta (si lo conoces)
Razón (opcional)
[Enviar solicitud de eliminación]
```

API Route: `POST /api/data-deletion` → email a privacidad@opssynk.com

---

## 7.6 — Política de Soporte (`/legal/soporte`)

**URL canónica:** `https://opssynk.com/legal/soporte`
**Requerida por:** Apple App Store (campo "Support URL")

### Secciones

1. **Canales de soporte**
   - 💬 Chat en la app (plan Pro y Enterprise)
   - 📧 soporte@opssynk.com (todos los planes)
   - 📞 +57 310 000 0000 (Enterprise)
   - 📚 Centro de ayuda en docs.opssynk.com

2. **Horarios de atención** — L-V 8am-6pm COT

3. **Tiempos de respuesta por plan**

| Plan       | Tiempo respuesta | SLA uptime |
| ---------- | ---------------- | ---------- |
| Starter    | 48 horas hábiles | 99.5%      |
| Pro        | 24 horas hábiles | 99.7%      |
| Enterprise | 4 horas hábiles  | 99.9%      |

4. **Cómo reportar un bug** — Pasos para reproducir, screenshots
5. **Actualizaciones del sistema** — Mantenimientos programados: domingos 2-4am COT
6. **Estado del sistema** — Link a status.opssynk.com

---

## 7.7 — Política de Reembolsos (`/legal/reembolsos`)

**URL canónica:** `https://opssynk.com/legal/reembolsos`
**Requerida por:** Apple App Store (en descripción de in-app purchases si aplica), Google Play

### Secciones

1. **Modelo de suscripción** — Pago mensual/anual anticipado, no por uso
2. **Política de reembolso**
   - Primeros 14 días: reembolso completo sin preguntas ("satisfaction guarantee")
   - Después de 14 días: sin reembolso por período ya iniciado
   - Plan anual cancelado: reembolso proporcional de meses no usados
3. **Cómo solicitar reembolso** — Email a facturacion@opssynk.com
4. **Plazo de proceso** — 5-10 días hábiles a la tarjeta original
5. **Casos especiales** — Falla mayor del servicio (SLA breach) → crédito proporcional
6. **Impuestos** — Reembolso del valor neto (sin IVA si ya fue declarado)

---

## Implementación técnica

### Componente LegalPageLayout

```tsx
export function LegalPageLayout({ title, lastUpdated, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-neutral-50 border-b border-neutral-200 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <Breadcrumb items={['Inicio', 'Legal', title]} />
          <h1 className="text-3xl font-bold text-neutral-900 mt-4">{title}</h1>
          <p className="text-neutral-500 mt-2">Última actualización: {lastUpdated}</p>
        </div>
      </div>
      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <article className="prose prose-neutral max-w-none">{children}</article>
      </div>
    </div>
  );
}
```

---

## Criterios de aceptación

- [ ] 7 páginas legales creadas y accesibles sin login
- [ ] URLs permanentes y en español
- [ ] Formulario de eliminación de datos funcional (API route)
- [ ] Cada página tiene metadata correcta (noindex NO — estas páginas deben indexar)
- [ ] Tabla de contenidos en desktop (sticky)
- [ ] "Última actualización" con fecha actual
- [ ] Banner de cookies implementado en layout raíz
- [ ] Todas las URLs verificadas antes de submit a App Stores:
  - [ ] `opssynk.com/legal/privacidad` → Privacy Policy URL
  - [ ] `opssynk.com/legal/eula` → License Agreement URL
  - [ ] `opssynk.com/legal/soporte` → Support URL
  - [ ] `opssynk.com/legal/reembolsos` → Cancellation/Refund Policy
  - [ ] `opssynk.com/legal/eliminacion-datos` → Data Deletion Instructions
