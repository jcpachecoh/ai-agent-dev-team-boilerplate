import * as crypto from 'crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { DocumentType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { AuthEmailService } from '../../../auth/service/auth-email.service';
import type {
  AdminUserDetail,
  AdminUserListItem,
  IAdminUsersService,
  UpdateAdminUserData,
  UserPermissionOverrideInput,
} from '../interfaces/admin-users.interfaces';
import { AdminUsersRepository } from '../repository/admin-users.repository';

const PIN_PATTERN = /^\d{4,6}$/;
const SALT_ROUNDS = 10;
const TENANT_NAME = process.env.TENANT_NAME ?? 'RestopsIQ';

@Injectable()
export class AdminUsersService implements IAdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    private readonly repo: AdminUsersRepository,
    private readonly authEmailService: AuthEmailService,
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
      locationId?: string;
      password?: string;
    },
    requesterId: string,
  ): Promise<AdminUserListItem> {
    const [byEmail, byCedula] = await Promise.all([
      this.repo.findByEmail(tenantId, data.email),
      this.repo.findByCedula(tenantId, data.cedula),
    ]);

    if (byEmail && byCedula && byEmail.id !== byCedula.id) {
      throw new ConflictException('Email and cédula belong to different users in this tenant');
    }

    const existingUserId = byEmail?.id ?? byCedula?.id;
    const roleCode = await this.repo.findRoleCode(data.roleId);

    if (roleCode === 'OPERATOR' && !data.locationId?.trim()) {
      throw new Error('locationId is required for OPERATOR users');
    }

    const temporaryPassword = this.resolveTemporaryPassword(roleCode, data.password);
    const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);

    let operationalUser: { cedulaHash: string; pinHash: string } | undefined;
    if (roleCode === 'OPERATOR') {
      const [cedulaHash, pinHash] = await Promise.all([
        Promise.resolve(this.hashCedula(data.cedula)),
        bcrypt.hash(temporaryPassword, SALT_ROUNDS),
      ]);
      operationalUser = { cedulaHash, pinHash };
    }

    const provisioningPayload = {
      ...data,
      locationId: data.locationId?.trim(),
      passwordHash,
      createdBy: requesterId,
      operationalUser,
    };

    let user: AdminUserListItem;

    if (existingUserId) {
      const context = await this.repo.findEmployeeProvisioningContext(tenantId, existingUserId);
      if (!context) {
        throw new ConflictException(
          byEmail
            ? 'Email already registered in this tenant'
            : 'Cédula already registered in this tenant',
        );
      }
      if (context.createdBy) {
        throw new ConflictException('This employee already has an access account configured');
      }
      if (context.email !== data.email || context.cedula !== data.cedula) {
        throw new ConflictException(
          byEmail
            ? 'Email already registered in this tenant'
            : 'Cédula already registered in this tenant',
        );
      }

      user = await this.repo.completeEmployeeUserProvisioning(
        tenantId,
        existingUserId,
        provisioningPayload,
      );
    } else {
      user = await this.repo.createWithEmployeeDetails(tenantId, provisioningPayload);
    }

    this.authEmailService
      .sendAccountConfirmation(
        { id: user.id, email: user.email, name: user.name },
        { tenantId, tenantName: TENANT_NAME },
      )
      .catch((err: unknown) => {
        this.logger.warn(
          `[admin-users] Account confirmation email failed for userId="${user.id}": ${String(err)}`,
        );
      });

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

  private resolveTemporaryPassword(roleCode: string | null, password?: string): string {
    const trimmed = password?.trim();

    if (roleCode === 'OPERATOR') {
      const operatorTempPassword = trimmed || process.env.OPERATOR_TEMP_PASSWORD;
      if (!operatorTempPassword) {
        throw new Error('OPERATOR_TEMP_PASSWORD is not set');
      }
      if (!PIN_PATTERN.test(operatorTempPassword)) {
        throw new BadRequestException(
          'La contraseña del operador debe ser un PIN de 4 a 6 dígitos',
        );
      }
      return operatorTempPassword;
    }

    if (trimmed) {
      if (trimmed.length < 8) {
        throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');
      }
      return trimmed;
    }

    return crypto.randomBytes(9).toString('base64url');
  }

  private hashCedula(cedula: string): string {
    const hmacSecret = process.env.CEDULA_HMAC_SECRET;
    if (hmacSecret) {
      return crypto.createHmac('sha256', hmacSecret).update(cedula).digest('hex');
    }
    return crypto.createHash('sha256').update(cedula).digest('hex');
  }
}
