import { Bluetooth, Radio, X } from 'lucide-react';
import type { JSX } from 'react';

import { PlantDashboardModalPortal } from '../shared/PlantDashboardModalPortal';
import type {
  PlantBleDeviceSummary,
  PlantDashboardThemeProps,
} from '../shared/plant-workstation-types';
import styles from './PlantBluetoothDiagnosticModal.module.scss';

export interface PlantBluetoothDiagnosticModalProps extends PlantDashboardThemeProps {
  open: boolean;
  onClose: () => void;
  status: string;
  isNativeAvailable: boolean;
  devices: PlantBleDeviceSummary[];
  scanning?: boolean;
  connectedDeviceId?: string | null;
  error?: string | null;
  onStartScan?: () => void;
  onStopScan?: () => void;
  onConnect?: (deviceId: string) => void;
}

function formatRssi(rssi: number): string {
  return `${rssi} dBm`;
}

export function PlantBluetoothDiagnosticModal({
  open,
  onClose,
  status,
  isNativeAvailable,
  devices,
  scanning = false,
  connectedDeviceId = null,
  error = null,
  onStartScan,
  onStopScan,
  onConnect,
  theme = 'dark',
  size = 'md',
  className,
}: PlantBluetoothDiagnosticModalProps): JSX.Element | null {
  if (!open) return null;

  return (
    <PlantDashboardModalPortal open={open}>
      <div
        className={[styles.overlay, styles[`theme--${theme}`], styles[`size--${size}`], className]
          .filter(Boolean)
          .join(' ')}
        role="presentation"
        onClick={onClose}
        data-testid="plant-bluetooth-diagnostic-modal"
      >
        <div
          className={styles.dialog}
          role="dialog"
          aria-modal="true"
          aria-labelledby="plant-ble-diagnostic-title"
          onClick={(event) => event.stopPropagation()}
        >
          <header className={styles.header}>
            <div>
              <p className={styles.eyebrow}>
                <Bluetooth size={12} aria-hidden className={styles.eyebrowIcon} />
                Diagnóstico periféricos
              </p>
              <h2 id="plant-ble-diagnostic-title" className={styles.title}>
                Bluetooth BLE
              </h2>
              <p className={styles.subtitle}>
                {isNativeAvailable ? status : 'Disponible solo en app nativa'}
              </p>
            </div>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
              <X size={16} aria-hidden />
            </button>
          </header>

          <div className={styles.body}>
            {!isNativeAvailable ? (
              <p className={styles.hint}>
                Abre la app empaquetada con Capacitor en tablet para probar BLE real.
              </p>
            ) : (
              <>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.scanBtn}
                    onClick={onStartScan}
                    disabled={scanning || !onStartScan}
                  >
                    <Radio size={14} aria-hidden className={scanning ? styles.pulse : undefined} />
                    {scanning ? 'Escaneando…' : 'Iniciar scan'}
                  </button>
                  <button
                    type="button"
                    className={styles.ghostBtn}
                    onClick={onStopScan}
                    disabled={!scanning || !onStopScan}
                  >
                    Detener
                  </button>
                </div>

                {devices.length === 0 ? (
                  <p className={styles.hint}>Sin dispositivos detectados aún.</p>
                ) : (
                  <ul className={styles.list}>
                    {devices.map((device) => {
                      const isConnected = connectedDeviceId === device.deviceId;
                      return (
                        <li key={device.deviceId} className={styles.listItem}>
                          <div className={styles.deviceInfo}>
                            <strong>{device.name ?? 'Sin nombre'}</strong>
                            <span className={styles.deviceId}>{device.deviceId}</span>
                            {device.rssi != null ? (
                              <span className={styles.rssi}>{formatRssi(device.rssi)}</span>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            className={isConnected ? styles.connectedBtn : styles.connectBtn}
                            onClick={() => onConnect?.(device.deviceId)}
                            disabled={isConnected || !onConnect}
                          >
                            {isConnected ? 'Conectado' : 'Conectar'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}

            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </PlantDashboardModalPortal>
  );
}

export default PlantBluetoothDiagnosticModal;
