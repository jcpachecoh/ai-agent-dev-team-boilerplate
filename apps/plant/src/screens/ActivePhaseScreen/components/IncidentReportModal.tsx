import { PlantIncidentReportModal } from '@restopsiq/ui';
import { useCallback, useEffect, useState, type JSX } from 'react';

import type { PlantUiTheme } from '@/constants/theme';

import { takeIncidentPhoto, IncidentPhotoError } from '@/services/camera.service';
import {
  reportOrderNovelty,
  type NoveltySeverity,
  type NoveltyType,
} from '@/services/incident.service';
import { useSessionStore } from '@/stores/session.store';

export interface IncidentReportModalProps {
  open: boolean;
  theme?: PlantUiTheme;
  workStationId: string;
  orderId?: string;
  executionId?: string;
  orderLabel?: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function IncidentReportModal({
  open,
  theme = 'dark',
  workStationId,
  orderId,
  executionId,
  orderLabel,
  onClose,
  onSubmitted,
}: IncidentReportModalProps): JSX.Element | null {
  const locationId = useSessionStore((s) => s.operator?.locationId ?? undefined);
  const [description, setDescription] = useState('');
  const [noveltyType, setNoveltyType] = useState<NoveltyType>('QUALITY_ISSUE');
  const [severity, setSeverity] = useState<NoveltySeverity>('MEDIUM');
  const [requiresPause, setRequiresPause] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setDescription('');
      setNoveltyType('QUALITY_ISSUE');
      setSeverity('MEDIUM');
      setRequiresPause(false);
      setPhotoPreview(null);
      setError(null);
      setIsCapturing(false);
      setIsSubmitting(false);
    }
  }, [open]);

  const handleCapturePhoto = useCallback(async () => {
    setError(null);
    setIsCapturing(true);
    try {
      const dataUrl = await takeIncidentPhoto();
      setPhotoPreview(dataUrl);
    } catch (captureError) {
      if (captureError instanceof IncidentPhotoError && captureError.code === 'cancelled') {
        return;
      }
      setError(
        captureError instanceof Error ? captureError.message : 'No se pudo capturar la foto',
      );
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!orderId) {
      setError('No hay una orden activa para registrar la novedad');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const result = await reportOrderNovelty(
        orderId,
        {
          workStationId,
          noveltyType,
          severity,
          description,
          requiresPause,
          stepId: executionId,
          locationId,
        },
        photoPreview ?? undefined,
      );

      if (result.queued) {
        setError(
          result.hasPhoto
            ? 'Novedad en cola offline. La foto se sincronizará cuando haya conexión.'
            : 'Novedad en cola offline. Se sincronizará cuando haya conexión.',
        );
      }

      onSubmitted?.();
      if (!result.queued) {
        onClose();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo reportar');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    description,
    executionId,
    locationId,
    noveltyType,
    onClose,
    onSubmitted,
    orderId,
    photoPreview,
    requiresPause,
    severity,
    workStationId,
  ]);

  return (
    <PlantIncidentReportModal
      open={open}
      theme={theme}
      size="xl"
      subtitle={orderLabel}
      description={description}
      onDescriptionChange={setDescription}
      noveltyType={noveltyType}
      onNoveltyTypeChange={setNoveltyType}
      severity={severity}
      onSeverityChange={setSeverity}
      requiresPause={requiresPause}
      onRequiresPauseChange={setRequiresPause}
      photoPreview={photoPreview}
      onCapturePhoto={() => void handleCapturePhoto()}
      isCapturing={isCapturing}
      error={error}
      isSubmitting={isSubmitting}
      onSubmit={() => void handleSubmit()}
      onClose={onClose}
    />
  );
}

export default IncidentReportModal;
