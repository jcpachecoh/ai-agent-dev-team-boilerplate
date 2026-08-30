import { EmptyState, toast } from '@restopsiq/ui';
import { Download, File, FileText, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { canWritePayrollEmployee } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { getErrorMessage } from '@/lib/graphql-client';
import { getRoleCodeFromToken } from '@/lib/auth-token';

import { fetchEmployeeDocumentDownloadUrl } from '../api/employee-documents.api';
import { useEmployeeDocumentsMutations } from '../hooks/useEmployeeDocumentsMutations';
import { useEmployeeDocumentsQuery } from '../hooks/useEmployeeDocumentsQuery';
import { usePayrollEmployeeQuery } from '../hooks/usePayrollEmployeeQuery';
import type { DocumentFileType, EmployeeDocument } from '../types/employee-document.types';
import {
  DOCUMENT_FILE_TYPE_LABELS,
  DOCUMENT_FILE_TYPE_OPTIONS,
} from '../types/employee-document.types';
import { EmployeeDocumentUploadModal } from './EmployeeDocumentUploadModal';
import { PayrollEmployeeProfileTabLoading } from './PayrollEmployeeProfileTabLoading';
import styles from './PayrollEmployeeDocumentsTab.module.scss';

interface PayrollEmployeeDocumentsTabProps {
  userId: string;
  theme: 'light' | 'dark';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getExpiryState(expiryDate: string | null): 'none' | 'ok' | 'warn' | 'expired' {
  if (!expiryDate) return 'none';
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'warn';
  return 'ok';
}

function ExpiryBadge({ expiryDate }: { expiryDate: string | null }) {
  const state = getExpiryState(expiryDate);
  if (state === 'none') return null;

  const label =
    state === 'expired'
      ? `Vencido ${formatDate(expiryDate)}`
      : state === 'warn'
        ? `Vence ${formatDate(expiryDate)}`
        : `Vigente hasta ${formatDate(expiryDate)}`;

  const cls =
    state === 'expired'
      ? styles.expiryExpired
      : state === 'warn'
        ? styles.expiryWarn
        : styles.expiryOk;

  return <span className={`${styles.expiryBadge} ${cls}`}>{label}</span>;
}

function DocumentThumbnail({ doc }: { doc: EmployeeDocument }) {
  const isImage = doc.mimeType.startsWith('image/');
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgState, setImgState] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    if (!isImage) {
      setImgState('ok');
      return;
    }
    let cancelled = false;
    fetchEmployeeDocumentDownloadUrl(doc.id)
      .then((url) => {
        if (!cancelled) {
          setImgUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) setImgState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [doc.id, isImage]);

  return (
    <div className={styles.thumbnail} aria-hidden>
      {isImage ? (
        imgUrl ? (
          <img
            src={imgUrl}
            alt=""
            className={styles.thumbnailImg}
            onLoad={() => setImgState('ok')}
            onError={() => setImgState('error')}
          />
        ) : imgState === 'error' ? (
          <File size={18} color="var(--empleado-muted)" />
        ) : (
          <div className={styles.thumbnailSkeleton} />
        )
      ) : (
        <div className={styles.thumbnailPdf}>
          <FileText size={16} />
          <span className={styles.thumbnailPdfLabel}>PDF</span>
        </div>
      )}
    </div>
  );
}

function DocumentRow({
  doc,
  canWrite,
  downloading,
  deleting,
  onDownload,
  onDelete,
}: {
  doc: EmployeeDocument;
  canWrite: boolean;
  downloading: boolean;
  deleting: boolean;
  onDownload: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={styles.docRow}>
      <DocumentThumbnail doc={doc} />
      <div className={styles.docInfo}>
        <span className={styles.docTitle}>{doc.title}</span>
        <div className={styles.docMeta}>
          {doc.issueDate ? (
            <span className={styles.docDate}>Expedido {formatDate(doc.issueDate)}</span>
          ) : null}
          <ExpiryBadge expiryDate={doc.expiryDate} />
          {doc.notes ? <span className={styles.docNotes}>{doc.notes}</span> : null}
        </div>
      </div>
      <div className={styles.docActions}>
        <button
          type="button"
          className={styles.actionButton}
          disabled={downloading}
          onClick={onDownload}
          aria-label={`Descargar ${doc.title}`}
          title="Descargar"
        >
          <Download size={13} aria-hidden />
        </button>
        {canWrite ? (
          <button
            type="button"
            className={styles.deleteButton}
            disabled={deleting}
            onClick={onDelete}
            aria-label={`Eliminar ${doc.title}`}
            title="Eliminar documento"
          >
            <Trash2 size={13} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function PayrollEmployeeDocumentsTab({
  userId,
  theme,
}: PayrollEmployeeDocumentsTabProps): React.JSX.Element {
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();
  const canWrite = canWritePayrollEmployee(roleCode);

  const employeeQuery = usePayrollEmployeeQuery(userId);
  const employeeId = employeeQuery.data?.id;
  const docsQuery = useEmployeeDocumentsQuery(employeeId);
  const mutations = useEmployeeDocumentsMutations(employeeId ?? '');

  const [formOpen, setFormOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDownload = async (doc: EmployeeDocument) => {
    setDownloadingId(doc.id);
    try {
      const url = await fetchEmployeeDocumentDownloadUrl(doc.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('No se pudo obtener el enlace de descarga');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (doc: EmployeeDocument) => {
    if (!window.confirm(`¿Eliminar "${doc.title}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(doc.id);
    try {
      await mutations.deleteMutation.mutateAsync(doc.id);
      toast.success('Documento eliminado');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const isLoading = employeeQuery.isLoading || docsQuery.isLoading;
  const docs = docsQuery.data ?? [];

  const grouped = DOCUMENT_FILE_TYPE_OPTIONS.reduce<Record<DocumentFileType, EmployeeDocument[]>>(
    (acc, opt) => {
      acc[opt.value] = docs.filter((d) => d.fileType === opt.value);
      return acc;
    },
    {} as Record<DocumentFileType, EmployeeDocument[]>,
  );

  const nonEmptyTypes = DOCUMENT_FILE_TYPE_OPTIONS.filter((opt) => grouped[opt.value].length > 0);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <FileText size={16} aria-hidden />
          <span className={styles.headerTitle}>Documentos del colaborador</span>
          {docs.length > 0 ? <span className={styles.count}>{docs.length}</span> : null}
        </div>
        {canWrite ? (
          <button
            type="button"
            className={styles.addButton}
            onClick={() => setFormOpen(true)}
            disabled={!employeeId}
          >
            + Agregar documento
          </button>
        ) : null}
      </div>

      {isLoading ? <PayrollEmployeeProfileTabLoading /> : null}

      {!isLoading && docsQuery.isError ? (
        <div className={styles.errorState}>
          <p>No se pudieron cargar los documentos.</p>
          <button type="button" onClick={() => void docsQuery.refetch()}>
            Reintentar
          </button>
        </div>
      ) : null}

      {!isLoading && !docsQuery.isError && docs.length === 0 ? (
        <EmptyState
          title="Sin documentos"
          description="No hay documentos registrados para este colaborador."
        />
      ) : null}

      {!isLoading && !docsQuery.isError && docs.length > 0
        ? nonEmptyTypes.map((opt) => (
            <div key={opt.value} className={styles.group}>
              <div className={styles.groupHeader}>
                <span className={styles.groupLabel}>{DOCUMENT_FILE_TYPE_LABELS[opt.value]}</span>
                <span className={styles.groupCount}>{grouped[opt.value].length}</span>
              </div>
              <div className={styles.docList}>
                {grouped[opt.value].map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    canWrite={canWrite}
                    downloading={downloadingId === doc.id}
                    deleting={deletingId === doc.id}
                    onDownload={() => void handleDownload(doc)}
                    onDelete={() => void handleDelete(doc)}
                  />
                ))}
              </div>
            </div>
          ))
        : null}

      {employeeId ? (
        <EmployeeDocumentUploadModal
          open={formOpen}
          theme={theme}
          employeeId={employeeId}
          onClose={() => setFormOpen(false)}
          onSuccess={() => setFormOpen(false)}
        />
      ) : null}
    </div>
  );
}
