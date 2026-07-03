import {
  Button,
  EmpleadoContractBadge,
  EmptyState,
  Modal,
  RecetaFormButton,
  toast,
} from '@restopsiq/ui';
import { Landmark, SquarePen } from 'lucide-react';
import { useMemo, useState } from 'react';

import { canWriteFinancialProfile } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { getRoleCodeFromToken } from '@/lib/auth-token';
import { getErrorMessage } from '@/lib/graphql-client';

import { PayrollApiError } from '../api/payroll.client';
import { useEmployeeBankAccountMutations } from '../hooks/useEmployeeBankAccountMutations';
import { useEmployeeBankAccountsQuery } from '../hooks/useEmployeeBankAccountsQuery';
import { usePayrollEmployeeQuery } from '../hooks/usePayrollEmployeeQuery';
import type { BankAccountFormValues, EmployeeBankAccount } from '../types/bank-account.types';
import {
  accountTypeLabel,
  formatMaskedAccountNumber,
  resolveBankName,
} from '../utils/bank-account-validation';
import { PayrollBankAccountFormModal } from './PayrollBankAccountFormModal';
import { PayrollEmployeeProfileTabLoading } from './PayrollEmployeeProfileTabLoading';
import styles from './PayrollEmployeeBankAccountsTab.module.scss';

type ConfirmKind = 'create' | 'replace-number' | 'delete';

interface PendingAction {
  kind: ConfirmKind;
  values?: BankAccountFormValues;
  account?: EmployeeBankAccount;
}

interface PayrollEmployeeBankAccountsTabProps {
  userId: string;
  theme: 'light' | 'dark';
}

