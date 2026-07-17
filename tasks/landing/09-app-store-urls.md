# TASK 09 — URLs para App Store Connect y Google Play Console

**Estado:** [ ] Pendiente (completar con URLs reales después de deploy)

---

## Google Play Console

En la ficha de la app, sección "Política de privacidad", ingresar:

| Campo                                    | URL                                           |
| ---------------------------------------- | --------------------------------------------- |
| Privacy Policy                           | `https://opssynk.com/legal/privacidad`        |
| Data Safety > Data deletion instructions | `https://opssynk.com/legal/eliminacion-datos` |

En "Store listing":
| Campo | URL |
|-------|-----|
| Website | `https://opssynk.com` |
| Email | `soporte@opssynk.com` |
| Phone | `+573100000000` |

---

## Apple App Store Connect

En "App Information":

| Campo                        | URL                                    |
| ---------------------------- | -------------------------------------- |
| Privacy Policy URL           | `https://opssynk.com/legal/privacidad` |
| License Agreement URL (EULA) | `https://opssynk.com/legal/eula`       |
| Support URL                  | `https://opssynk.com/legal/soporte`    |
| Marketing URL                | `https://opssynk.com`                  |

En "Pricing and Availability" → "Cancellation and Refund Policy":
| Campo | URL |
|-------|-----|
| Cancellation Policy | `https://opssynk.com/legal/reembolsos` |

---

## Checklist antes de submission

### Google Play

- [ ] Privacy Policy URL responde 200 (no 404)
- [ ] Data Deletion URL tiene formulario funcional
- [ ] Clasificación de contenido completa
- [ ] Sección "Data Safety" completada (qué datos recopila, si se comparten)

### Apple App Store

- [ ] Privacy Policy URL responde 200
- [ ] EULA URL responde 200
- [ ] Support URL responde 200
- [ ] Age Rating completado
- [ ] Privacy Nutrition Labels completados en App Store Connect

---

## Notas importantes

- Las URLs deben estar **en producción** (no staging) antes de submission
- Las páginas deben cargarse sin JavaScript deshabilitado (SSG/SSR, no CSR puro)
- El contenido debe estar en **español** (idioma principal de la app) — optionalmente inglés también
- Los formularios de eliminación de datos deben procesar solicitudes aunque el usuario no recuerde su contraseña
