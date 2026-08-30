import type { AlarmTriggeredPayload } from '../controller/dto/alarm-triggered.payload';
import type { IAlarmPushAdapter, IEmergencyAlertAdapter } from '../interfaces/alarm.interfaces';

export const ALARM_PUSH_ADAPTER = Symbol('ALARM_PUSH_ADAPTER');
export const EMERGENCY_ALERT_ADAPTER = Symbol('EMERGENCY_ALERT_ADAPTER');
export const PLANT_ALARM_EVENTS = Symbol('PLANT_ALARM_EVENTS');

/** WebSocket alarm emit port — wired to PlantEventsService → PlantGateway. */
export interface IPlantAlarmEvents {
  emitAlarmTriggered(tenantId: string, payload: AlarmTriggeredPayload): void;
}

export type { IAlarmPushAdapter, IEmergencyAlertAdapter };
