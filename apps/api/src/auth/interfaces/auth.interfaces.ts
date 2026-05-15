import type { User } from '@prisma/client';
import type { SignupDto } from '../controller/dto/signup.dto';
import type { LoginDto } from '../controller/dto/login.dto';

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  createUser(data: { email: string; name: string; passwordHash: string }): Promise<User>;
  saveRefreshToken(userId: string, hashedToken: string | null): Promise<void>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface IAuthService {
  signup(dto: SignupDto): Promise<AuthTokens>;
  login(dto: LoginDto): Promise<AuthTokens>;
  refresh(userId: string, refreshToken: string): Promise<AuthTokens>;
  logout(userId: string): Promise<void>;
}
