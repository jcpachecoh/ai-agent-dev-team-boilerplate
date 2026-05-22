import { FieldAlertBanner, PinKeypad } from '@restopsiq/ui';
import { useCallback, useEffect, useState } from 'react';

import {
  authenticateOperatorPin,
  getDemoPinHint,
  OperatorAuthError,
  shouldShowDemoPinHint,
} from '@/services/auth.service';
import { useSessionStore } from '@/stores/session.store';
import styles from './LoginScreen.module.scss';

const PIN_LENGTH = 4;
const SUCCESS_DISPLAY_MS = 1800;

export interface LoginScreenProps {
  /** Work area title, e.g. "Corte y deshuese" */
  areaName?: string;
  brandName?: string;
  plantLabel?: string;
  statusLine?: string;
  onLoginSuccess?: () => void;
}

function vibratePinError(): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate([100, 50, 100]);
  }
}

export function LoginScreen({
  areaName = import.meta.env.VITE_KDS_AREA_NAME ?? 'Corte y deshuese',
  brandName = import.meta.env.VITE_KDS_BRAND_NAME ?? 'Palos de Leña',
  plantLabel = 'RESTOPSIQ PLANT',
  statusLine = 'Sistema operativo · Turno 1 · 06:00-14:00 · Bogotá',
  onLoginSuccess,
}: LoginScreenProps): React.JSX.Element {
  const stationId = useSessionStore((s) => s.stationId);
  const login = useSessionStore((s) => s.login);

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successName, setSuccessName] = useState<string | null>(null);
  const [shakeKeypad, setShakeKeypad] = useState(false);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (successName || isSubmitting) return;

      setError(null);

      if (key === 'backspace') {
        setPin((current) => current.slice(0, -1));
        return;
      }

      if (key === 'confirm') {
        return;
      }

      setPin((current) => (current.length < PIN_LENGTH ? current + key : current));
    },
    [successName, isSubmitting],
  );

  const submitPin = useCallback(async () => {
    if (pin.length !== PIN_LENGTH || !stationId || isSubmitting || successName) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await authenticateOperatorPin(stationId, pin);
      login({ operatorId: result.operatorId, operatorName: result.operatorName });
      setSuccessName(result.operatorName);
      setPin('');
    } catch (err) {
      if (err instanceof OperatorAuthError) {
        setError('PIN incorrecto');
        setPin('');
        vibratePinError();
        setShakeKeypad(true);
      } else {
        setError('PIN incorrecto');
        vibratePinError();
        setShakeKeypad(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [pin, stationId, isSubmitting, successName, login]);

  useEffect(() => {
    if (!shakeKeypad) return;
    const id = window.setTimeout(() => setShakeKeypad(false), 450);
    return () => window.clearTimeout(id);
  }, [shakeKeypad]);

  useEffect(() => {
    if (!successName) return;
    const id = window.setTimeout(() => {
      onLoginSuccess?.();
    }, SUCCESS_DISPLAY_MS);
    return () => window.clearTimeout(id);
  }, [successName, onLoginSuccess]);

  const showDemoHint = shouldShowDemoPinHint();

  if (!stationId) {
    return (
      <div className={`screen-operator ${styles.screen}`}>
        <p className={styles.setupMessage}>Configure el ID de estación para continuar.</p>
      </div>
    );
  }

  return (
    <div className={`screen-operator ${styles.screen}`}>
      <div className={styles.content}>
        <header className={styles.brandHeader}>
          <span className={styles.flameIcon} aria-hidden />
          <p className={styles.brandLine}>
            <span className={styles.brandName}>{brandName}</span>
            <span className={styles.brandDot}>·</span>
            <span className={styles.plantLabel}>{plantLabel}</span>
          </p>
          <span className={styles.stationBadge}>{stationId}</span>
        </header>

        <h1 className={styles.areaTitle}>{areaName}</h1>
        <p className={styles.instruction}>Ingrese su PIN de operador</p>

        <div className={styles.pinDots} role="group" aria-label="Dígitos ingresados">
          {Array.from({ length: PIN_LENGTH }).map((_, index) => (
            <span
              key={index}
              className={[styles.dot, index < pin.length && styles.dotFilled]
                .filter(Boolean)
                .join(' ')}
              aria-hidden
            />
          ))}
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <FieldAlertBanner variant="danger" theme="dark" size="md">
              {error}
            </FieldAlertBanner>
          </div>
        )}

        <div
          className={[styles.keypadWrap, shakeKeypad && styles.keypadShake]
            .filter(Boolean)
            .join(' ')}
        >
          <PinKeypad
            theme="dark"
            size="sm"
            confirmLabel="OK"
            onKeyPress={handleKeyPress}
            onConfirm={() => void submitPin()}
          />
        </div>

        {showDemoHint && <p className={styles.demoHint}>DEMO: PIN correcto = {getDemoPinHint()}</p>}

        <footer className={styles.statusFooter}>
          <span className={styles.statusDot} aria-hidden />
          <span className={styles.statusText}>{statusLine}</span>
        </footer>
      </div>

      {successName && (
        <div className={styles.successOverlay} role="status" aria-live="polite">
          <div className={styles.successCard}>
            <span className={styles.successIcon} aria-hidden />
            <p className={styles.successTitle}>Acceso autorizado</p>
            <p className={styles.successName}>{successName}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginScreen;
