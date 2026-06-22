# Permisos nativos — Planta KDS

Los proyectos `android/` e `ios/` se generan localmente con Capacitor y **no se versionan**. Tras `npx cap add android` / `npx cap add ios`, aplicar o verificar estos permisos antes de probar cámara y BLE en dispositivo.

Epic: [`tasks/app-plant/capacitor-native/00-epic-and-decisions.md`](../../tasks/app-plant/capacitor-native/00-epic-and-decisions.md)

---

## Android (`android/app/src/main/AndroidManifest.xml`)

Capacitor y los plugins suelen fusionar permisos automáticamente. Confirmar que existen (o añadir si faltan):

| Permiso                                    | Justificación                                             |
| ------------------------------------------ | --------------------------------------------------------- |
| `android.permission.CAMERA`                | Fotos de incidentes (`@capacitor/camera`)                 |
| `android.permission.READ_MEDIA_IMAGES`     | Galería en Android 13+                                    |
| `android.permission.READ_EXTERNAL_STORAGE` | Galería en API ≤ 32                                       |
| `android.permission.BLUETOOTH_SCAN`        | Escaneo BLE (Android 12+)                                 |
| `android.permission.BLUETOOTH_CONNECT`     | Conexión BLE                                              |
| `android.permission.ACCESS_FINE_LOCATION`  | Requerido por el stack BLE en varias versiones de Android |

`bluetooth.service.ts` inicializa con `androidNeverForLocation: true` cuando el plugin lo permite; en algunos dispositivos Android 12+ aún puede pedirse ubicación para scan.

### Textos sugeridos (strings.xml, opcional)

- Cámara: _RestOpsIQ Planta usa la cámara para adjuntar evidencia fotográfica a reportes de novedad._
- Bluetooth: _RestOpsIQ Planta usa Bluetooth para conectar balanzas y sensores en la línea de producción._

---

## iOS (`ios/App/App/Info.plist`)

Añadir claves con descripciones en **español**:

| Key                                 | Valor sugerido                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| `NSCameraUsageDescription`          | RestOpsIQ Planta necesita la cámara para registrar fotos de novedades en la estación. |
| `NSPhotoLibraryUsageDescription`    | RestOpsIQ Planta puede usar fotos de la galería como evidencia de incidentes.         |
| `NSPhotoLibraryAddUsageDescription` | RestOpsIQ Planta puede guardar fotos capturadas como evidencia.                       |
| `NSBluetoothAlwaysUsageDescription` | RestOpsIQ Planta usa Bluetooth para conectar balanzas y sensores BLE en planta.       |

No habilitar `UIBackgroundModes` con `bluetooth-central` salvo que producto requiera conexión en segundo plano.

---

## Runtime (app)

| Flujo                                | Comportamiento                                                    |
| ------------------------------------ | ----------------------------------------------------------------- |
| Reportar novedad → Tomar foto        | `Camera.requestPermissions()` antes de abrir cámara nativa        |
| Diagnóstico Bluetooth → Iniciar scan | `BleClient.initialize()` + permisos del sistema                   |
| Permiso denegado                     | Mensaje en modal con instrucción de abrir Ajustes del dispositivo |

---

## Validación manual

1. Desinstalar la app del dispositivo (permisos limpios).
2. `pnpm run build:android` o `build:ios` y `npx cap run …`.
3. Abrir **Reportar novedad** → verificar diálogo de cámara.
4. Abrir **Bluetooth** en header nativo → verificar permisos BT (y ubicación en Android si aplica).
5. Revocar permisos en Ajustes → repetir flujos y confirmar mensajes útiles.
