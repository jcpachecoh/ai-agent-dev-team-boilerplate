import { Test, TestingModule } from '@nestjs/testing';
import { MesJwtGuard } from '../guards/mes-jwt.guard';

describe('MesJwtGuard', () => {
  let guard: MesJwtGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MesJwtGuard],
    }).compile();

    guard = module.get<MesJwtGuard>(MesJwtGuard);
  });

  it('is defined', () => {
    expect(guard).toBeDefined();
  });

  it('uses the mes-jwt Passport strategy', () => {
    expect(guard).toBeInstanceOf(MesJwtGuard);
  });
});
