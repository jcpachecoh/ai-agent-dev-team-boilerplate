import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceResolver } from '../resolver/attendance.resolver';
import { AttendanceService } from '../service/attendance.service';

const tenantId = 'palos-de-lena';

const gqlContext = {
  req: {
    headers: {
      'x-tenant-id': tenantId,
    },
  },
};

const attendanceServiceMock = {
  kioskAuth: jest.fn(),
};

describe('AttendanceResolver', () => {
  let resolver: AttendanceResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceResolver,
        { provide: AttendanceService, useValue: attendanceServiceMock },
      ],
    }).compile();

    resolver = module.get<AttendanceResolver>(AttendanceResolver);
    jest.clearAllMocks();
  });

  it('delegates kioskAuth to AttendanceService using x-tenant-id from context', async () => {
    const input = {
      cedula: '12345678',
      pin: '1234',
      locationId: 'loc-001',
    };
    const expected = {
      userId: 'user-001',
      fullName: 'carlos',
      locationId: 'loc-001',
      employeeId: 'emp-001',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };
    attendanceServiceMock.kioskAuth.mockResolvedValue(expected);

    const result = await resolver.kioskAuth(gqlContext, input);

    expect(result).toEqual(expected);
    expect(attendanceServiceMock.kioskAuth).toHaveBeenCalledWith(input, tenantId);
  });
});
