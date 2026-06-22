import { PlantIncidentReportModal } from '@restopsiq/ui';
import { useCallback, useEffect, useState, type JSX } from 'react';

import { takeIncidentPhoto, IncidentPhotoError } from '@/services/camera.service';
import { reportIncident, type AlarmSeverity, type IncidentType } from '@/services/incident.service';
import { useSessionStore } from '@/stores/session.store';

export interface IncidentReportModalProps {
  open: boolean;
  workStationId: string;
  orderId?: string;
  executionId?: string;
  orderLabel?: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function IncidentReportModal({
  open,
  workStationId,
  orderId,
  executionId,
  orderLabel,
  onClose,
  onSubmitted,
}: IncidentReportModalProps): JSX.Element | null {
  const locationId = useSessionStore((s) => s.operator?.locationId ?? undefined);
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IncidentType>('QUALITY');
  const [severity, setSeverity] = useState<AlarmSeverity>('WARNING');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setDescription('');
      setType('QUALITY');
      setSeverity('WARNING');
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
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await reportIncident(
        {
          workStationId,
          orderId,
          executionId,
          locationId,
          type,
          severity,
          description,
        },
        photoPreview ?? undefined,
      );

      if (result.hasPhoto && result.queued) {
        setError(
          'Incidente en cola offline. La foto se sincronizará cuando haya conexión (upload pendiente).',
        );
      }

      onSubmitted?.();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo reportar');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    description,
    executionId,
    locationId,
    onClose,
    onSubmitted,
    orderId,
    photoPreview,
    severity,
    type,
    workStationId,
  ]);

  return (
    <PlantIncidentReportModal
      open={open}
      theme="dark"
      size="xl"
      subtitle={orderLabel}
      description={description}
      onDescriptionChange={setDescription}
      type={type}
      onTypeChange={setType}
      severity={severity}
      onSeverityChange={setSeverity}
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
