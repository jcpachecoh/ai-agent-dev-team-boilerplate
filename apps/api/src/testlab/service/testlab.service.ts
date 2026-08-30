import { Injectable } from '@nestjs/common';
import type { ITestlabService, TestlabHealthResponse } from '../interfaces/testlab.interfaces';
import { TestlabRepository } from '../repository/testlab.repository';

@Injectable()
export class TestlabService implements ITestlabService {
  constructor(private readonly testlabRepository: TestlabRepository) {}

  getHealth(): Promise<TestlabHealthResponse> {
    return this.testlabRepository.getHealth();
  }
}
