import { builder } from '../builder';

// ─── Enums ───────────────────────────────────────────────────────────────────

/** Mirrors apps/api Prisma DocumentType enum */
export const DOCUMENT_TYPE_VALUES = ['CC', 'CE', 'PASAPORTE', 'TI', 'PEP'] as const;
export type DocumentTypeValue = (typeof DOCUMENT_TYPE_VALUES)[number];

export const DocumentTypeEnum = builder.enumType('DocumentType', {
  description: 'Colombian identity document type',
  values: DOCUMENT_TYPE_VALUES,
});

// ─── Output type shapes (safe — no secrets) ──────────────────────────────────

export interface GlobalAuthTokensShape {
  accessToken: string;
  refreshToken: string;
}

export interface GlobalUserShape {
  id: string;
  tenantId: string;
  email: string;
  cedula: string;
  documentType: DocumentTypeValue;
  emailVerified: boolean;
  isActive: boolean;
  roleCode: string;
  createdAt: Date;
}

export interface OperationalUserShape {
  id: string;
  role: string;
  tenantId: string;
  sedeId: string | null;
  cedula?: string | null;
  isActive?: boolean;
  lastLoginAt?: Date | null;
  createdAt?: Date;
}

export interface OperationalAuthTokensShape {
  accessToken: string;
  refreshToken: string;
  operator: OperationalUserShape;
}

export interface MessagePayloadShape {
  message: string;
}

// ─── Output object types ─────────────────────────────────────────────────────

export const GlobalAuthTokensObject = builder.objectRef<GlobalAuthTokensShape>('GlobalAuthTokens');

GlobalAuthTokensObject.implement({
  description: 'Global User auth tokens returned by signup, login, and refresh',
  fields: (t) => ({
    accessToken: t.exposeString('accessToken'),
    refreshToken: t.exposeString('refreshToken'),
  }),
});

export const GlobalUserObject = builder.objectRef<GlobalUserShape>('GlobalUser');

