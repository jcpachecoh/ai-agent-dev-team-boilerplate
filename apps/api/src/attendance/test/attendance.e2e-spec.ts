import {
  BadRequestException,
  INestApplication,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { ValidationError } from 'class-validator';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

describe('AttendanceController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const TENANT = 'palos-de-lena';
  const OPERATOR_USER_ID = '11111111-0000-0000-0000-000000000005';
  const OPERATOR_CEDULA = '87654321';
  const OPERATOR_PIN = '4321';

  let accessToken: string;
  let locationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', {
      exclude: [{ path: 'health', method: RequestMethod.GET }],
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        exceptionFactory: (errors: ValidationError[]) => {
          const messages = errors.flatMap((e) =>
            e.constraints ? Object.values(e.constraints) : [`${e.property} failed validation`],
          );
          return new BadRequestException(messages);
        },
      }),
    );

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    // Resolve locationId from seed data
    const location = await prisma.location.findFirst({ where: { tenantId: TENANT } });
    locationId = location!.id;

    // Clean up existing attendance logs for the operator employee to prevent ConflictException
    const employee = await prisma.employeeDetails.findFirst({
      where: { userId: OPERATOR_USER_ID },
    });
    if (employee) {
      await prisma.attendanceLog.deleteMany({ where: { employeeId: employee.id } });
    }

    // Login as owner to obtain JWT for protected endpoints
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('x-tenant-id', TENANT)
      .send({ email: 'mes-owner@palos-de-lena.dev', password: 'TestPass123!' });
    accessToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('full kiosk attendance flow: auth → entry → active → exit → history → overtime', async () => {
    // ── Step 1: kiosk-auth (public) ──────────────────────────────────────────
    const authRes = await request(app.getHttpServer())
      .post('/api/attendance/kiosk-auth')
      .set('x-tenant-id', TENANT)
      .send({ cedula: OPERATOR_CEDULA, pin: OPERATOR_PIN });

    expect(authRes.status).toBe(200);
    expect(authRes.body.userId).toBe(OPERATOR_USER_ID);
    expect(authRes.body.locationId).toBe(locationId);
    expect(typeof authRes.body.employeeId).toBe('string');
    expect(typeof authRes.body.fullName).toBe('string');
    expect(typeof authRes.body.accessToken).toBe('string');
    expect(typeof authRes.body.refreshToken).toBe('string');

    const { userId } = authRes.body;

    // ── Step 2: register entry (public) ──────────────────────────────────────
    const entryRes = await request(app.getHttpServer())
      .post('/api/attendance/entry')
      .set('x-tenant-id', TENANT)
      .send({ userId, locationId });

    expect(entryRes.status).toBe(201);
    expect(typeof entryRes.body.logId).toBe('string');
    expect(typeof entryRes.body.employeeId).toBe('string');
    expect(entryRes.body.userId).toBe(userId);

    // ── Step 3: double entry is rejected (conflict) ───────────────────────────
    const dupEntryRes = await request(app.getHttpServer())
      .post('/api/attendance/entry')
      .set('x-tenant-id', TENANT)
      .send({ userId, locationId });

    expect(dupEntryRes.status).toBe(409);

    // ── Step 4: verify active employees at location (JWT) ─────────────────────
    const activeRes = await request(app.getHttpServer())
      .get('/api/attendance/active')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ locationId });

    expect(activeRes.status).toBe(200);
    expect(Array.isArray(activeRes.body)).toBe(true);
    expect(activeRes.body.some((e: any) => e.userId === userId)).toBe(true);

    // ── Step 5: register exit (public) ───────────────────────────────────────
    const exitRes = await request(app.getHttpServer())
      .post('/api/attendance/exit')
      .set('x-tenant-id', TENANT)
      .send({ userId, locationId });

    expect(exitRes.status).toBe(200);
    expect(typeof exitRes.body.logId).toBe('string');
    expect(typeof exitRes.body.totalMinutes).toBe('number');
    expect(exitRes.body.totalMinutes).toBeGreaterThanOrEqual(0);
    expect(typeof exitRes.body.overtimeMinutes).toBe('number');
    expect(typeof exitRes.body.isNocturno).toBe('boolean');

    // ── Step 6: history filtered by userId (JWT) ──────────────────────────────
    const historyRes = await request(app.getHttpServer())
      .get('/api/attendance')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ userId });

    expect(historyRes.status).toBe(200);
    expect(Array.isArray(historyRes.body)).toBe(true);
    // At minimum: the ENTRY and EXIT registered above
    expect(historyRes.body.length).toBeGreaterThanOrEqual(2);

    // ── Step 7: overtime summary (JWT) ───────────────────────────────────────
    const overtimeRes = await request(app.getHttpServer())
      .get(`/api/attendance/employees/${userId}/overtime`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(overtimeRes.status).toBe(200);
    expect(overtimeRes.body.userId).toBe(userId);
    expect(typeof overtimeRes.body.totalMinutes).toBe('number');
    expect(typeof overtimeRes.body.overtimeMinutes).toBe('number');
    expect(Array.isArray(overtimeRes.body.pairs)).toBe(true);
    expect(overtimeRes.body.pairs.length).toBeGreaterThanOrEqual(1);
  });

  it('kiosk-auth: PIN incorrecto devuelve 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/attendance/kiosk-auth')
      .set('x-tenant-id', TENANT)
      .send({ cedula: OPERATOR_CEDULA, pin: '0000' });

    expect(res.status).toBe(401);
  });

  it('kiosk-auth: header x-tenant-id faltante devuelve 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/attendance/kiosk-auth')
      .send({ cedula: OPERATOR_CEDULA, pin: OPERATOR_PIN });

    expect(res.status).toBe(400);
  });

  // ── OS-551 — Tarjeta de Asistencia (marcaciones manuales + observaciones) ──

  describe('OS-551: card, observations, manual markings', () => {
    const dateFrom = '2026-06-01';
    const dateTo = '2026-06-30';

    it('GET card devuelve logs + observations del rango', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/attendance/employees/${OPERATOR_USER_ID}/card`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ dateFrom, dateTo });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.logs)).toBe(true);
      expect(Array.isArray(res.body.observations)).toBe(true);
    });

    it('GET card con rango mayor a 3 meses devuelve 400', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/attendance/employees/${OPERATOR_USER_ID}/card`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ dateFrom: '2026-01-01', dateTo: '2026-06-30' });

      expect(res.status).toBe(400);
    });

    it('PUT observation crea/edita y GET observations la refleja', async () => {
      const putRes = await request(app.getHttpServer())
        .put(`/api/attendance/employees/${OPERATOR_USER_ID}/observations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ workDate: '2026-06-10', note: 'Llegó tarde por transporte público' });

      expect(putRes.status).toBe(200);
      expect(putRes.body.note).toBe('Llegó tarde por transporte público');

      const getRes = await request(app.getHttpServer())
        .get(`/api/attendance/employees/${OPERATOR_USER_ID}/observations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ dateFrom, dateTo });

      expect(getRes.status).toBe(200);
      expect(
        getRes.body.some((o: { note: string }) => o.note === 'Llegó tarde por transporte público'),
      ).toBe(true);
    });

    it('PUT observation con note > 500 caracteres devuelve 400', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/attendance/employees/${OPERATOR_USER_ID}/observations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ workDate: '2026-06-10', note: 'a'.repeat(501) });

      expect(res.status).toBe(400);
    });

    it('POST manual-markings crea un AttendanceLog con source=MANUAL', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/attendance/employees/${OPERATOR_USER_ID}/manual-markings`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          workDate: '2026-06-15',
          eventType: 'ENTRY',
          timestamp: '2026-06-15T08:00:00.000Z',
          reason: 'FORGOT',
        });

      expect(res.status).toBe(201);
      expect(res.body.source).toBe('MANUAL');
      expect(res.body.manualReason).toBe('FORGOT');
    });

    it('POST manual-markings con parentLogId inexistente devuelve 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/attendance/employees/${OPERATOR_USER_ID}/manual-markings`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          workDate: '2026-06-15',
          eventType: 'EXIT',
          timestamp: '2026-06-15T17:00:00.000Z',
          reason: 'SUPERVISOR_CORRECTION',
          parentLogId: 'non-existent-log-id',
        });

      expect(res.status).toBe(400);
    });

    it('POST manual-markings con reason inválido (fuera del catálogo) devuelve 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/attendance/employees/${OPERATOR_USER_ID}/manual-markings`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          workDate: '2026-06-15',
          eventType: 'ENTRY',
          timestamp: '2026-06-15T08:00:00.000Z',
          reason: 'Porque sí',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('OS-553: DELETE manual marking', () => {
    it('elimina una marcación manual y ya no aparece en el historial', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`/api/attendance/employees/${OPERATOR_USER_ID}/manual-markings`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          workDate: '2026-06-20',
          eventType: 'ENTRY',
          timestamp: '2026-06-20T08:00:00.000Z',
          reason: 'DEVICE_FAILURE',
        });
      expect(createRes.status).toBe(201);
      const manualLogId = createRes.body.id;

      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/attendance/manual-markings/${manualLogId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteRes.status).toBe(204);

      const historyRes = await request(app.getHttpServer())
        .get('/api/attendance')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId: OPERATOR_USER_ID });

      expect(historyRes.body.some((log: { id: string }) => log.id === manualLogId)).toBe(false);
    });

    it('eliminar un log DEVICE devuelve 403 (AttendanceLog es inmutable)', async () => {
      const entryRes = await request(app.getHttpServer())
        .post('/api/attendance/entry')
        .set('x-tenant-id', TENANT)
        .send({ userId: OPERATOR_USER_ID, locationId });
      expect(entryRes.status).toBe(201);
      const deviceLogId = entryRes.body.logId;

      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/attendance/manual-markings/${deviceLogId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteRes.status).toBe(403);

      // cleanup: cerrar la entrada abierta para no afectar otros tests
      await request(app.getHttpServer())
        .post('/api/attendance/exit')
        .set('x-tenant-id', TENANT)
        .send({ userId: OPERATOR_USER_ID, locationId });
    });

    it('eliminar una marcación inexistente devuelve 404', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/attendance/manual-markings/non-existent-log-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });
});
