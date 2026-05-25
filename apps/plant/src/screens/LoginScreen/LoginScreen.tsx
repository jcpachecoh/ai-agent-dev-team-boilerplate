import { Button, FieldAlertBanner, Input, PinKeypad } from '@restopsiq/ui';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  authenticateOperatorPin,
  getDemoPinHint,
  OperatorAuthError,
  shouldShowDemoPinHint,
} from '@/services/auth.service';
import {
  isValidStationId,
  normalizeStationId,
  setStationId as persistStationId,
} from '@/services/station.service';
import { useSessionStore } from '@/stores/session.store';
import styles from './LoginScreen.module.scss';

const PIN_LENGTH = 4;
const CEDULA_MIN_LENGTH = 6;
const CEDULA_MAX_LENGTH = 12;
const SUCCESS_DISPLAY_MS = 1800;

type LoginStep = 'cedula' | 'pin';

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

  const [step, setStep] = useState<LoginStep>('cedula');
  const [cedula, setCedula] = useState('');
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
        if (step === 'cedula') {
          setCedula((c) => c.slice(0, -1));
        } else {
          setPin((p) => p.slice(0, -1));
        }
        return;
      }

      if (key === 'confirm') {
        return;
      }

      if (step === 'cedula') {
        setCedula((c) => (c.length < CEDULA_MAX_LENGTH ? c + key : c));
      } else {
        setPin((p) => (p.length < PIN_LENGTH ? p + key : p));
      }
    },
    [step, successName, isSubmitting],
  );

  const submitCedula = useCallback(() => {
    if (cedula.length < CEDULA_MIN_LENGTH) {
      setError('Ingrese un número de cédula válido (mín. 6 dígitos)');
      vibratePinError();
      setShakeKeypad(true);
      return;
    }
    setError(null);
    setStep('pin');
  }, [cedula]);

  const backToCedula = useCallback(() => {
    setStep('cedula');
    setPin('');
    setError(null);
  }, []);

  const submitPin = useCallback(async () => {
    if (pin.length !== PIN_LENGTH || !stationId || isSubmitting || successName) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await authenticateOperatorPin(stationId, cedula, pin);
      login({ operatorId: result.operatorId, operatorName: result.operatorName });
      setSuccessName(result.operatorName);
      setPin('');
    } catch (err) {
      if (err instanceof OperatorAuthError) {
        setError('Cédula o PIN incorrecto');
        setPin('');
        vibratePinError();
        setShakeKeypad(true);
      } else {
        setError('Cédula o PIN incorrecto');
        vibratePinError();
        setShakeKeypad(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [pin, cedula, stationId, isSubmitting, successName, login]);

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

  // ── Station ID setup form ──────────────────────────────────────────────────
  const setStationIdStore = useSessionStore((s) => s.setStationId);
  const [stationInput, setStationInput] = useState('');
  const [stationError, setStationError] = useState<string | null>(null);
  const [stationSaving, setStationSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!stationId) inputRef.current?.focus();
  }, [stationId]);

  const handleStationSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const value = stationInput.trim();
      if (!isValidStationId(value)) {
        setStationError('ID inválido. Usa letras, números, guiones (ej. EST-01).');
        return;
      }
      setStationError(null);
      setStationSaving(true);
      try {
        await persistStationId(value);
        setStationIdStore(normalizeStationId(value));
      } catch {
        setStationError('No se pudo guardar el ID de estación.');
      } finally {
        setStationSaving(false);
      }
    },
    [stationInput, setStationIdStore],
  );

  if (!stationId) {
    return (
      <div className={`screen-operator ${styles.screen}`}>
        <div className={styles.setupCard}>
          <p className={styles.setupTitle}>Configurar estación</p>
          <p className={styles.setupMessage}>Ingresa el ID de esta estación para comenzar.</p>
          <form onSubmit={handleStationSubmit} className={styles.setupForm} noValidate>
            <Input
              ref={inputRef}
              theme="dark"
              size="md"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              placeholder="Ej. EST-01"
              value={stationInput}
              onChange={(e) => {
                setStationInput(e.target.value.toUpperCase());
                setStationError(null);
              }}
              aria-label="ID de estación"
              aria-describedby={stationError ? 'station-error' : undefined}
            />
            {stationError && (
              <p id="station-error" className={styles.setupError} role="alert">
                {stationError}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              size="medium"
              loading={stationSaving}
              disabled={stationSaving || stationInput.trim() === ''}
              className={styles.setupButton}
            >
              Confirmar
            </Button>
          </form>
        </div>
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

        {step === 'cedula' ? (
          <>
            <p className={styles.instruction}>Ingrese su número de cédula</p>

            <div
              className={styles.cedulaDisplay}
              role="group"
              aria-label="Número de cédula ingresado"
            >
              {cedula ? (
                <span className={styles.cedulaText}>{cedula}</span>
              ) : (
                <span className={styles.cedulaPlaceholder}>_ _ _ _ _ _</span>
              )}
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
                onConfirm={submitCedula}
              />
            </div>
          </>
        ) : (
          <>
            <p className={styles.instruction}>Ingrese su PIN de operador</p>
            <p className={styles.cedulaLabel}>
              Cédula: <span className={styles.cedulaLabelValue}>{cedula}</span>
            </p>

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

            <button type="button" className={styles.backLink} onClick={backToCedula}>
              Cambiar cédula
            </button>
          </>
        )}

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