GlobalUserObject.implement({
  description: 'Global User profile (email/password auth) — no password or token fields',
  fields: (t) => ({
    id: t.exposeID('id'),
    tenantId: t.exposeString('tenantId'),
    email: t.exposeString('email'),
    cedula: t.exposeString('cedula'),
    documentType: t.field({
      type: DocumentTypeEnum,
      resolve: (user) => user.documentType as DocumentTypeValue,
    }),
    emailVerified: t.exposeBoolean('emailVerified'),
    isActive: t.exposeBoolean('isActive'),
    roleCode: t.exposeString('roleCode'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

export const OperationalUserObject = builder.objectRef<OperationalUserShape>('OperationalUser');

OperationalUserObject.implement({
  description: 'Operational MES user profile — no pinHash, cedulaHash, or stored refreshToken',
  fields: (t) => ({
    id: t.exposeID('id'),
    role: t.exposeString('role'),
    tenantId: t.exposeString('tenantId'),
    sedeId: t.exposeString('sedeId', { nullable: true }),
    cedula: t.exposeString('cedula', {
      nullable: true,
      description: 'Masked cédula when provided by login response',
    }),
    isActive: t.exposeBoolean('isActive', { nullable: true }),
    lastLoginAt: t.expose('lastLoginAt', { type: 'DateTime', nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime', nullable: true }),
  }),
});

export const OperationalAuthTokensObject =
  builder.objectRef<OperationalAuthTokensShape>('OperationalAuthTokens');

OperationalAuthTokensObject.implement({
  description: 'Operational MES auth tokens including operator profile',
  fields: (t) => ({
    accessToken: t.exposeString('accessToken'),
    refreshToken: t.exposeString('refreshToken'),
    operator: t.field({
      type: OperationalUserObject,
      resolve: (tokens) => tokens.operator,
    }),
  }),
});

export const MessagePayloadObject = builder.objectRef<MessagePayloadShape>('MessagePayload');

MessagePayloadObject.implement({
  description:
    'Simple message response for email/auth flows (verifyEmail, changePassword, forgotPassword, resetPassword, resendVerification)',
  fields: (t) => ({
    message: t.exposeString('message'),
  }),
});

// ─── Input types ─────────────────────────────────────────────────────────────

export const SignupInput = builder.inputType('SignupInput', {
  description: 'Register a new global User within a tenant',
  fields: (t) => ({
    email: t.string({ required: true }),
    password: t.string({ required: true }),
    cedula: t.string({ required: true }),
    documentType: t.field({ type: DocumentTypeEnum, required: true }),
    roleCode: t.string({ required: false }),
  }),
});

export const GlobalLoginInput = builder.inputType('GlobalLoginInput', {
  description: 'Authenticate a global User with email and password',
  fields: (t) => ({
    email: t.string({ required: true }),
    password: t.string({ required: true }),
  }),
});

/**
 * Global refresh accepts the refresh token via Authorization header in REST.
 * Optional body field for clients that prefer passing refreshToken explicitly.
 */
export const RefreshTokenInput = builder.inputType('RefreshTokenInput', {
  description:
    'Optional refresh token payload — REST delegate may use Authorization header instead',
  fields: (t) => ({
    refreshToken: t.string({ required: false }),
  }),
});

export const VerifyEmailInput = builder.inputType('VerifyEmailInput', {
  description: 'Verify email with a 6-digit OTP code',
  fields: (t) => ({
    otpCode: t.string({ required: true }),
  }),
});

export const ChangePasswordInput = builder.inputType('ChangePasswordInput', {
  description: 'Change password for the authenticated global User',
  fields: (t) => ({
    currentPassword: t.string({ required: true }),
    newPassword: t.string({ required: true }),
  }),
});

export const ForgotPasswordInput = builder.inputType('ForgotPasswordInput', {
  description: 'Request a password reset email (tenant via x-tenant-id header)',
  fields: (t) => ({
    email: t.string({ required: true }),
  }),
});

export const ResetPasswordInput = builder.inputType('ResetPasswordInput', {
  description:
    'Reset password using a single-use token from the reset email (maps to REST token field)',
  fields: (t) => ({
    token: t.string({ required: true }),
    newPassword: t.string({ required: true }),
  }),
});

export const ResendVerificationInput = builder.inputType('ResendVerificationInput', {
  description: 'Resend email verification OTP (tenant via x-tenant-id header)',
  fields: (t) => ({
    email: t.string({ required: true }),
  }),
});

export const OperationalLoginInput = builder.inputType('OperationalLoginInput', {
  description:
    'Authenticate an operational user with cédula and PIN (tenant via x-tenant-id header)',
  fields: (t) => ({
    cedula: t.string({ required: true }),
    pin: t.string({ required: true }),
  }),
});

// ─── Schema registry (types-only — keeps auth types reachable for introspection) ─

interface AuthSchemaRegistryShape {
  globalAuthTokens: GlobalAuthTokensShape | null;
  globalUser: GlobalUserShape | null;
  operationalAuthTokens: OperationalAuthTokensShape | null;
  operationalUser: OperationalUserShape | null;
  messagePayload: MessagePayloadShape | null;
}

const AuthSchemaRegistryObject = builder.objectRef<AuthSchemaRegistryShape>('AuthSchemaRegistry');

AuthSchemaRegistryObject.implement({
  description: 'Internal registry of AUTH-02 auth output types',
  fields: (t) => ({
    globalAuthTokens: t.field({
      type: GlobalAuthTokensObject,
      nullable: true,
      resolve: (parent) => parent.globalAuthTokens,
    }),
    globalUser: t.field({
      type: GlobalUserObject,
      nullable: true,
      resolve: (parent) => parent.globalUser,
    }),
    operationalAuthTokens: t.field({
      type: OperationalAuthTokensObject,
      nullable: true,
      resolve: (parent) => parent.operationalAuthTokens,
    }),
    operationalUser: t.field({
      type: OperationalUserObject,
      nullable: true,
      resolve: (parent) => parent.operationalUser,
    }),
    messagePayload: t.field({
      type: MessagePayloadObject,
      nullable: true,
      resolve: (parent) => parent.messagePayload,
    }),
  }),
});

builder.queryField('_authSchemaRegistry', (t) =>
  t.field({
    type: AuthSchemaRegistryObject,
    nullable: true,
    description:
      'Internal: registers AUTH-02 output types in the GraphQL schema. Not for client use.',
    resolve: () => null,
  }),
);

builder.queryField('_authInputTypes', (t) =>
  t.field({
    type: 'String',
    nullable: true,
    description:
      'Internal: registers AUTH-02 input types in the GraphQL schema. Not for client use.',
    args: {
      signup: t.arg({ type: SignupInput, required: false }),
      globalLogin: t.arg({ type: GlobalLoginInput, required: false }),
      refreshToken: t.arg({ type: RefreshTokenInput, required: false }),
      verifyEmail: t.arg({ type: VerifyEmailInput, required: false }),
      changePassword: t.arg({ type: ChangePasswordInput, required: false }),
      forgotPassword: t.arg({ type: ForgotPasswordInput, required: false }),
      resetPassword: t.arg({ type: ResetPasswordInput, required: false }),
      resendVerification: t.arg({ type: ResendVerificationInput, required: false }),
      operationalLogin: t.arg({ type: OperationalLoginInput, required: false }),
    },
    resolve: () => null,
  }),
);
