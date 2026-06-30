import type { PlantNoveltySeverity, PlantNoveltyType } from '@restopsiq/ui';
import { mapAlarmSeverityToNovelty } from '@restopsiq/ui';

import { useConnectivityStore } from '@/stores/connectivity.store';

import { compressImageBase64, enqueue } from './offline-queue.service';
import { plantFetch } from './plant-api.service';

export type NoveltyType = PlantNoveltyType;
export type NoveltySeverity = PlantNoveltySeverity;

/** @deprecated Use NoveltyType */
export type IncidentType = 'QUALITY' | 'SAFETY' | 'EQUIPMENT' | 'OTHER';
/** @deprecated Use NoveltySeverity */
export type AlarmSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface ReportOrderNoveltyInput {
  workStationId: string;
  noveltyType: NoveltyType;
  severity: NoveltySeverity;
  description: string;
  requiresPause?: boolean;
  stepId?: string;
  locationId?: string;
}

export interface OrderNovelty {
  id: string;
  orderId: string | null;
  workStationId: string;
  noveltyType: NoveltyType | null;
  severity: NoveltySeverity;
  description: string;
  requiresPause: boolean;
  createdAt: string;
  resolvedAt: string | null;
}

export interface ReportIncidentResult {
  queued: boolean;
  hasPhoto: boolean;
}

interface ApiIncidentResponse {
  id: string;
  orderId: string | null;
  workStationId: string;
  noveltyType: NoveltyType | null;
  severity: AlarmSeverity;
  description: string;
  requiresPause: boolean;
  createdAt: string;
  resolvedAt: string | null;
}

function mapApiSeverity(severity: AlarmSeverity): NoveltySeverity {
  return mapAlarmSeverityToNovelty(severity);
}

function mapApiIncident(incident: ApiIncidentResponse): OrderNovelty {
  return {
    id: incident.id,
    orderId: incident.orderId,
    workStationId: incident.workStationId,
    noveltyType: incident.noveltyType,
    severity: mapApiSeverity(incident.severity),
    description: incident.description,
    requiresPause: incident.requiresPause,
    createdAt: incident.createdAt,
    resolvedAt: incident.resolvedAt,
  };
}

function buildNoveltyPayload(
  orderId: string,
  input: ReportOrderNoveltyInput,
): Record<string, unknown> {
  return {
    orderId,
    workStationId: input.workStationId,
    noveltyType: input.noveltyType,
    severity: input.severity,
    description: input.description.trim(),
    requiresPause: input.requiresPause ?? false,
    stepId: input.stepId ?? null,
    locationId: input.locationId ?? null,
  };
}

export async function fetchOrderNovelties(
  orderId: string,
  opts?: { resolved?: boolean },
): Promise<OrderNovelty[]> {
  const query = opts?.resolved === undefined ? '' : `?resolved=${String(opts.resolved)}`;
  const response = await plantFetch<ApiIncidentResponse[]>(
    `/api/plant/orders/${orderId}/incidents${query}`,
  );
  return response.map(mapApiIncident);
}

export async function reportOrderNovelty(
  orderId: string,
  input: ReportOrderNoveltyInput,
  photoDataUrl?: string,
): Promise<ReportIncidentResult> {
  const trimmedDescription = input.description.trim();
  if (!trimmedDescription) {
    throw new Error('La descripción de la novedad es obligatoria');
  }

  const clientGeneratedId = crypto.randomUUID();
  const idempotencyKey = `incident:${orderId}:${clientGeneratedId}`;
  const payload = buildNoveltyPayload(orderId, { ...input, description: trimmedDescription });

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
    await plantFetch(`/api/plant/orders/${orderId}/incidents`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        workStationId: input.workStationId,
        noveltyType: input.noveltyType,
        severity: input.severity,
        description: trimmedDescription,
        requiresPause: input.requiresPause ?? false,
        stepId: input.stepId,
        locationId: input.locationId,
      }),
    });
    return { queued: false, hasPhoto: Boolean(compressedPhoto) };
  } catch {
    return queueOffline();
  }
}

/** @deprecated Use reportOrderNovelty when orderId is available */
export interface ReportIncidentInput {
  workStationId: string;
  orderId?: string;
  executionId?: string;
  locationId?: string;
  type: IncidentType;
  severity: AlarmSeverity;
  description: string;
}

export async function reportIncident(
  input: ReportIncidentInput,
  photoDataUrl?: string,
): Promise<ReportIncidentResult> {
  if (input.orderId) {
    const noveltyType = mapLegacyIncidentType(input.type);
    const severity = mapLegacySeverity(input.severity);
    return reportOrderNovelty(
      input.orderId,
      {
        workStationId: input.workStationId,
        noveltyType,
        severity,
        description: input.description,
        stepId: input.executionId,
        locationId: input.locationId,
      },
      photoDataUrl,
    );
  }

  const trimmedDescription = input.description.trim();
  if (!trimmedDescription) {
    throw new Error('La descripción del incidente es obligatoria');
  }

  const idempotencyKey = `incident:${input.workStationId}:${crypto.randomUUID()}`;
  const payload: Record<string, unknown> = {
    workStationId: input.workStationId,
    orderId: null,
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

function mapLegacyIncidentType(type: IncidentType): NoveltyType {
  switch (type) {
    case 'EQUIPMENT':
      return 'EQUIPMENT_FAILURE';
    case 'SAFETY':
      return 'SAFETY_INCIDENT';
    case 'QUALITY':
      return 'QUALITY_ISSUE';
    default:
      return 'OTHER';
  }
}

function mapLegacySeverity(severity: AlarmSeverity): NoveltySeverity {
  return mapAlarmSeverityToNovelty(severity);
}
