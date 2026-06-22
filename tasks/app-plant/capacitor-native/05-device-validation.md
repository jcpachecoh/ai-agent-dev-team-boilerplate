# Checklist QA — dispositivo físico (Capacitor)

Epic: [`tasks/app-plant/capacitor-native/00-epic-and-decisions.md`](00-epic-and-decisions.md)

**Decisión D1:** BLE genérico (`@capacitor-community/bluetooth-le`).

**Cámara (incidentes):** checklist detallado en [05-camera-device-validation.md](./05-camera-device-validation.md) — regresión web automatizada; manual Android/iOS pendiente en dispositivo.

---

## Prerrequisitos

- [ ] Build web OK: `pnpm turbo build --filter=@restopsiq/plant`
- [ ] Plataformas generadas: `cd apps/plant && npx cap add android` (y `ios` en Mac)
- [ ] `npx cap sync` sin errores
- [ ] Permisos documentados en [`docs/native-permissions.md`](../../apps/plant/docs/native-permissions.md)

---

## Android (tablet operario)

| #   | Caso                          | Esperado                                                                                      |
| --- | ----------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | Instalar y abrir app          | WebView carga dashboard operario                                                              |
| 2   | Asignar orden + ver receta    | Flujo existente sin regresión                                                                 |
| 3   | Reportar novedad → Tomar foto | Cámara nativa o galería; preview en modal — ver [05-camera](./05-camera-device-validation.md) |
| 4   | Enviar incidente online       | POST incidente; celda pasa a estado novedad                                                   |
| 5   | Enviar incidente offline      | Cola offline; mensaje de sync pendiente                                                       |
| 6   | Bluetooth → Iniciar scan      | Lista dispositivos BLE cercanos                                                               |
| 7   | Bluetooth → Conectar          | Estado conectado sin crash                                                                    |
| 8   | Denegar cámara / BT           | Mensaje claro, app estable                                                                    |

---

## iOS / iPad (si aplica)

| #   | Caso                     | Esperado                                                                          |
| --- | ------------------------ | --------------------------------------------------------------------------------- |
| 1   | `npx cap run ios` en Mac | App abre en simulador o iPad                                                      |
| 2   | Cámara en incidente      | Diálogo permiso + captura — ver [05-camera](./05-camera-device-validation.md)     |
| 3   | BLE scan/connect         | Funciona con periférico compatible iOS; si no hay hardware, documentar limitación |
| 4   | Developer Mode (iOS 16+) | Habilitado en iPad para builds de desarrollo                                      |

---

## Web (regresión)

| #   | Caso                    | Esperado                                                                     |
| --- | ----------------------- | ---------------------------------------------------------------------------- |
| 1   | `pnpm dev` en navegador | Sin botón Bluetooth nativo                                                   |
| 2   | Reportar novedad → foto | Fallback `<input type="file">` — cubierto por `IncidentReportModal.test.tsx` |
| 3   | Bluetooth modal         | Mensaje “solo app nativa”                                                    |

---

## Notas

- Subida HTTP de fotos a CDN/API: **fuera de alcance** de este epic; fotos quedan en cola offline (`imageBase64`).
- UUID de servicio BLE opcional: `VITE_BLE_SCAN_SERVICE_UUID` en `.env`.
