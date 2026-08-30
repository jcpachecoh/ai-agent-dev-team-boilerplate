import {
  ProveedorDocumentationTable,
  LoadingState,
  type ProveedorDocumentationTableRowProps,
} from '@restopsiq/ui';
import { useRef, useState } from 'react';

import { canWriteSupplierDocuments } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { useUiTheme } from '@/hooks/useUiTheme';
import { getRoleCodeFromToken } from '@/lib/auth-token';

import {
  fetchSupplierDocumentDownloadUrl,
  validateSupplierDocumentFile,
  type SupplierDocumentType,
} from '../../api/supplier-documents.api';
import { PROVEEDOR_TABLE_SIZE } from '../../constants';
import {
  useDeleteSupplierDocument,
  useSupplierDocuments,
  useUploadSupplierDocument,
} from '../../hooks/useSupplierDocuments';
import styles from '../../proveedores.module.scss';

interface ProveedorDocumentationTabProps {
  supplierId: string;
}

function mapStatus(
  status: 'PENDING' | 'UPLOADED' | 'EXPIRING' | 'EXPIRED',
): ProveedorDocumentationTableRowProps['status'] {
  switch (status) {
    case 'UPLOADED':
      return 'uploaded';
    case 'EXPIRING':
      return 'expiring';
    case 'EXPIRED':
      return 'expired';
    default:
      return 'pending';
  }
}

function mapRequirement(
  requirement: 'REQUIRED' | 'CONDITIONAL' | 'RECOMMENDED',
): ProveedorDocumentationTableRowProps['requirement'] {
  switch (requirement) {
    case 'REQUIRED':
      return 'required';
    case 'RECOMMENDED':
      return 'recommended';
    default:
      return 'conditional';
  }
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-CO');
}

export default function ProveedorDocumentationTab({
  supplierId,
}: ProveedorDocumentationTabProps): React.JSX.Element {
  const theme = useUiTheme();
  const { data: me } = useMe();
  const roleCode = getRoleCodeFromToken() ?? me?.roleCode ?? null;
  const canWrite = canWriteSupplierDocuments(roleCode);

  const { data, isPending, isError, refetch } = useSupplierDocuments(supplierId);
  const uploadMutation = useUploadSupplierDocument(supplierId);
  const deleteMutation = useDeleteSupplierDocument(supplierId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingType, setPendingType] = useState<SupplierDocumentType | null>(null);
  const [issuedAt, setIssuedAt] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const openFilePicker = (documentType: SupplierDocumentType): void => {
    setActionError(null);
    setPendingType(documentType);
    if (documentType === 'CAMARA_COMERCIO') {
      return;
    }
    fileInputRef.current?.click();
  };

  const confirmCamaraUpload = (): void => {
    if (!issuedAt) {
      setActionError('Ingresa la fecha de expedición de Cámara de Comercio.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !pendingType) return;

    const validationError = validateSupplierDocumentFile(file);
    if (validationError) {
      setActionError(validationError);
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        documentType: pendingType,
        file,
        issuedAt: pendingType === 'CAMARA_COMERCIO' ? issuedAt : undefined,
      });
      setPendingType(null);
      setIssuedAt('');
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo cargar el documento.');
    }
  };

  const handleDownload = async (
    documentType: SupplierDocumentType,
    versionId?: string,
  ): Promise<void> => {
    try {
      const url = await fetchSupplierDocumentDownloadUrl({ supplierId, documentType, versionId });
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo descargar el documento.');
    }
  };

  const handleDelete = async (documentType: SupplierDocumentType): Promise<void> => {
    try {
      await deleteMutation.mutateAsync(documentType);
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo eliminar el documento.');
    }
  };

  if (isPending) {
    return (
      <LoadingState message="Cargando documentación…" theme={theme === 'dark' ? 'dark' : 'light'} />
    );
  }

  if (isError || !data) {
    return (
      <div>
        <p className={styles.stateMessage}>No se pudo cargar la documentación del proveedor.</p>
        <button type="button" className={styles.linkButton} onClick={() => void refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  const rows: ProveedorDocumentationTableRowProps[] = data.documents.map((doc) => {
    const validity =
      doc.expiresAt != null
        ? `Vence ${formatDate(doc.expiresAt)}`
        : doc.needsReview
          ? 'Requiere actualización'
          : 'Sin vencimiento';

    return {
      documentLabel: doc.label,
      requirement: mapRequirement(doc.requirement),
      validityLabel: validity,
      status: mapStatus(doc.status),
      uploadedAtLabel: formatDate(doc.lastUploadedAt),
      canWrite,
      hasCurrentVersion: Boolean(doc.currentVersion),
      hasPreviousVersion: Boolean(doc.previousVersion),
      onUpload: () => openFilePicker(doc.documentType),
      onReplace: () => openFilePicker(doc.documentType),
      onDelete: () => void handleDelete(doc.documentType),
      onDownload: doc.currentVersion ? () => void handleDownload(doc.documentType) : undefined,
      onDownloadPrevious: doc.previousVersion
        ? () => void handleDownload(doc.documentType, doc.previousVersion?.id)
        : undefined,
    };
  });

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className={styles.hiddenInput}
        onChange={(event) => void handleFileChange(event)}
      />

      {pendingType === 'CAMARA_COMERCIO' ? (
        <div className={styles.documentUploadPanel}>
          <label htmlFor="camara-issued-at">Fecha de expedición (Cámara de Comercio)</label>
          <input
            id="camara-issued-at"
            type="date"
            value={issuedAt}
            onChange={(event) => setIssuedAt(event.target.value)}
            className={styles.documentDateInput}
          />
          <div className={styles.documentUploadActions}>
            <button type="button" className={styles.linkButton} onClick={confirmCamaraUpload}>
              Seleccionar archivo
            </button>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => {
                setPendingType(null);
                setIssuedAt('');
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {actionError ? <p className={styles.formError}>{actionError}</p> : null}

      <ProveedorDocumentationTable
        rows={rows}
        completenessLabel={`${data.completeness.loaded} de ${data.completeness.total} documentos cargados`}
        theme={theme}
        size={PROVEEDOR_TABLE_SIZE}
      />
    </div>
  );
}
