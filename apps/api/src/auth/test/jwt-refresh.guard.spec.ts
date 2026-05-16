import { Test, TestingModule } from '@nestjs/testing';
import { JwtRefreshGuard } from '../guards/jwt-refresh.guard';

describe('JwtRefreshGuard', () => {
  let guard: JwtRefreshGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtRefreshGuard],
    }).compile();

    guard = module.get<JwtRefreshGuard>(JwtRefreshGuard);
  });

  it('is defined', () => {
    expect(guard).toBeDefined();
  });
});
