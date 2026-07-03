import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { MesJwtPayload } from '../../auth/interfaces/mes-auth.interfaces';
import type { AlarmTriggeredPayload } from '../controller/dto/alarm-triggered.payload';
import type { IncidentCreatedPayload } from '../controller/dto/incident.response';
import type { PhaseStatusChangedPayload } from '../service/plant-events.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class PlantGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(PlantGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<MesJwtPayload>(token);
      const tenantId = payload.tenantId;
      const stationId = this.extractStationId(client);

      await client.join(`tenant:${tenantId}`);
      if (stationId) {
        await client.join(`station:${stationId}`);
      }

      client.data.tenantId = tenantId;
      client.data.stationId = stationId;
    } catch (error) {
      this.logger.debug(`WebSocket connection rejected: ${String(error)}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: Socket): void {
    // Room membership is cleaned up automatically by Socket.IO.
  }

  emitPhaseStatusChanged(tenantId: string, payload: PhaseStatusChangedPayload): void {
    if (!this.server) {
      return;
    }

    this.server.to(`tenant:${tenantId}`).emit('phase:status_changed', payload);
  }

  emitAlarmTriggered(tenantId: string, payload: AlarmTriggeredPayload): void {
    if (!this.server) {
      return;
    }

    this.server.to(`tenant:${tenantId}`).emit('alarm:triggered', payload);

    if (payload.stationId) {
      this.server.to(`station:${payload.stationId}`).emit('alarm:triggered', payload);
    }
  }

  emitIncidentCreated(tenantId: string, payload: IncidentCreatedPayload): void {
    if (!this.server) {
      return;
    }

    this.server.to(`tenant:${tenantId}`).emit('incident:created', payload);

    if (payload.stationId) {
      this.server.to(`station:${payload.stationId}`).emit('incident:created', payload);
    }
  }

  private extractToken(client: Socket): string | undefined {
    const auth = client.handshake.auth as { token?: string };
    if (typeof auth?.token === 'string' && auth.token.length > 0) {
      return auth.token;
    }

    const authorization = client.handshake.headers.authorization;
    if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
      return authorization.slice('Bearer '.length);
    }

    return undefined;
  }

  private extractStationId(client: Socket): string | undefined {
    const auth = client.handshake.auth as { stationId?: string };
    if (typeof auth?.stationId === 'string' && auth.stationId.length > 0) {
      return auth.stationId;
    }

    const query = client.handshake.query as { stationId?: string | string[] };
    const stationId = query.stationId;
    if (typeof stationId === 'string' && stationId.length > 0) {
      return stationId;
    }
    if (Array.isArray(stationId) && typeof stationId[0] === 'string') {
      return stationId[0];
    }

    return undefined;
  }
}
