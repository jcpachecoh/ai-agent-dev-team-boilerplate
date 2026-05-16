import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
    jest.spyOn(service, '$connect').mockResolvedValue();
    jest.spyOn(service, '$disconnect').mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('onModuleInit calls $connect', async () => {
    await service.onModuleInit();
    expect(service.$connect).toHaveBeenCalledTimes(1);
  });

  it('onModuleDestroy calls $disconnect', async () => {
    await service.onModuleDestroy();
    expect(service.$disconnect).toHaveBeenCalledTimes(1);
  });
});
