import { Injectable } from '@nestjs/common';
import type { ITestlabRepository, TestlabHealthResponse } from '../interfaces/testlab.interfaces';

@Injectable()
export class TestlabRepository implements ITestlabRepository {
  async getHealth(): Promise<TestlabHealthResponse> {
    return { status: 'ok' };
  }
}
