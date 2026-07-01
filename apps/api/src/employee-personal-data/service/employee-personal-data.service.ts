import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DocumentType } from '@prisma/client';
import { AuditService } from '../../audit/service/audit.service';
import { PAYROLL_MODULE_ROLES, PAYROLL_WRITE_ROLES } from '../../common/config/rbac.config';
import { StorageDomain, ImageProfile, StorageVisibility } from '../../storage/enums/storage.enums';
import { StorageService } from '../../storage/service/storage.service';
import type {
  EmployeePersonalDataView,
  IEmployeePersonalDataService,
  PersonalDataFieldKey,
  UpdateEmployeePersonalDataInput,
} from '../interfaces/employee-personal-data.interfaces';
import { EmployeePersonalDataRepository } from '../repository/employee-personal-data.repository';

const HR_ROLE_CODES = new Set<string>([...PAYROLL_WRITE_ROLES, 'NOMINA']);

const PUBLIC_STORAGE_DOMAIN = (): string => {
  const raw = process.env.R2_PUBLIC_DOMAIN ?? '';
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`;
};

const SELF_EDITABLE_FIELDS = new Set<PersonalDataFieldKey>([
  'telefono',
  'direccion',
  'barrio',
  'localidad',
  'contactoEmergenciaNombre',
  'contactoEmergenciaTelefono',
  'contactoEmergenciaParentesco',
  'profilePhotoStorageObjectId',
]);

@Injectable()
export class EmployeePersonalDataService implements IEmployeePersonalDataService {
  constructor(
    private readonly repository: EmployeePersonalDataRepository,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
  ) {}

  async getByUserId(
    tenantId: string,
    userId: string,
    actorUserId: string,
    actorRoleCode: string,
  ): Promise<EmployeePersonalDataView> {
    const employee = await this.requireEmployee(tenantId, userId);
    this.assertCanRead(actorUserId, actorRoleCode, userId);
    return this.toView(employee, actorRoleCode, actorUserId, userId);
  }

  async updateByUserId(
    tenantId: string,
    userId: string,
    actorUserId: string,
    actorRoleCode: string,
    input: UpdateEmployeePersonalDataInput,
  ): Promise<EmployeePersonalDataView> {
    const employee = await this.requireEmployee(tenantId, userId);
    this.assertCanRead(actorUserId, actorRoleCode, userId);
    this.validateInput(input);

    const editableFields = this.resolveEditableFields(actorRoleCode, actorUserId, userId);
    const forbidden = Object.keys(input).filter(
      (key) => !editableFields.has(key as PersonalDataFieldKey),
    );
    if (forbidden.length > 0) {
      throw new ForbiddenException(`Campos no permitidos: ${forbidden.join(', ')}`);
    }

    const before = await this.toView(employee, actorRoleCode, actorUserId, userId);
    const personalPatch: Record<string, unknown> = {};
    const changes: Array<{ field: string; previous: unknown; next: unknown }> = [];

    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      if (['tipoDocumento', 'numeroDocumento', 'correo', 'fechaNacimiento'].includes(key)) continue;
      personalPatch[key] = value === null ? null : value;
      const previous = (before as unknown as Record<string, unknown>)[key] ?? null;
      if (JSON.stringify(previous) !== JSON.stringify(value)) {
        changes.push({ field: key, previous, next: value });
      }
    }

    if (
      input.tipoDocumento !== undefined ||
      input.numeroDocumento !== undefined ||
      input.correo !== undefined
    ) {
      if (!HR_ROLE_CODES.has(actorRoleCode)) {
        throw new ForbiddenException('No puede modificar documento o correo');
      }
      const userUpdate: { cedula?: string; documentType?: DocumentType; email?: string } = {};
      if (input.numeroDocumento !== undefined) userUpdate.cedula = input.numeroDocumento;
      if (input.tipoDocumento !== undefined)
        userUpdate.documentType = input.tipoDocumento as DocumentType;
      if (input.correo !== undefined) userUpdate.email = input.correo.toLowerCase();
      await this.repository.updateUserIdentity(tenantId, userId, userUpdate as never);
      if (input.numeroDocumento !== undefined) {
        changes.push({
          field: 'numeroDocumento',
          previous: before.numeroDocumento,
          next: input.numeroDocumento,
        });
      }
      if (input.tipoDocumento !== undefined) {
        changes.push({
          field: 'tipoDocumento',
          previous: before.tipoDocumento,
          next: input.tipoDocumento,
        });
      }
      if (input.correo !== undefined) {
        changes.push({ field: 'correo', previous: before.correo, next: input.correo });
      }
    }

    if (input.fechaNacimiento !== undefined) {
      personalPatch.fechaNacimiento = input.fechaNacimiento
        ? new Date(`${input.fechaNacimiento}T00:00:00.000Z`)
        : null;
    }

    if (Object.keys(personalPatch).length > 0) {
      await this.repository.upsertPersonalData(tenantId, employee.id, personalPatch);
    }

    if (changes.length > 0) {
      await this.auditService.log({
        tenantId,
        action: 'UPDATE',
        entityType: 'EmployeePersonalData',
        entityId: employee.id,
        actorUserId,
        userId,
        payload: { changes },
        oldValue: before as unknown as Record<string, unknown>,
        newValue: input as Record<string, unknown>,
      });
    }

    const refreshed = await this.requireEmployee(tenantId, userId);
    return this.toView(refreshed, actorRoleCode, actorUserId, userId);
  }

  async uploadProfilePhoto(
    tenantId: string,
    userId: string,
    actorUserId: string,
    actorRoleCode: string,
    file: Express.Multer.File,
  ): Promise<{ storageObjectId: string; profilePhotoUrl: string | null }> {
    const employee = await this.requireEmployee(tenantId, userId);
    this.assertCanRead(actorUserId, actorRoleCode, userId);
    const editableFields = this.resolveEditableFields(actorRoleCode, actorUserId, userId);
    if (!editableFields.has('profilePhotoStorageObjectId')) {
      throw new ForbiddenException('No puede actualizar la foto de perfil');
    }

    const allowed = new Set(['image/jpeg', 'image/png', 'image/jpg']);
    if (!allowed.has(file.mimetype)) {
      throw new BadRequestException('Formato no permitido. Use JPG o PNG.');
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('Tamaño máximo 2MB');
    }

    const uploaded = await this.storageService.uploadFile({
      tenantId,
      uploadedBy: actorUserId,
      domain: StorageDomain.USERS,
      imageProfile: ImageProfile.AVATAR,
      entityType: 'employee_profile_photo',
      entityId: employee.id,
      visibility: StorageVisibility.PRIVATE,
      file: {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size,
      },
    });

    await this.repository.upsertPersonalData(tenantId, employee.id, {
      profilePhotoStorageObjectId: uploaded.id,
    });

    let profilePhotoUrl: string | null = uploaded.publicUrl;
    try {
      profilePhotoUrl = await this.storageService.getPresignedUrl(uploaded.id, tenantId, 900);
    } catch {
      profilePhotoUrl = uploaded.publicUrl;
    }

    return { storageObjectId: uploaded.id, profilePhotoUrl };
  }

  private async requireEmployee(tenantId: string, userId: string) {
    const employee = await this.repository.findEmployeeByUserId(userId, tenantId);
    if (!employee) {
      throw new NotFoundException(`Empleado ${userId} no encontrado`);
    }
    return employee;
  }

  private assertCanRead(actorUserId: string, actorRoleCode: string, targetUserId: string) {
    const payrollAccess = (PAYROLL_MODULE_ROLES as readonly string[]).includes(actorRoleCode);
    if (!payrollAccess && actorUserId !== targetUserId) {
      throw new ForbiddenException('Acceso denegado');
    }
  }

  private resolveEditableFields(
    actorRoleCode: string,
    actorUserId: string,
    targetUserId: string,
  ): Set<PersonalDataFieldKey> {
    if (HR_ROLE_CODES.has(actorRoleCode)) {
      return new Set<PersonalDataFieldKey>([
        'tipoDocumento',
        'numeroDocumento',
        'nombres',
        'primerApellido',
        'segundoApellido',
        'fechaNacimiento',
        'estadoCivil',
        'sexo',
        'departamento',
        'ciudad',
        'localidad',
        'barrio',
        'direccion',
        'telefono',
        'correo',
        'contactoEmergenciaNombre',
        'contactoEmergenciaTelefono',
        'contactoEmergenciaParentesco',
        'profilePhotoStorageObjectId',
      ]);
    }
    if (actorUserId === targetUserId) {
      return new Set(SELF_EDITABLE_FIELDS);
    }
    throw new ForbiddenException('Acceso denegado');
  }

  private validateInput(input: UpdateEmployeePersonalDataInput) {
    if (input.numeroDocumento !== undefined && !/^\d{1,15}$/.test(input.numeroDocumento)) {
      throw new BadRequestException('Número de documento inválido');
    }
    if (
      input.telefono !== undefined &&
      input.telefono !== '' &&
      !/^\d{7,15}$/.test(input.telefono)
    ) {
      throw new BadRequestException('Teléfono inválido');
    }
    if (
      input.contactoEmergenciaTelefono !== undefined &&
      input.contactoEmergenciaTelefono !== '' &&
      !/^\d{7,15}$/.test(input.contactoEmergenciaTelefono)
    ) {
      throw new BadRequestException('Teléfono de contacto de emergencia inválido');
    }
    if (input.correo !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.correo)) {
      throw new BadRequestException('Correo inválido');
    }
    if (input.fechaNacimiento !== undefined && input.fechaNacimiento) {
      const birth = new Date(`${input.fechaNacimiento}T00:00:00.000Z`);
      const now = new Date();
      if (birth > now) {
        throw new BadRequestException('Fecha de nacimiento no puede ser futura');
      }
      const age =
        now.getUTCFullYear() -
        birth.getUTCFullYear() -
        (now < new Date(Date.UTC(now.getUTCFullYear(), birth.getUTCMonth(), birth.getUTCDate()))
          ? 1
          : 0);
      if (age < 15) {
        throw new BadRequestException('El colaborador debe tener al menos 15 años');
      }
    }
  }

  private splitName(fullName: string): {
    nombres: string | null;
    primerApellido: string | null;
    segundoApellido: string | null;
  } {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { nombres: null, primerApellido: null, segundoApellido: null };
    if (parts.length === 1)
      return { nombres: parts[0]!, primerApellido: null, segundoApellido: null };
    if (parts.length === 2)
      return { nombres: parts[0]!, primerApellido: parts[1]!, segundoApellido: null };
    return {
      nombres: parts.slice(0, -2).join(' '),
      primerApellido: parts.at(-2) ?? null,
      segundoApellido: parts.at(-1) ?? null,
    };
  }

  private async toView(
    employee: Awaited<ReturnType<EmployeePersonalDataRepository['findEmployeeByUserId']>> & object,
    actorRoleCode: string,
    actorUserId: string,
    targetUserId: string,
  ): Promise<EmployeePersonalDataView> {
    const split = this.splitName(employee.name);
    const personal = employee.personalData;
    const profilePhotoStorageObjectId =
      personal?.profilePhotoStorageObjectId ?? employee.photoStorageObjectId ?? null;
    const profilePhotoUrl = await this.resolveProfilePhotoUrl(
      employee,
      personal?.profilePhotoStorageObjectId ?? null,
    );

    const editableFields = Array.from(
      this.resolveEditableFields(actorRoleCode, actorUserId, targetUserId),
    );

    return {
      employeeDetailsId: employee.id,
      userId: employee.userId,
      tipoDocumento: employee.user.documentType,
      numeroDocumento: employee.user.cedula,
      nombres: personal?.nombres ?? split.nombres,
      primerApellido: personal?.primerApellido ?? split.primerApellido,
      segundoApellido: personal?.segundoApellido ?? split.segundoApellido,
      fechaNacimiento: personal?.fechaNacimiento
        ? personal.fechaNacimiento.toISOString().slice(0, 10)
        : null,
      estadoCivil: personal?.estadoCivil ?? null,
      sexo: personal?.sexo ?? null,
      departamento: personal?.departamento ?? null,
      ciudad: personal?.ciudad ?? null,
      localidad: personal?.localidad ?? null,
      barrio: personal?.barrio ?? null,
      direccion: personal?.direccion ?? null,
      telefono: personal?.telefono ?? null,
      correo: employee.user.email,
      contactoEmergenciaNombre: personal?.contactoEmergenciaNombre ?? null,
      contactoEmergenciaTelefono: personal?.contactoEmergenciaTelefono ?? null,
      contactoEmergenciaParentesco: personal?.contactoEmergenciaParentesco ?? null,
      profilePhotoStorageObjectId,
      profilePhotoUrl,
      editableFields,
    };
  }

  private async resolveProfilePhotoUrl(
    employee: {
      tenantId: string;
      photoStorageObjectId?: string | null;
      photoStorageObject?: { key: string } | null;
    },
    personalPhotoStorageObjectId: string | null,
  ): Promise<string | null> {
    if (personalPhotoStorageObjectId) {
      try {
        return await this.storageService.getPresignedUrl(
          personalPhotoStorageObjectId,
          employee.tenantId,
          900,
        );
      } catch {
        return null;
      }
    }

    if (employee.photoStorageObject?.key) {
      const domain = PUBLIC_STORAGE_DOMAIN();
      return domain ? `${domain}/${employee.photoStorageObject.key}` : null;
    }

    if (!employee.photoStorageObjectId) {
      return null;
    }

    try {
      return await this.storageService.getPresignedUrl(
        employee.photoStorageObjectId,
        employee.tenantId,
        900,
      );
    } catch {
      return null;
    }
  }
}
