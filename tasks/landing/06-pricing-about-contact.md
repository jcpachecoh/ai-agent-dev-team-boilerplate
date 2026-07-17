# TASK 06 — Precios, Nosotros y Contacto

**Estado:** [ ] Pendiente
**Depende de:** 02, 03

---

## 6.1 — Precios (`/precios`)

### Layout

- Hero corto con título y subtítulo
- Toggle mensual/anual (descuento 20% anual)
- 3 planes en cards comparativas
- Tabla de comparación detallada
- FAQ de precios
- CTA final

### Planes

```
STARTER                    PRO                       ENTERPRISE
$299.000 COP/mes           $599.000 COP/mes          Precio personalizado
(1 sede, hasta 5 usuarios) (hasta 3 sedes, 20 users) (ilimitado)

Incluye:                   Todo Starter +            Todo Pro +
- POS básico               - POS avanzado + KDS      - SLA 99.9%
- Inventarios              - Producción (MES)         - Onboarding dedicado
- Reportes básicos         - Multi-sede               - Integración a medida
- Soporte chat             - Contabilidad             - Manager de cuenta
                           - Nómina                   - Auditorías periódicas
                           - Soporte prioritario

[Solicitar Demo]           [Solicitar Demo]           [Hablar con ventas]
```

### Toggle anual/mensual

`use client` con estado React. Precio anual = precio mensual × 10 (2 meses gratis).

### Tabla comparativa

Feature matrix con checkmarks (✓/✗) para todos los módulos vs. cada plan.

### FAQ de precios

- ¿Hay contrato de permanencia? No, mensual sin permanencia
- ¿El precio incluye IVA? No, precios + IVA
- ¿Puedo cambiar de plan? Sí, en cualquier momento
- ¿Qué pasa si supero usuarios? Cobro proporcional extra
- ¿Tienen descuento para cadenas? Sí, desde 5 sedes

---

## 6.2 — Nosotros (`/nosotros`)

### Secciones

1. **Hero** — "Construimos el ERP que los restaurantes merecen"
2. **Historia** — Fundada en 2023 en Bogotá. Timeline visual animado
3. **Misión / Visión** — 2 cards en grid
4. **Equipo** — Grid de fotos + nombre + cargo (3-6 personas)
5. **Valores** — 4 valores con ícono y descripción
6. **Hitos** — Stats: `50+ restaurantes`, `3 países`, `99.8% uptime`, `+2M transacciones`
7. **CTA** — Únete al equipo (link a vacantes) + Solicitar Demo

### Valores

- Obsesión por el cliente
- Datos sobre opiniones
- Simplicidad radical
- Impacto real en LATAM

---

## 6.3 — Contacto / Demo (`/contacto`)

### Layout — 2 columnas

**Columna izquierda:** información

```
"Agenda tu demo gratuita"
Subtítulo: 30 minutos con nuestro equipo para ver la plataforma en acción

[Card] ✉ hola@opssynk.com
[Card] 📞 +57 310 000 0000
[Card] 📍 Bogotá, Colombia

Horarios de atención:
Lunes a Viernes: 8am - 6pm COT
```

**Columna derecha:** formulario

```
Nombre completo *
Email corporativo *
Teléfono (WhatsApp)
Nombre del restaurante *
Número de sedes
Módulos de interés (multiselect)
Mensaje (opcional)

[Enviar solicitud →]
```

### Validación

- `react-hook-form` + `zod`
- Campo email: dominio corporativo preferido (warning si es gmail/hotmail)
- Teléfono: formato colombiano (+57)

### Envío

- API Route `POST /api/contact`
- Envía email via Resend a `contacto@opssynk.com`
- Confirmación al usuario
- Loading state en botón con spinner

### Estados del formulario

- `idle` → `submitting` → `success` | `error`
- Success: mensaje de confirmación + "Te contactaremos en menos de 24 horas"

---

## 6.4 — Blog (`/blog`)

**Stub para SEO.** Layout de grid de artículos. Por ahora: 3-4 artículos placeholder con:

- Imagen de cover
- Categoría (badge)
- Título
- Extracto 2 líneas
- Fecha + tiempo de lectura
- Link "Leer más →"

Artículos iniciales:

1. "Cómo reducir el desperdicio en tu cocina con tecnología"
2. "¿Por qué tu restaurante necesita un ERP y no solo un POS?"
3. "PILA electrónica 2025: guía para restaurantes en Colombia"
4. "Multi-sede: el error más costoso al escalar tu restaurante"

---

## Criterios de aceptación

- [ ] Toggle anual/mensual funciona y actualiza precios
- [ ] Formulario de contacto valida y envía (sin API key real en dev: log en consola)
- [ ] Estados loading/success/error funcionan
- [ ] Página nosotros con timeline animado
- [ ] Blog renderiza 4 artículos placeholder
- [ ] Todas las páginas con metadata correcta