export function PayrollEmployeeBankAccountsTab({
  userId,
  theme,
}: PayrollEmployeeBankAccountsTabProps): React.JSX.Element {
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();
  const canWrite = canWriteFinancialProfile(roleCode);
  const canDelete = canWrite;

  const employeeQuery = usePayrollEmployeeQuery(userId);
  const employeeId = employeeQuery.data?.id;
  const accountsQuery = useEmployeeBankAccountsQuery(employeeId);
  const mutations = useEmployeeBankAccountMutations(employeeId ?? '');

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingAccount, setEditingAccount] = useState<EmployeeBankAccount | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeAccounts = useMemo(
    () => (accountsQuery.data ?? []).filter((account) => account.isActive),
    [accountsQuery.data],
  );

  const openCreate = () => {
    setFormMode('create');
    setEditingAccount(undefined);
    setFormOpen(true);
  };

  const openEdit = (account: EmployeeBankAccount) => {
    setFormMode('edit');
    setEditingAccount(account);
    setFormOpen(true);
  };

  const handleFormSubmit = (values: BankAccountFormValues) => {
    if (formMode === 'create') {
      setPendingAction({ kind: 'create', values });
      setFormOpen(false);
      setConfirmOpen(true);
      return;
    }

    if (!editingAccount) return;

    const numberChanged = Boolean(values.accountNumber.trim());
    if (numberChanged) {
      setPendingAction({ kind: 'replace-number', values, account: editingAccount });
      setFormOpen(false);
      setConfirmOpen(true);
      return;
    }

    void saveMetadataUpdate(editingAccount, values);
  };

  const saveMetadataUpdate = async (
    account: EmployeeBankAccount,
    values: BankAccountFormValues,
  ) => {
    if (!employeeId) return;
    setSubmitting(true);
    try {
      await mutations.updateMutation.mutateAsync({
        accountId: account.id,
        input: {
          bankName: resolveBankName(values.bankCode),
          bankCode: values.bankCode,
          accountType: values.accountType,
        },
      });
      toast.success('Cuenta actualizada');
      setFormOpen(false);
    } catch (error) {
      toast.error(getMutationError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const executePendingAction = async () => {
    if (!pendingAction || !employeeId) return;

    setSubmitting(true);
    try {
      if (pendingAction.kind === 'create' && pendingAction.values) {
        const values = pendingAction.values;
        await mutations.createMutation.mutateAsync({
          bankName: resolveBankName(values.bankCode),
          bankCode: values.bankCode,
          accountType: values.accountType,
          accountNumber: values.accountNumber,
          isPrimary: values.isPrimary || activeAccounts.length === 0,
        });
        toast.success('Cuenta bancaria registrada');
      }

      if (
        pendingAction.kind === 'replace-number' &&
        pendingAction.values &&
        pendingAction.account
      ) {
        const values = pendingAction.values;
        const oldAccount = pendingAction.account;
        await mutations.createMutation.mutateAsync({
          bankName: resolveBankName(values.bankCode),
          bankCode: values.bankCode,
          accountType: values.accountType,
          accountNumber: values.accountNumber,
          isPrimary: oldAccount.isPrimary,
        });
        await mutations.deleteMutation.mutateAsync(oldAccount.id);
        toast.success('Cuenta actualizada. La anterior quedó inactiva.');
      }

      if (pendingAction.kind === 'delete' && pendingAction.account) {
        await mutations.deleteMutation.mutateAsync(pendingAction.account.id);
        toast.success('Cuenta desactivada');
      }

      setConfirmOpen(false);
      setPendingAction(null);
      setFormOpen(false);
    } catch (error) {
      toast.error(getMutationError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPrimary = async (account: EmployeeBankAccount) => {
    if (!employeeId || account.isPrimary) return;
    setSubmitting(true);
    try {
      await mutations.setPrimaryMutation.mutateAsync(account.id);
      toast.success('Cuenta principal actualizada');
    } catch (error) {
      toast.error(getMutationError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const requestDelete = (account: EmployeeBankAccount) => {
    if (account.isPrimary) {
      toast.error('No puedes eliminar la cuenta principal. Marca otra como principal primero.');
      return;
    }
    if (activeAccounts.length <= 1) {
      toast.error('No puedes eliminar la única cuenta registrada del empleado.');
      return;
    }
    setPendingAction({ kind: 'delete', account });
    setConfirmOpen(true);
  };

  if (employeeQuery.isLoading) {
    return <PayrollEmployeeProfileTabLoading />;
  }

  if (employeeQuery.isError || !employeeQuery.data || !employeeId) {
    return (
      <div className={styles.state}>
        <p>No se pudo cargar el colaborador.</p>
        <Button variant="secondary" size="small" onClick={() => void employeeQuery.refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (accountsQuery.isLoading) {
    return <PayrollEmployeeProfileTabLoading />;
  }

  if (accountsQuery.isError) {
    return (
      <div className={styles.state}>
        <p>{getErrorMessage(accountsQuery.error)}</p>
        <p className={styles.hint}>Requiere permiso nomina.financial.read.</p>
        <Button variant="secondary" size="small" onClick={() => void accountsQuery.refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Cuentas bancarias</h2>
          <p className={styles.subtitle}>
            Cuentas registradas para la dispersión de pago. El número siempre se muestra
            enmascarado.
          </p>
        </div>
        {canWrite ? (
          <RecetaFormButton
            type="button"
            theme={theme}
            variant="add"
            label="Agregar cuenta"
            onClick={openCreate}
          />
        ) : null}
      </div>

      {activeAccounts.length === 0 ? (
        <EmptyState
          theme={theme}
          variant="create"
          icon={<Landmark size={44} strokeWidth={1.5} />}
          title="No hay cuentas bancarias registradas"
          description="Agrega una cuenta para la dispersión de nómina del colaborador."
          action={
            canWrite ? (
              <RecetaFormButton
                type="button"
                theme={theme}
                variant="add"
                label="Agregar cuenta"
                onClick={openCreate}
              />
            ) : undefined
          }
          className={styles.emptyState}
        />
      ) : (
        <div className={styles.grid}>
          {activeAccounts.map((account) => (
            <BankAccountCard
              key={account.id}
              account={account}
              theme={theme}
              canWrite={canWrite}
              canDelete={canDelete}
              submitting={submitting}
              onSetPrimary={handleSetPrimary}
              onEdit={openEdit}
              onDelete={requestDelete}
            />
          ))}
        </div>
      )}

      <PayrollBankAccountFormModal
        open={formOpen}
        mode={formMode}
        theme={theme}
        account={editingAccount}
        isFirstAccount={activeAccounts.length === 0}
        submitting={submitting}
        onClose={() => {
          if (!submitting) setFormOpen(false);
        }}
        onSubmit={handleFormSubmit}
      />

      <Modal
        open={confirmOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !submitting) {
            setConfirmOpen(false);
            setPendingAction(null);
          }
        }}
        size="md"
        theme={theme}
        title={confirmTitle(pendingAction)}
        description={confirmDescription(pendingAction)}
        onInteractOutside={(event) => {
          if (submitting) event.preventDefault();
        }}
        footer={
          <>
            <Button
              variant="secondary"
              size="medium"
              onClick={() => {
                setConfirmOpen(false);
                setPendingAction(null);
              }}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="medium"
              onClick={() => void executePendingAction()}
              disabled={submitting}
            >
              {submitting ? 'Guardando…' : 'Confirmar'}
            </Button>
          </>
        }
      />
    </div>
  );
}

function BankAccountCard({
  account,
  theme,
  canWrite,
  canDelete,
  submitting,
  onSetPrimary,
  onEdit,
  onDelete,
}: {
  account: EmployeeBankAccount;
  theme: 'light' | 'dark';
  canWrite: boolean;
  canDelete: boolean;
  submitting: boolean;
  onSetPrimary: (account: EmployeeBankAccount) => Promise<void>;
  onEdit: (account: EmployeeBankAccount) => void;
  onDelete: (account: EmployeeBankAccount) => void;
}): React.JSX.Element {
  return (
    <article className={`${styles.card} ${account.isPrimary ? styles.cardPrimary : ''}`}>
      <div className={styles.cardTop}>
        <div className={styles.bankIconWrap} aria-hidden>
          <Landmark size={18} strokeWidth={1.75} />
        </div>
        <div className={styles.cardHeading}>
          <h3 className={styles.bankName}>{account.bankName}</h3>
          {account.isPrimary ? (
            <EmpleadoContractBadge label="Principal" variant="indefinido" theme={theme} size="sm" />
          ) : null}
        </div>
      </div>

      <dl className={styles.details}>
        <div className={styles.detailRow}>
          <dt>Tipo de cuenta</dt>
          <dd>{accountTypeLabel(account.accountType)}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Número de cuenta</dt>
          <dd className={styles.masked}>
            {formatMaskedAccountNumber(account.maskedAccountNumber, account.accountLast4)}
          </dd>
        </div>
      </dl>

      {canWrite ? (
        <div className={styles.cardActions}>
          {!account.isPrimary ? (
            <Button
              variant="primary"
              size="small"
              className={styles.actionButton}
              disabled={submitting}
              onClick={() => void onSetPrimary(account)}
            >
              Marcar principal
            </Button>
          ) : null}
          <Button
            variant="secondary"
            size="small"
            className={styles.actionButton}
            disabled={submitting}
            onClick={() => onEdit(account)}
          >
            <SquarePen size={14} aria-hidden />
            Editar
          </Button>
          {canDelete ? (
            <Button
              variant="danger"
              size="small"
              className={styles.actionButton}
              disabled={submitting}
              onClick={() => onDelete(account)}
            >
              Desactivar
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function confirmTitle(action: PendingAction | null): string {
  if (action?.kind === 'delete') return 'Desactivar cuenta bancaria';
  if (action?.kind === 'replace-number') return 'Cambiar número de cuenta';
  return 'Registrar cuenta bancaria';
}

function confirmDescription(action: PendingAction | null): React.ReactNode {
  if (action?.kind === 'delete') {
    return 'La cuenta quedará inactiva y dejará de usarse para dispersión. Esta acción no borra el historial en base de datos.';
  }
  if (action?.kind === 'replace-number') {
    return 'Cambiar el número de cuenta afectará la dispersión del próximo pago. La cuenta anterior quedará inactiva. ¿Deseas continuar?';
  }
  return 'Confirma que deseas registrar esta cuenta bancaria para la dispersión de pago del colaborador.';
}

function getMutationError(error: unknown): string {
  if (error instanceof PayrollApiError) {
    if (error.status === 403) {
      return 'No tienes permisos para gestionar cuentas de este empleado.';
    }
    return error.message;
  }
  return getErrorMessage(error);
}
