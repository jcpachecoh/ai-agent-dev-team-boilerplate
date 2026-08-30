# NOM-07 — Perfil de Empleado (Nómina)

**Domain:** `[BACKEND]` `[FRONTEND]` `[WEB-APP]` `[PAYROLL]` `[RBAC]`  
**Status:** `in_progress`  
**Created:** 2026-06-30

---

## Objetivo

Crear una pantalla de **Perfil de Empleado** dentro del módulo de Nómina que centralice toda la información relevante del colaborador en un solo lugar, organizada por pestañas.

---

## Alcance funcional

La pantalla debe incluir las siguientes secciones (tabs):

| Tab                      | Contenido                                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Datos personales         | Nombre, documento, fecha de nacimiento, dirección, teléfono, correo, contacto de emergencia, foto               |
| Pagos                    | Historial de liquidaciones, salario base, novedades (bonos, descuentos, horas extra), comprobantes descargables |
| Seguridad social         | Afiliaciones (salud, pensión, ARL, caja), estado, fechas de vinculación                                         |
| Historial de asistencia  | Check-in/out (incl. ZKTeco), ausentismos, tardanzas, vacaciones                                                 |
| Cuentas bancarias        | Banco, tipo, número enmascarado, cuenta de dispersión                                                           |
| Información de impuestos | Retención en la fuente, certificados tributarios                                                                |

---

## Consideraciones técnicas

- **Backend:** NestJS + GraphQL, multi-tenant (`tenantId`).
- **Frontend:** Vite/React, tabs con componentes `@restopsiq/ui` (familia `empleado`).
- **RBAC:** empleado ve perfil propio con campos limitados; RRHH/Admin ve y edita según permisos.
- **Datos sensibles:** documento y cuentas bancarias enmascarados por defecto.

---

## Subtareas

| #   | Archivo                          | Descripción                                |
| --- | -------------------------------- | ------------------------------------------ |
| 01  | `01-profile-shell-and-tabs.md`   | Shell, ruta, tab bar y placeholders vacíos |
| 02  | `02-tab-datos-personales.md`     | Contenido tab Datos personales             |
| 03  | `03-tab-pagos.md`                | Contenido tab Pagos                        |
| 04  | `04-tab-seguridad-social.md`     | Contenido tab Seguridad social             |
| 05  | `05-tab-historial-asistencia.md` | Contenido tab Historial de asistencia      |
| 06  | `06-tab-cuentas-bancarias.md`    | Contenido tab Cuentas bancarias            |
| 07  | `07-tab-impuestos.md`            | Contenido tab Información de impuestos     |
| 08  | `08-rbac-sensitive-data.md`      | RBAC por sección y enmascaramiento         |

---

## Criterios de aceptación (epic)

- [ ] Existe pantalla de Perfil de Empleado accesible desde Nómina (`/payroll/employees/:userId/profile`).
- [ ] Se visualizan las 6 secciones como tabs.
- [ ] Datos sensibles enmascarados según rol (task 08).
- [ ] Asistencia refleja registros del sistema incl. biométrico (task 05).
- [ ] Acceso por sección respeta RBAC (task 08).

---

## Orden de implementación

```
01 → 02 → 03 → 04 → 05 → 06 → 07 → 08
```

La task **01** desbloquea el resto; las tasks 02–07 pueden paralelizarse parcialmente tras 01.
