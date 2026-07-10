import { RecetaFormButton, StatusBadge, toast } from '@restopsiq/ui';
import { ShieldAlert } from 'lucide-react';

import { useMe } from '@/features/auth/hooks/useMe';
import { getErrorMessage } from '@/lib/graphql-client';

import {
  useEmployeeDataConsents,
  useRevokeDataConsentMutation,
} from '@/features/data-consent/hooks/useDataConsent';
import { CONSENT_TYPE_LABELS, type ConsentType } from '@/features/data-consent/types';
import { PayrollEmployeeProfileTabLoading } from './PayrollEmployeeProfileTabLoading';
import styles from './PayrollEmployeeDataConsentTab.module.scss';

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return value.replace('T', ' ').slice(0, 16);
}

interface PayrollEmployeeDataConsentTabProps {
  userId: string;
  theme: 'light' | 'dark';
}

export function PayrollEmployeeDataConsentTab({
  userId,
  theme,
}: PayrollEmployeeDataConsentTabProps): React.JSX.Element {
  const { data: me } = useMe();
  const consentQuery = useEmployeeDataConsents(userId);
  const revokeMutation = useRevokeDataConsentMutation(userId);
  const isSelf = me?.id === userId;

  if (consentQuery.isLoading) {
    return <PayrollEmployeeProfileTabLoading />;
  }

  if (consentQuery.isError || !consentQuery.data) {
    return (
      <div className={styles.state}>
        <p>No se pudo cargar el estado de consentimientos.</p>
        <button type="button" onClick={() => void consentQuery.refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  const summary = consentQuery.data;

  const handleRevoke = async (consentType: ConsentType) => {
    const label = CONSENT_TYPE_LABELS[consentType];
    const confirmed = window.confirm(
      `¿Revocar el consentimiento de ${label}? Podrá seguir marcando con PIN si está habilitado.`,
    );
    if (!confirmed) return;

    try {
      await revokeMutation.mutateAsync(consentType);
      toast.success('Consentimiento revocado');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <ShieldAlert size={18} aria-hidden />
        <div>
          <h3>Consentimiento de datos (Ley 1581)</h3>
          <p>
            Política vigente v{summary.activePolicyVersion}. El texto legal completo requiere
            validación jurídica antes de producción.
          </p>
        </div>
      </header>

      <section className={styles.policyBox}>
        <h4>{summary.policy.title}</h4>
        <pre className={styles.policyText}>{summary.policy.content}</pre>
      </section>

      <section className={styles.list}>
        {summary.consents.map((item) => (
          <article key={item.consentType} className={styles.card}>
            <div className={styles.cardHeader}>
              <strong>{CONSENT_TYPE_LABELS[item.consentType]}</strong>
              <StatusBadge
                theme={theme}
                status={item.granted ? 'APPROVED' : 'REJECTED'}
                size="sm"
              />
            </div>
            <dl className={styles.meta}>
              <div>
                <dt>Versión política</dt>
                <dd>{item.policyVersion ?? summary.activePolicyVersion}</dd>
              </div>
              <div>
                <dt>Otorgado</dt>
                <dd>{formatDateTime(item.grantedAt)}</dd>
              </div>
              <div>
                <dt>Revocado</dt>
                <dd>{formatDateTime(item.revokedAt)}</dd>
              </div>
            </dl>
            {isSelf && item.granted ? (
              <RecetaFormButton
                type="button"
                variant="discard"
                theme={theme}
                label="Revocar consentimiento"
                disabled={revokeMutation.isPending}
                onClick={() => void handleRevoke(item.consentType)}
              />
            ) : null}
          </article>
        ))}
      </section>

      {summary.alternateMethodAvailable ? (
        <p className={styles.hint}>
          Método alterno disponible: marcación con PIN/código si revoca el consentimiento
          biométrico.
        </p>
      ) : (
        <p className={styles.hint}>
          Sin PIN configurado: contacte a RRHH para habilitar marcación alterna tras revocar
          biometría.
        </p>
      )}
    </div>
  );
}
