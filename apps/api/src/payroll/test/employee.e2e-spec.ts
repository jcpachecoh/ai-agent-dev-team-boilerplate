import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  INestApplication,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

describe('EmployeesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const mockTenantId = 'palos-de-lena';

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('full employee CRUD flow (REST)', async () => {
    // 1. Login
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('x-tenant-id', mockTenantId)
      .send({ email: 'mes-owner@palos-de-lena.dev', password: 'TestPass123!' });
    const accessToken = loginResponse.body.accessToken;

    // Get seed data
    const location = await prisma.location.findFirst({ where: { tenantId: mockTenantId } });
    const role = await prisma.role.findFirst({ where: { tenantId: mockTenantId } });

    // 2. POST employee (creates user + employeeDetails atomically when user does not exist)
    const timestamp = Date.now();
    const cedula = '123' + timestamp;
    const email = 'test-' + timestamp + '@test.com';
    const employeeData = {
      cedula,
      documentType: 'CC',
      email,
      roleId: role!.id,
      locationId: location!.id,
      name: 'Empleado de prueba',
      position: 'Operario',
      area: 'Producción',
      department: 'Cocina',
      contractType: 'FIJO',
      hireDate: '2025-01-01',
      contractStart: '2025-01-01',
      contractEnd: '2025-12-31',
      salaryType: 'ORDINARIO',
      salaryAmount: 2000000,
      epsName: 'EPS',
      pensionFundName: 'Pension',
      cesantiasFundName: 'Cesantias',
      arlName: 'ARL',
      arlRiskLevel: 'RIESGO_II',
      cajaCompensacion: 'Caja',
    };

    const postRes = await request(app.getHttpServer())
      .post('/api/employees')
      .set('Authorization', 'Bearer ' + accessToken)
      .set('x-tenant-id', mockTenantId)
      .send(employeeData);
    expect(postRes.status).toBe(201);
    const userId = postRes.body.userId;

    // 4. GET all
    const listRes = await request(app.getHttpServer())
      .get('/api/employees')
      .set('Authorization', 'Bearer ' + accessToken)
      .set('x-tenant-id', mockTenantId);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);

    // 5. GET one
    const getOneRes = await request(app.getHttpServer())
      .get('/api/employees/' + userId)
      .set('Authorization', 'Bearer ' + accessToken)
      .set('x-tenant-id', mockTenantId);
    expect(getOneRes.status).toBe(200);
    expect(getOneRes.body.userId).toBe(userId);

    // 6. PATCH
    const patchRes = await request(app.getHttpServer())
      .patch('/api/employees/' + userId)
      .set('Authorization', 'Bearer ' + accessToken)
      .set('x-tenant-id', mockTenantId)
      .send({ position: 'Senior' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.position).toBe('Senior');

    // 7. GET by location
    const locRes = await request(app.getHttpServer())
      .get('/api/employees/location/' + location!.id)
      .set('Authorization', 'Bearer ' + accessToken)
      .set('x-tenant-id', mockTenantId);
    expect(locRes.status).toBe(200);

    // 8. GET by contract type
    const contractRes = await request(app.getHttpServer())
      .get('/api/employees/contract-type/FIJO')
      .set('Authorization', 'Bearer ' + accessToken)
      .set('x-tenant-id', mockTenantId);
    expect(contractRes.status).toBe(200);

    // 9. DELETE
    const delRes = await request(app.getHttpServer())
      .delete('/api/employees/' + userId)
      .set('Authorization', 'Bearer ' + accessToken)
      .set('x-tenant-id', mockTenantId);
    expect(delRes.status).toBe(200);
  });
});
