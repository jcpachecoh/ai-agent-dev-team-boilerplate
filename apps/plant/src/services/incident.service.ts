import { useConnectivityStore } from '@/stores/connectivity.store';

import { compressImageBase64, enqueue } from './offline-queue.service';
import { plantFetch } from './plant-api.service';

export type IncidentType = 'QUALITY' | 'SAFETY' | 'EQUIPMENT' | 'OTHER';
export type AlarmSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface ReportIncidentInput {
  workStationId: string;
  orderId?: string;
  executionId?: string;
  locationId?: string;
  type: IncidentType;
  severity: AlarmSeverity;
  description: string;
}

export interface ReportIncidentResult {
  queued: boolean;
  hasPhoto: boolean;
}

export async function reportIncident(
  input: ReportIncidentInput,
  photoDataUrl?: string,
): Promise<ReportIncidentResult> {
  const trimmedDescription = input.description.trim();
  if (!trimmedDescription) {
    throw new Error('La descripción del incidente es obligatoria');
  }

  const idempotencyKey = `incident:${input.orderId ?? input.workStationId}:${crypto.randomUUID()}`;
  const payload: Record<string, unknown> = {
    workStationId: input.workStationId,
    orderId: input.orderId ?? null,
    executionId: input.executionId ?? null,
    locationId: input.locationId ?? null,
    type: input.type,
    severity: input.severity,
    description: trimmedDescription,
  };

  let compressedPhoto: string | undefined;
  if (photoDataUrl) {
    compressedPhoto = await compressImageBase64(photoDataUrl);
  }

  const { isOnline } = useConnectivityStore.getState();

  const queueOffline = async (): Promise<ReportIncidentResult> => {
    await enqueue({
      type: 'incident.create',
      payload,
      idempotencyKey,
      imageBase64: compressedPhoto,
    });
    return { queued: true, hasPhoto: Boolean(compressedPhoto) };
  };

  if (!isOnline) {
    return queueOffline();
  }

  try {
    await plantFetch('/api/plant/incidents', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payload),
    });
    return { queued: false, hasPhoto: Boolean(compressedPhoto) };
  } catch {
    return queueOffline();
  }
}
