export interface TestlabHealthResponse {
  status: 'ok';
}

export interface ITestlabRepository {
  getHealth(): Promise<TestlabHealthResponse>;
}

export interface ITestlabService {
  getHealth(): Promise<TestlabHealthResponse>;
}
