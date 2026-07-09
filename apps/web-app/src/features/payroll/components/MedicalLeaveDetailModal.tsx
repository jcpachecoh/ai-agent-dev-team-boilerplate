import { Button, Modal, toast } from '@restopsiq/ui';
import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTheme } from '@/providers/ThemeProvider';

import { fetchMedicalLeaveSupportDocumentUrl } from '../api/medical-leaves.client';
import { useMedicalLeaveMutations } from '../hooks/useMedicalLeaveMutations';
import { useMedicalLeaveDetailQuery } from '../hooks/useMedicalLeavesQuery';
import type {
  LeaveStatus,
  ListMedicalLeavesFilters,
  MedicalLeaveSummary,
} from '../types/medical-leaves.types';
import {
  LEAVE_ORIGIN_LABELS,
  canMarkRecovered,
  canRadicateMedicalLeave,
  canRejectMedicalLeave,
} from '../utils/medical-leaves-display';
import { MedicalLeave180DayBanner } from './MedicalLeave180DayBanner';
import { MedicalLeaveSplitPreview } from './MedicalLeaveSplitPreview';
import { MedicalLeaveSupportFileUpload } from './MedicalLeaveSupportFileUpload';
import styles from './MedicalLeaveDetailModal.module.scss';

interface Props {
  open: boolean;
  leaveId: string | null;
  summary: MedicalLeaveSummary | null;
  listFilters: ListMedicalLeavesFilters;
  canWrite: boolean;
  onClose: () => void;
  onReject: (leave: MedicalLeaveSummary) => void;
}

export function MedicalLeaveDetailModal({
  open,
  leaveId,
  summary,
  listFilters,
  canWrite,
  onClose,
  onReject,
}: Props): React.JSX.Element | null {
  const { theme } = useTheme();
  const modalTheme = theme === 'light' ? 'light' : 'dark';
  const detailQuery = useMedicalLeaveDetailQuery(leaveId ?? undefined, open && !!leaveId);
  const { updateStatusMutation, uploadSupportMutation } = useMedicalLeaveMutations(listFilters);

  const [detailUploadFile, setDetailUploadFile] = useState<File | null>(null);
  const [detailUploadError, setDetailUploadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!open) {
      setDetailUploadFile(null);
      setDetailUploadError(null);
      setDownloading(false);
    }
  }, [open, leaveId]);

  const handleStatusChange = async (status: LeaveStatus) => {
    if (!leaveId) return;
    try {
      await updateStatusMutation.mutateAsync({ id: leaveId, input: { status } });
      toast.success('Estado actualizado');
      await detailQuery.refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el estado';
      toast.error(message);
      throw error;
    }
  };

  const handleUploadSupport = async () => {
    if (!leaveId || !detailUploadFile) {
      toast.error('Selecciona un archivo de soporte');
      return;
    }
    try {
      await uploadSupportMutation.mutateAsync({ id: leaveId, file: detailUploadFile });
      setDetailUploadFile(null);
      setDetailUploadError(null);
      await detailQuery.refetch();
      toast.success('Soporte médico adjuntado');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo adjuntar el soporte';
      toast.error(message);
    }
  };

  const handleDownloadSupport = async () => {
    if (!leaveId || !detailQuery.data?.supportStorageObjectId) {
      toast.error('Esta incapacidad no tiene soporte adjunto');
      return;
    }
    setDownloading(true);
    try {
      const url = await fetchMedicalLeaveSupportDocumentUrl(leaveId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo descargar el soporte';
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  if (!open || !leaveId) return null;

  const detail = detailQuery.data;
  const busy =
    updateStatusMutation.isPending || uploadSupportMutation.isPending || detailQuery.isLoading;

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !busy) onClose();
      }}
      size="lg"
      theme={modalTheme}
      title={summary?.employeeName ?? 'Detalle de incapacidad'}
      description={
        detail
          ? `${LEAVE_ORIGIN_LABELS[detail.origin]} · ${detail.status.replaceAll('_', ' ')}`
          : 'Cargando detalle de la incapacidad…'
      }
      onInteractOutside={(event) => {
        if (busy) event.preventDefault();
      }}
      footer={
        <div className={styles.actions}>
          {detail?.supportStorageObjectId ? (
            <Button
              type="button"
              variant="secondary"
              disabled={downloading}
              onClick={() => void handleDownloadSupport()}
            >
              <Download size={14} aria-hidden />
              {downloading ? 'Descargando…' : 'Descargar soporte'}
            </Button>
          ) : null}
          {canWrite &&
          detail &&
          canRadicateMedicalLeave(detail.status, !!detail.supportStorageObjectId) ? (
            <Button
              type="button"
              disabled={updateStatusMutation.isPending}
              onClick={() => void handleStatusChange('RADICADA_EPS')}
            >
              Radicar EPS/ARL
            </Button>
          ) : null}
          {canWrite && detail && canMarkRecovered(detail.status) ? (
            <Button
              type="button"
              variant="secondary"
              disabled={updateStatusMutation.isPending}
              onClick={() => void handleStatusChange('RECOBRADA')}
            >
              Marcar recobrada
            </Button>
          ) : null}
          {canWrite && detail && canRejectMedicalLeave(detail.status) && summary ? (
            <Button type="button" variant="danger" onClick={() => onReject(summary)}>
              Rechazar
            </Button>
          ) : null}
          <Button type="button" onClick={onClose} disabled={busy}>
            Cerrar
          </Button>
        </div>
      }
    >
      {detailQuery.isLoading ? (
        <p className={styles.successNote}>Cargando detalle…</p>
      ) : detail ? (
        <div className={styles.body}>
          {detail.exceeds180DayThreshold ? (
            <MedicalLeave180DayBanner annualAccumulatedDays={detail.annualAccumulatedDays} />
          ) : null}

          <MedicalLeaveSplitPreview
            leave={detail}
            annualAccumulatedDays={detail.annualAccumulatedDays}
          />

          {canWrite && !detail.supportStorageObjectId ? (
            <div className={styles.uploadBlock}>
              <span className={styles.label}>Adjuntar soporte médico</span>
              <MedicalLeaveSupportFileUpload
                resetKey={leaveId}
                disabled={uploadSupportMutation.isPending}
                error={detailUploadError}
                onErrorChange={setDetailUploadError}
                onChange={setDetailUploadFile}
                description="Requerido antes de radicar ante EPS/ARL"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={!detailUploadFile || uploadSupportMutation.isPending}
                onClick={() => void handleUploadSupport()}
              >
                {uploadSupportMutation.isPending ? 'Subiendo…' : 'Subir soporte'}
              </Button>
            </div>
          ) : detail.supportStorageObjectId ? (
            <p className={styles.successNote}>Soporte médico adjuntado correctamente.</p>
          ) : null}
        </div>
      ) : (
        <p className={styles.successNote}>No se pudo cargar el detalle de la incapacidad.</p>
      )}
    </Modal>
  );
}
