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
      .send({ cedula: OPERATOR_CEDULA, pin: OPERATOR_PIN, locationId });

    expect(authRes.status).toBe(200);
    expect(authRes.body.userId).toBe(OPERATOR_USER_ID);
    expect(authRes.body.locationId).toBe(locationId);
    expect(typeof authRes.body.employeeId).toBe('string');
    expect(typeof authRes.body.fullName).toBe('string');

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
      .send({ cedula: OPERATOR_CEDULA, pin: '0000', locationId });

    expect(res.status).toBe(401);
  });

  it('kiosk-auth: header x-tenant-id faltante devuelve 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/attendance/kiosk-auth')
      .send({ cedula: OPERATOR_CEDULA, pin: OPERATOR_PIN, locationId });

    expect(res.status).toBe(400);
  });
});
