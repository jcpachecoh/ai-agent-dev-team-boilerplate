export interface AdminHealthResponse {
  status: 'ok';
}

export interface IAdminRepository {
  getHealth(): Promise<AdminHealthResponse>;
}

export interface IAdminService {
  getHealth(): Promise<AdminHealthResponse>;
}
