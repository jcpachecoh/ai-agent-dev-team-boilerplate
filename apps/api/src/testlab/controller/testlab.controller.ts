import { Controller, Get } from '@nestjs/common';
import type { TestlabHealthResponse } from '../interfaces/testlab.interfaces';
import { TestlabService } from '../service/testlab.service';

@Controller('testlab')
export class TestlabController {
  constructor(private readonly testlabService: TestlabService) {}

  @Get('health')
  getHealth(): Promise<TestlabHealthResponse> {
    return this.testlabService.getHealth();
  }
}
