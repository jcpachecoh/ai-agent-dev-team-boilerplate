import { GraphQLError } from 'graphql';
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  RateLimitError,
  ValidationError,
} from '../utils/errors';

// ─── Request context (forwarded from GraphQL HTTP request) ───────────────────

export interface ApiRequestContext {
  tenantId?: string | null;
  authorization?: string | null;
  userAgent?: string | null;
  forwardedFor?: string | null;
}

export type FetchFn = typeof fetch;

// ─── Auth REST payloads (mirror apps/api responses) ─────────────────────────

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  cedula: string;
  documentType: string;
  roleCode?: string;
}

export interface GlobalLoginRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  otpCode: string;
}

export interface MesLoginRequest {
  cedula: string;
  pin: string;
}

export interface MesOperatorResponse {
  id: string;
  role: string;
  tenantId: string;
  sedeId: string | null;
}

export interface MesAuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  operator: MesOperatorResponse;
}

export interface MesMeResponse {
  id: string;
  role: string;
  tenantId: string;
  sedeId: string | null;
}

export interface MessageResponse {
  message: string;
}

/** Mirrors GET /api/auth/me response (apps/api AuthUserProfile) */
export interface GlobalUserMeResponse {
  id: string;
  tenantId: string;
  email: string;
  cedula: string;
  documentType: string;
  emailVerified: boolean;
  isActive: boolean;
  roleCode: string;
  createdAt: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResendVerificationRequest {
  email: string;
}

interface NestJsErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

const DEFAULT_API_BASE_URL = 'http://localhost:3001';

export function parseApiErrorMessage(body: unknown): string {
  if (!body || typeof body !== 'object') {
    return 'Request failed';
  }

  const record = body as NestJsErrorBody;
  const { message } = record;

  if (Array.isArray(message)) {
    return message[0] ?? record.error ?? 'Request failed';
  }

  if (typeof message === 'string' && message.length > 0) {
    return message;
  }

  if (typeof record.error === 'string' && record.error.length > 0) {
    return record.error;
  }

  return 'Request failed';
}

export function mapApiError(status: number, body: unknown): GraphQLError {
  const message = parseApiErrorMessage(body);

  switch (status) {
    case 400:
      return new ValidationError(message);
    case 401:
      return new AuthenticationError(message);
    case 403:
      return new AuthorizationError(message);
    case 404:
      return new GraphQLError(message, {
        extensions: { code: 'NOT_FOUND', http: { status: 404 } },
      });
    case 409:
      return new ConflictError(message);
    case 429:
      return new RateLimitError(message);
    default:
      if (status >= 500) {
        return new GraphQLError('Internal server error', {
          extensions: { code: 'INTERNAL_SERVER_ERROR', http: { status: 500 } },
        });
      }
      return new GraphQLError(message, {
        extensions: { code: 'BAD_REQUEST', http: { status } },
      });
  }
}

function buildForwardHeaders(ctx?: ApiRequestContext): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (ctx?.tenantId?.trim()) {
    headers['x-tenant-id'] = ctx.tenantId.trim();
  }

  if (ctx?.authorization?.trim()) {
    headers.Authorization = ctx.authorization.trim();
  }

  if (ctx?.userAgent?.trim()) {
    headers['user-agent'] = ctx.userAgent.trim();
  }

  if (ctx?.forwardedFor?.trim()) {
    headers['x-forwarded-for'] = ctx.forwardedFor.trim();
  }

  return headers;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetchFn: FetchFn;

  constructor(baseUrl: string = DEFAULT_API_BASE_URL, fetchFn: FetchFn = fetch) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.fetchFn = fetchFn;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async get<T>(path: string, ctx?: ApiRequestContext): Promise<T> {
    return this.request<T>('GET', path, undefined, ctx);
  }

  async post<T>(path: string, body: unknown | undefined, ctx?: ApiRequestContext): Promise<T> {
    return this.request<T>('POST', path, body, ctx);
  }

  // ─── Global auth (apps/api REST) ─────────────────────────────────────────

  authSignup(body: SignupRequest, ctx: ApiRequestContext): Promise<AuthTokensResponse> {
    return this.post<AuthTokensResponse>('/api/auth/signup', body, ctx);
  }

  authLogin(body: GlobalLoginRequest, ctx: ApiRequestContext): Promise<AuthTokensResponse> {
    return this.post<AuthTokensResponse>('/api/auth/login', body, ctx);
  }

  authLogout(ctx: ApiRequestContext): Promise<void> {
    return this.post<void>('/api/auth/logout', undefined, ctx);
  }

  authRefresh(ctx: ApiRequestContext): Promise<AuthTokensResponse> {
    return this.post<AuthTokensResponse>('/api/auth/refresh', undefined, ctx);
  }

  authVerifyEmail(body: VerifyEmailRequest): Promise<MessageResponse> {
    return this.post<MessageResponse>('/api/auth/verify-email', body);
  }

  authMe(ctx: ApiRequestContext): Promise<GlobalUserMeResponse> {
    return this.get<GlobalUserMeResponse>('/api/auth/me', ctx);
  }

  authChangePassword(
    body: ChangePasswordRequest,
    ctx: ApiRequestContext,
  ): Promise<MessageResponse> {
    return this.post<MessageResponse>('/api/auth/change-password', body, ctx);
  }

  authForgotPassword(
    body: ForgotPasswordRequest,
    ctx: ApiRequestContext,
  ): Promise<MessageResponse> {
    return this.post<MessageResponse>('/api/auth/forgot-password', body, ctx);
  }

  authResetPassword(body: ResetPasswordRequest): Promise<MessageResponse> {
    return this.post<MessageResponse>('/api/auth/reset-password', body);
  }

  authResendVerification(
    body: ResendVerificationRequest,
    ctx: ApiRequestContext,
  ): Promise<MessageResponse> {
    return this.post<MessageResponse>('/api/auth/resend-verification', body, ctx);
  }

  // ─── Operational auth (apps/api MES REST) ────────────────────────────────

  mesAuthLogin(body: MesLoginRequest, ctx: ApiRequestContext): Promise<MesAuthTokensResponse> {
    return this.post<MesAuthTokensResponse>('/api/mes/auth/login', body, ctx);
  }

  mesAuthMe(ctx: ApiRequestContext): Promise<MesMeResponse> {
    return this.get<MesMeResponse>('/api/mes/auth/me', ctx);
  }

  mesAuthLogout(ctx: ApiRequestContext): Promise<MessageResponse> {
    return this.post<MessageResponse>('/api/mes/auth/logout', undefined, ctx);
  }

  private buildUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body: unknown | undefined,
    ctx?: ApiRequestContext,
  ): Promise<T> {
    const init: RequestInit = {
      method,
      headers: buildForwardHeaders(ctx),
    };

    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    const response = await this.fetchFn(this.buildUrl(path), init);
    const responseBody = await this.parseJsonBody(response);

    if (!response.ok) {
      throw mapApiError(response.status, responseBody);
    }

    return (responseBody ?? undefined) as T;
  }

  private async parseJsonBody(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return null;
    }
  }
}

export { DEFAULT_API_BASE_URL };
