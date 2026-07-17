import { Button, Modal, toast } from '@restopsiq/ui';
import { Download, FileText } from 'lucide-react';
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
  canEditMedicalLeaveSupport,
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

  const [downloading, setDownloading] = useState(false);
  const [editingSupport, setEditingSupport] = useState(false);
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [replacementError, setReplacementError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDownloading(false);
      setEditingSupport(false);
      setReplacementFile(null);
      setReplacementError(null);
    }
  }, [open, leaveId]);

  const closeSupportEditor = () => {
    setEditingSupport(false);
    setReplacementFile(null);
    setReplacementError(null);
  };

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

  const handleReplaceSupport = async () => {
    if (!leaveId || !replacementFile) {
      setReplacementError('Selecciona un archivo de soporte');
      return;
    }
    try {
      await uploadSupportMutation.mutateAsync({ id: leaveId, file: replacementFile });
      await detailQuery.refetch();
      toast.success('Soporte médico actualizado');
      closeSupportEditor();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el soporte';
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
  const supportEditable = canWrite && !!detail && canEditMedicalLeaveSupport(detail.status);

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

          <div className={styles.supportBlock}>
            <span className={styles.label}>Soporte médico</span>
            {detail.supportStorageObjectId ? (
              <div className={styles.supportFile}>
                <FileText size={18} aria-hidden className={styles.supportFileIcon} />
                <span className={styles.supportFileName}>Soporte médico adjuntado</span>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={downloading}
                  onClick={() => void handleDownloadSupport()}
                >
                  {downloading ? 'Abriendo…' : 'Ver archivo'}
                </Button>
                {supportEditable && !editingSupport ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => setEditingSupport(true)}
                  >
                    Editar
                  </Button>
                ) : null}
              </div>
            ) : (
              <p className={styles.successNote}>Esta incapacidad no tiene soporte adjunto.</p>
            )}

            {supportEditable && (editingSupport || !detail.supportStorageObjectId) ? (
              <div className={styles.supportEditor}>
                <MedicalLeaveSupportFileUpload
                  resetKey={leaveId}
                  disabled={uploadSupportMutation.isPending}
                  error={replacementError}
                  onErrorChange={setReplacementError}
                  onChange={setReplacementFile}
                  description="El nuevo archivo reemplaza el soporte actual · PDF, JPG o PNG · máximo 10 MB"
                />
                <div className={styles.supportEditorActions}>
                  {detail.supportStorageObjectId ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={uploadSupportMutation.isPending}
                      onClick={closeSupportEditor}
                    >
                      Cancelar
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    disabled={!replacementFile || uploadSupportMutation.isPending}
                    onClick={() => void handleReplaceSupport()}
                  >
                    {uploadSupportMutation.isPending ? 'Guardando…' : 'Guardar soporte'}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <p className={styles.successNote}>No se pudo cargar el detalle de la incapacidad.</p>
      )}
    </Modal>
  );
}
