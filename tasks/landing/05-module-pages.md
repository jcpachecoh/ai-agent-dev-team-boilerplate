# TASK 05 — Páginas de Módulos (8 páginas)

**Rutas:** `/modulos/[slug]`
**Estado:** [ ] Pendiente
**Depende de:** 02, 03

---

## Layout compartido (`components/modules/ModulePageLayout.tsx`)

Todas las páginas de módulos comparten esta estructura:

```
[ModuleHero]         ← hero específico del módulo con color del módulo
[FeaturesDetail]     ← lista de features con screenshots/mockups
[HowModuleWorks]     ← flujo de trabajo del módulo
[Integration]        ← con qué otros módulos se integra
[FAQ]                ← 4-5 preguntas frecuentes del módulo
[CtaSection]         ← CTA final
```

### Props del layout

```typescript
interface ModulePageProps {
  module: {
    name: string;
    slug: string;
    tagline: string;
    description: string;
    color: string; // clase Tailwind del color principal
    icon: LucideIcon;
    features: Feature[];
    workflow: WorkflowStep[];
    integrations: string[]; // nombres de otros módulos
    faqs: FAQ[];
  };
}
```

---

## Contenido por módulo

### 5.1 — Punto de Venta (POS) `/modulos/pos`

**Color:** `orange` | **Ícono:** `ShoppingCart`
**Tagline:** "Cobra más rápido, pierde menos."

Features:

1. **Cobro multi-método** — Efectivo, tarjeta, transferencia, QR Nequi/Daviplata
2. **Gestión de mesas** — Plano interactivo, comandas por silla, split de cuenta
3. **Domicilios** — Integración con Rappi, Domicilios.com, pedidos propios
4. **Modificadores** — Adicionales, sin ingredientes, notas de cocina
5. **Turnos de caja** — Apertura, arqueo y cierre con conciliación automática
6. **POS offline** — Opera sin internet, sincroniza al reconectar
7. **Impresión** — Ticket térmico, comandas de cocina por estación, pre-cuenta
8. **Propinas** — Sugeridas en pantalla o manuales

Workflow: `Mesa abierta → Comanda → Modificadores → Envío a cocina → Cobro → Cierre`

Integra con: Inventarios, Contabilidad, Finanzas

FAQs:

- ¿Funciona offline? Sí, modo offline completo, sincroniza automáticamente
- ¿Cuántos dispositivos puedo conectar? Sin límite por sede
- ¿Soporta propinas? Sí, con distribución automática a nómina
- ¿Se integra con Rappi? Sí, órdenes entran directo al sistema

---

### 5.2 — Inventarios `/modulos/inventarios`

**Color:** `emerald` | **Ícono:** `Package`
**Tagline:** "Sabe exactamente qué tienes. Siempre."

Features:

1. **Stock en tiempo real** — Actualización automática por cada venta y producción
2. **Alertas de mínimos** — Notificación push cuando un insumo llega al mínimo
3. **Trazabilidad lotes** — FIFO automático con fechas de vencimiento
4. **Multi-bodega** — Bodegas por sede, transferencias inter-sede
5. **Conteo cíclico** — Inventario físico parcial sin parar operaciones
6. **Mermas y ajustes** — Registro de pérdidas con causas y responsables
7. **Unidades de medida** — Compras en kg, uso en gr; conversión automática
8. **Kardex digital** — Historia completa de movimientos por insumo

Workflow: `Recepción OC → Ingreso a bodega → Despacho a producción/POS → Ajustes`

Integra con: POS, Producción, Proveedores, Contabilidad

---

### 5.3 — Nómina `/modulos/nomina`

**Color:** `violet` | **Ícono:** `Users`
**Tagline:** "Liquidación sin errores. Pago a tiempo."

Features:

1. **Liquidación automática** — Cálculo según legislación colombiana vigente
2. **Turnos y asistencia** — Kiosko táctil con huella o PIN, app móvil
3. **Horas extras** — Detección automática diurnas, nocturnas, festivos
4. **Prestaciones** — CESANTÍAS, intereses, prima, vacaciones calculadas
5. **PILA electrónica** — Generación de archivos para UGPP
6. **Contratos** — Fijo, indefinido, aprendizaje, prestación de servicios
7. **Dotaciones** — Control de entregas por empleado y cargo
8. **Portal empleado** — Desprendibles digitales, certificados laborales

Workflow: `Turno asignado → Asistencia → Novedades → Pre-liquidación → Aprobación → Pago`

Integra con: Finanzas, Contabilidad

---

### 5.4 — Contabilidad `/modulos/contabilidad`

**Color:** `blue` | **Ícono:** `BookOpen`
**Tagline:** "Contabilidad en tiempo real, sin digitación manual."

Features:

1. **PUC colombiano** — Plan Único de Cuentas preconfigurado para restaurantes
2. **Asientos automáticos** — Cada venta, compra o pago genera asiento contable
3. **Conciliación bancaria** — Importa extractos, cruza automáticamente
4. **Libros oficiales** — Mayor, diario, auxiliar listos para auditoría
5. **IVA y retenciones** — Cálculo automático, declaración fácil
6. **Centros de costo** — Por sede, por producto, por área
7. **Multi-moneda** — Operaciones en COP y USD
8. **Exportación DIAN** — Archivos para declaraciones tributarias

Workflow: `Transacción → Asiento automático → Revisión contador → Cierre período → Reportes`

Integra con: POS, Finanzas, Proveedores, Nómina

---

### 5.5 — Finanzas `/modulos/finanzas`

**Color:** `cyan` | **Ícono:** `TrendingUp`
**Tagline:** "Conoce tu flujo de caja antes que el banco."

Features:

1. **Flujo de caja** — Proyección a 30/60/90 días con base en histórico
2. **Presupuestos** — Por sede, por período, con alertas de desviación
3. **Cuentas por cobrar** — Cartera, vencimientos, gestión de cobros
4. **Cuentas por pagar** — Proveedores, vencimientos, programación de pagos
5. **Dashboard financiero** — EBITDA, margen bruto, utilidad neta en tiempo real
6. **Tesorería** — Múltiples cajas y cuentas bancarias unificadas
7. **Indicadores clave** — RevPAR, ticket promedio, costo por plato, rotación
8. **Alertas tempranas** — Notificación si flujo cae bajo umbral definido

Workflow: `Ingresos POS → Gastos proveedores → Nómina → Flujo neto → Proyección`

Integra con: Contabilidad, POS, Proveedores, Nómina

---

### 5.6 — Control de Producción (MES) `/modulos/produccion`

**Color:** `amber` | **Ícono:** `ChefHat`
**Tagline:** "Cocina con datos. Sirve con consistencia."

Features:

1. **Recetario digital** — Fichas técnicas con foto, pasos e ingredientes exactos
2. **Costeo de platos** — Costo por porción actualizado al precio de mercado
3. **Órdenes de producción** — Batch cooking con requerimiento de insumos automático
4. **Control de mermas** — Por etapa: compra, preparación, cocción, servicio
5. **Rendimientos** — Ratio real vs. teórico por receta y cocinero
6. **Escalado de recetas** — Ajuste automático para N porciones
7. **Estaciones de cocina** — Pantalla KDS por estación (fría, caliente, postres)
8. **Trazabilidad de lotes** — De ingrediente a plato servido

Workflow: `Orden → Requerimiento MP → Producción → Control mermas → Despacho → Cierre`

Integra con: Inventarios, POS, Proveedores

---

### 5.7 — Proveedores y Compras `/modulos/proveedores`

**Color:** `rose` | **Ícono:** `Truck`
**Tagline:** "Compra mejor. Paga justo. Evalúa siempre."

Features:

1. **Catálogo de proveedores** — Datos, contactos, productos y condiciones
2. **Órdenes de compra** — Generadas automáticamente por alertas de stock
3. **Recepción digital** — Comparación OC vs. factura en recibo
4. **Evaluación proveedores** — Cumplimiento, calidad y precio historizado
5. **Negociación de precios** — Historial de precios para negociar mejor
6. **Aprobaciones** — Flujo de aprobación por monto con roles
7. **Integración e-factura** — Facturas electrónicas DIAN automáticamente
8. **Multi-proveedor por ítem** — Compra al más barato automáticamente

Workflow: `Alerta mínimo → OC auto → Aprobación → Envío proveedor → Recepción → Pago`

Integra con: Inventarios, Finanzas, Contabilidad

---

### 5.8 — Multi-sede `/modulos/multi-sede`

**Color:** `indigo` | **Ícono:** `Building2`
**Tagline:** "Una empresa, muchas sedes. Un solo control."

Features:

1. **Dashboard consolidado** — Ventas, stock e indicadores de todas las sedes juntos
2. **Comparativa de sedes** — Rendimiento sede vs. sede con benchmarks
3. **Transferencias** — Inventario entre sedes con trazabilidad
4. **Roles por sede** — Un usuario puede tener roles distintos en cada sede
5. **Recetas compartidas** — Estandariza menús entre sedes con variaciones locales
6. **Precios diferenciados** — Menús y precios distintos por sede o región
7. **Consolidación contable** — Estados financieros por sede y consolidado
8. **Franquicias** — Modo franquiciador/franquiciado con accesos controlados

Workflow: `Empresa central → Sedes → Usuarios → Reportes por sede → Consolidado`

Integra con: Todos los módulos

---

## Criterios de aceptación

- [ ] 8 páginas de módulos creadas y funcionando
- [ ] `ModulePageLayout` reutilizado en todas
- [ ] Hero de cada módulo con el color correcto del módulo
- [ ] Sección de integraciones muestra links a otros módulos
- [ ] FAQs con accordion animado (Framer Motion)
- [ ] Metadata única por página (title + description + OG)
- [ ] Breadcrumb: "Inicio > Módulos > [Nombre]"
