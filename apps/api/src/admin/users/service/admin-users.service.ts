import * as crypto from 'crypto';

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { DocumentType } from '@prisma/client';
import { EmailService } from '@restopsiq/email';
import * as bcrypt from 'bcrypt';

import type {
  AdminUserDetail,
  AdminUserListItem,
  IAdminUsersService,
  UpdateAdminUserData,
  UserPermissionOverrideInput,
} from '../interfaces/admin-users.interfaces';
import { AdminUsersRepository } from '../repository/admin-users.repository';

const SALT_ROUNDS = 10;
const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';
const TENANT_NAME = process.env.TENANT_NAME ?? 'RestopsIQ';

@Injectable()
export class AdminUsersService implements IAdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    private readonly repo: AdminUsersRepository,
    private readonly emailService: EmailService,
  ) {}

  findAll(tenantId: string, includeInactive = false): Promise<AdminUserListItem[]> {
    return this.repo.findAll(tenantId, includeInactive);
  }

  async findById(tenantId: string, userId: string): Promise<AdminUserDetail> {
    const user = await this.repo.findById(tenantId, userId);
    if (!user) {
      throw new NotFoundException(`User "${userId}" not found`);
    }
    return user;
  }

  async createUser(
    tenantId: string,
    data: {
      name: string;
      cedula: string;
      documentType: DocumentType;
      email: string;
      roleId: string;
    },
    requesterId: string,
  ): Promise<AdminUserListItem> {
    const [byEmail, byCedula] = await Promise.all([
      this.repo.findByEmail(tenantId, data.email),
      this.repo.findByCedula(tenantId, data.cedula),
    ]);

    if (byEmail) {
      throw new ConflictException('Email already registered in this tenant');
    }
    if (byCedula) {
      throw new ConflictException('Cédula already registered in this tenant');
    }

    const temporaryPassword = crypto.randomBytes(9).toString('base64url');
    const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);

    const user = await this.repo.createWithEmployeeDetails(tenantId, {
      ...data,
      passwordHash,
      createdBy: requesterId,
    });

    this.sendWelcomeEmail(user.email, user.role.name, temporaryPassword, tenantId).catch(
      (err: unknown) => {
        this.logger.warn(
          `[admin-users] Welcome email failed for userId="${user.id}": ${String(err)}`,
        );
      },
    );

    return user;
  }

  async updateUser(
    tenantId: string,
    userId: string,
    data: UpdateAdminUserData,
    requesterId: string,
  ): Promise<AdminUserListItem> {
    if (data.roleId !== undefined && userId === requesterId) {
      throw new ForbiddenException('Cannot change your own role');
    }

    const existing = await this.repo.findById(tenantId, userId);
    if (!existing) {
      throw new NotFoundException(`User "${userId}" not found`);
    }

    return this.repo.update(tenantId, userId, data);
  }

  async deactivateUser(tenantId: string, userId: string, requesterId: string): Promise<void> {
    if (userId === requesterId) {
      throw new ForbiddenException('Cannot deactivate your own account');
    }

    const existing = await this.repo.findById(tenantId, userId);
    if (!existing) {
      throw new NotFoundException(`User "${userId}" not found`);
    }

    await this.repo.deactivate(tenantId, userId);
  }

  async assignUserPermissions(
    tenantId: string,
    userId: string,
    overrides: UserPermissionOverrideInput[],
  ): Promise<void> {
    const existing = await this.repo.findById(tenantId, userId);
    if (!existing) {
      throw new NotFoundException(`User "${userId}" not found`);
    }

    await this.repo.setUserPermissionOverrides(userId, overrides);
  }

  private async sendWelcomeEmail(
    email: string,
    roleName: string,
    temporaryPassword: string,
    tenantId: string,
  ): Promise<void> {
    const roleMap: Record<string, 'owner' | 'manager' | 'cashier' | 'accountant'> = {
      OWNER: 'owner',
      MANAGER: 'manager',
      SUPERVISOR: 'manager',
    };
    const mappedRole = roleMap[roleName.toUpperCase()] ?? 'cashier';

    await this.emailService.send({
      to: email,
      subject: `Bienvenido a ${TENANT_NAME}`,
      tenantId,
      tenantName: TENANT_NAME,
      template: {
        type: 'welcome',
        props: {
          userName: email,
          role: mappedRole,
          loginUrl: `${APP_URL}/login`,
          temporaryPassword,
        },
      },
    });
  }
}
