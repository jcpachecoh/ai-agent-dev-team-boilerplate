import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { AuthTokens, IAuthService, JwtPayload } from '../interfaces/auth.interfaces';
import { AuthRepository } from '../repository/auth.repository';
import type { SignupDto } from '../controller/dto/signup.dto';
import type { LoginDto } from '../controller/dto/login.dto';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthTokens> {
    const existing = await this.authRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.authRepository.createUser({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });
    return this.issueTokens(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.authRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user.id, user.email);
  }

  async refresh(userId: string, refreshToken: string): Promise<AuthTokens> {
    const user = await this.authRepository.findById(userId);
    if (!user?.refreshToken) {
      throw new ForbiddenException('Access denied');
    }
    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatch) {
      throw new ForbiddenException('Access denied');
    }
    return this.issueTokens(user.id, user.email);
  }

  async logout(userId: string): Promise<void> {
    await this.authRepository.saveRefreshToken(userId, null);
  }

  private async issueTokens(userId: string, email: string): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: ACCESS_TOKEN_TTL }),
      this.jwtService.signAsync(payload, {
        expiresIn: REFRESH_TOKEN_TTL,
        secret: process.env.JWT_REFRESH_SECRET,
      }),
    ]);
    const hashedRefresh = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await this.authRepository.saveRefreshToken(userId, hashedRefresh);
    return { accessToken, refreshToken };
  }
}
