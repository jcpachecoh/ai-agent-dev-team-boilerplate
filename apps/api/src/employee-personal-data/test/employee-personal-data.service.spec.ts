import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../../audit/service/audit.service';
import { StorageService } from '../../storage/service/storage.service';
import { DataConsentService } from '../../data-consent/service/data-consent.service';
import { EmployeePersonalDataRepository } from '../repository/employee-personal-data.repository';
import { EmployeePersonalDataService } from '../service/employee-personal-data.service';

describe('EmployeePersonalDataService', () => {
  let service: EmployeePersonalDataService;
  let repo: jest.Mocked<EmployeePersonalDataRepository>;
  let audit: jest.Mocked<AuditService>;
  let storage: jest.Mocked<StorageService>;

  const employee = {
    id: 'emp-1',
    userId: 'user-1',
    tenantId: 'tenant-1',
    name: 'Ana María López Ruiz',
    photoStorageObjectId: null,
    photoStorageObject: null,
    user: {
      id: 'user-1',
      tenantId: 'tenant-1',
      cedula: '1234567890',
      documentType: 'CC',
      email: 'ana@test.com',
    },
    personalData: {
      id: 'pd-1',
      tenantId: 'tenant-1',
      employeeDetailsId: 'emp-1',
      nombres: 'Ana',
      primerApellido: 'López',
      segundoApellido: 'Ruiz',
      fechaNacimiento: new Date('1990-01-15T00:00:00.000Z'),
      estadoCivil: 'SOLTERO',
      sexo: 'FEMENINO',
      departamento: '11',
      ciudad: 'Bogotá',
      localidad: null,
      barrio: null,
      direccion: null,
      telefono: '3001234567',
      contactoEmergenciaNombre: null,
      contactoEmergenciaTelefono: null,
      contactoEmergenciaParentesco: null,
      profilePhotoStorageObjectId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeePersonalDataService,
        {
          provide: EmployeePersonalDataRepository,
          useValue: {
            findEmployeeByUserId: jest.fn(),
            upsertPersonalData: jest.fn(),
            updateUserIdentity: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
        {
          provide: StorageService,
          useValue: {
            getPresignedUrl: jest.fn(),
            uploadFile: jest.fn(),
          },
        },
        {
          provide: DataConsentService,
          useValue: { assertConsentForFeature: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(EmployeePersonalDataService);
    repo = module.get(EmployeePersonalDataRepository);
    audit = module.get(AuditService);
    storage = module.get(StorageService);
  });

  it('rechaza actualización de campos HR cuando el actor es el mismo empleado', async () => {
    repo.findEmployeeByUserId.mockResolvedValue(employee as never);

    await expect(
      service.updateByUserId('tenant-1', 'user-1', 'user-1', 'OPERATOR', {
        nombres: 'Nuevo nombre',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('expone profilePhotoUrl desde EmployeeDetails cuando no hay foto en datos personales', async () => {
    const previousDomain = process.env.R2_PUBLIC_DOMAIN;
    process.env.R2_PUBLIC_DOMAIN = 'https://cdn.example.com';

    try {
      repo.findEmployeeByUserId.mockResolvedValue({
        ...employee,
        photoStorageObjectId: 'storage-1',
        photoStorageObject: {
          id: 'storage-1',
          key: 'avatars/emp.jpg',
          visibility: 'PUBLIC',
          status: 'READY',
          deletedAt: null,
        },
      } as never);

      const view = await service.getByUserId('tenant-1', 'user-1', 'user-1', 'NOMINA');

      expect(view.profilePhotoStorageObjectId).toBe('storage-1');
      expect(view.profilePhotoUrl).toBe('https://cdn.example.com/avatars/emp.jpg');
    } finally {
      if (previousDomain === undefined) {
        delete process.env.R2_PUBLIC_DOMAIN;
      } else {
        process.env.R2_PUBLIC_DOMAIN = previousDomain;
      }
    }
  });

  it('lanza NotFoundException si el empleado no existe', async () => {
    repo.findEmployeeByUserId.mockResolvedValue(null);

    await expect(
      service.getByUserId('tenant-1', 'missing', 'user-1', 'NOMINA'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza lectura cuando el actor no tiene acceso a nómina ni es el mismo usuario', async () => {
    repo.findEmployeeByUserId.mockResolvedValue(employee as never);

    await expect(
      service.getByUserId('tenant-1', 'user-2', 'user-1', 'OPERATOR'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('permite al empleado actualizar su teléfono y audita el cambio', async () => {
    repo.findEmployeeByUserId.mockResolvedValue(employee as never);
    repo.upsertPersonalData.mockResolvedValue(employee.personalData as never);

    const view = await service.updateByUserId('tenant-1', 'user-1', 'user-1', 'OPERATOR', {
      telefono: '3109876543',
    });

    expect(repo.upsertPersonalData).toHaveBeenCalledWith(
      'tenant-1',
      'emp-1',
      expect.objectContaining({ telefono: '3109876543' }),
    );
    expect(audit.log).toHaveBeenCalled();
    expect(view.telefono).toBe('3001234567');
  });

  it('permite a HR actualizar identidad y datos personales', async () => {
    repo.findEmployeeByUserId.mockResolvedValue(employee as never);
    repo.upsertPersonalData.mockResolvedValue(employee.personalData as never);
    repo.updateUserIdentity.mockResolvedValue(employee.user as never);

    await service.updateByUserId('tenant-1', 'user-1', 'hr-1', 'NOMINA', {
      nombres: 'Ana María',
      correo: 'Nueva@Mail.com',
      numeroDocumento: '9876543210',
      tipoDocumento: 'CC',
      fechaNacimiento: '1991-02-20',
    });

    expect(repo.updateUserIdentity).toHaveBeenCalledWith('tenant-1', 'user-1', {
      cedula: '9876543210',
      documentType: 'CC',
      email: 'nueva@mail.com',
    });
    expect(repo.upsertPersonalData).toHaveBeenCalledWith(
      'tenant-1',
      'emp-1',
      expect.objectContaining({
        nombres: 'Ana María',
        fechaNacimiento: new Date('1991-02-20T00:00:00.000Z'),
      }),
    );
    expect(audit.log).toHaveBeenCalled();
  });

  it('valida teléfono, correo y fecha de nacimiento', async () => {
    repo.findEmployeeByUserId.mockResolvedValue(employee as never);

    await expect(
      service.updateByUserId('tenant-1', 'user-1', 'user-1', 'OPERATOR', { telefono: '123' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.updateByUserId('tenant-1', 'user-1', 'hr-1', 'NOMINA', { correo: 'correo-invalido' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.updateByUserId('tenant-1', 'user-1', 'hr-1', 'NOMINA', {
        fechaNacimiento: '2099-01-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.updateByUserId('tenant-1', 'user-1', 'hr-1', 'NOMINA', {
        fechaNacimiento: '2020-01-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('resuelve foto personal con URL firmada y tolera fallo del storage', async () => {
    storage.getPresignedUrl.mockResolvedValueOnce('https://signed/personal.jpg');

    repo.findEmployeeByUserId.mockResolvedValue({
      ...employee,
      personalData: {
        ...employee.personalData,
        profilePhotoStorageObjectId: 'personal-photo',
      },
    } as never);

    const signed = await service.getByUserId('tenant-1', 'user-1', 'user-1', 'NOMINA');
    expect(signed.profilePhotoUrl).toBe('https://signed/personal.jpg');

    storage.getPresignedUrl.mockRejectedValueOnce(new Error('storage down'));
    const failed = await service.getByUserId('tenant-1', 'user-1', 'user-1', 'NOMINA');
    expect(failed.profilePhotoUrl).toBeNull();
  });

  it('sube foto de perfil y devuelve URL firmada', async () => {
    repo.findEmployeeByUserId.mockResolvedValue(employee as never);
    storage.uploadFile.mockResolvedValue({
      id: 'uploaded-1',
      publicUrl: 'https://public/photo.webp',
    } as never);
    storage.getPresignedUrl.mockResolvedValue('https://signed/photo.webp');

    const file = {
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('img'),
      originalname: 'foto.jpg',
    } as Express.Multer.File;

    const result = await service.uploadProfilePhoto(
      'tenant-1',
      'user-1',
      'user-1',
      'OPERATOR',
      file,
    );

    expect(repo.upsertPersonalData).toHaveBeenCalledWith('tenant-1', 'emp-1', {
      profilePhotoStorageObjectId: 'uploaded-1',
    });
    expect(result).toEqual({
      storageObjectId: 'uploaded-1',
      profilePhotoUrl: 'https://signed/photo.webp',
    });
  });

  it('rechaza subida de foto con formato o tamaño inválido', async () => {
    repo.findEmployeeByUserId.mockResolvedValue(employee as never);

    await expect(
      service.uploadProfilePhoto('tenant-1', 'user-1', 'user-1', 'OPERATOR', {
        mimetype: 'application/pdf',
        size: 100,
        buffer: Buffer.from('pdf'),
        originalname: 'doc.pdf',
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.uploadProfilePhoto('tenant-1', 'user-1', 'user-1', 'OPERATOR', {
        mimetype: 'image/jpeg',
        size: 3 * 1024 * 1024,
        buffer: Buffer.from('img'),
        originalname: 'big.jpg',
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza subida de foto cuando el actor no puede editarla', async () => {
    repo.findEmployeeByUserId.mockResolvedValue(employee as never);

    await expect(
      service.uploadProfilePhoto('tenant-1', 'user-2', 'user-1', 'OPERATOR', {
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('img'),
        originalname: 'foto.jpg',
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('divide el nombre del empleado cuando no hay datos personales guardados', async () => {
    repo.findEmployeeByUserId.mockResolvedValue({
      ...employee,
      name: 'Pedro',
      personalData: null,
    } as never);

    const view = await service.getByUserId('tenant-1', 'user-1', 'user-1', 'NOMINA');

    expect(view.nombres).toBe('Pedro');
    expect(view.primerApellido).toBeNull();
    expect(view.segundoApellido).toBeNull();
  });

  it('usa URL pública como fallback si falla la firma al subir foto', async () => {
    repo.findEmployeeByUserId.mockResolvedValue(employee as never);
    storage.uploadFile.mockResolvedValue({
      id: 'uploaded-2',
      publicUrl: 'https://public/fallback.webp',
    } as never);
    storage.getPresignedUrl.mockRejectedValue(new Error('sign failed'));

    const result = await service.uploadProfilePhoto('tenant-1', 'user-1', 'user-1', 'OPERATOR', {
      mimetype: 'image/png',
      size: 512,
      buffer: Buffer.from('img'),
      originalname: 'foto.png',
    } as Express.Multer.File);

    expect(result.profilePhotoUrl).toBe('https://public/fallback.webp');
  });

  it('resuelve foto del empleado por storageObjectId cuando no hay key pública', async () => {
    storage.getPresignedUrl.mockResolvedValue('https://signed/employee-only.webp');

    repo.findEmployeeByUserId.mockResolvedValue({
      ...employee,
      photoStorageObjectId: 'storage-only',
      photoStorageObject: null,
    } as never);

    const view = await service.getByUserId('tenant-1', 'user-1', 'user-1', 'NOMINA');

    expect(view.profilePhotoUrl).toBe('https://signed/employee-only.webp');
  });

  it('valida teléfono de contacto de emergencia inválido', async () => {
    repo.findEmployeeByUserId.mockResolvedValue(employee as never);

    await expect(
      service.updateByUserId('tenant-1', 'user-1', 'user-1', 'OPERATOR', {
        contactoEmergenciaTelefono: '12',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('permite limpiar la fecha de nacimiento', async () => {
    repo.findEmployeeByUserId.mockResolvedValue(employee as never);
    repo.upsertPersonalData.mockResolvedValue({
      ...employee.personalData,
      fechaNacimiento: null,
    } as never);

    await service.updateByUserId('tenant-1', 'user-1', 'hr-1', 'NOMINA', {
      fechaNacimiento: '',
    });

    expect(repo.upsertPersonalData).toHaveBeenCalledWith('tenant-1', 'emp-1', {
      fechaNacimiento: null,
    });
  });

  it('divide nombres de dos palabras y tolera fallo al firmar foto del empleado', async () => {
    storage.getPresignedUrl.mockRejectedValue(new Error('sign failed'));

    repo.findEmployeeByUserId.mockResolvedValue({
      ...employee,
      name: 'Ana López',
      personalData: null,
      photoStorageObjectId: 'storage-only',
      photoStorageObject: null,
    } as never);

    const view = await service.getByUserId('tenant-1', 'user-1', 'user-1', 'NOMINA');

    expect(view.nombres).toBe('Ana');
    expect(view.primerApellido).toBe('López');
    expect(view.profilePhotoUrl).toBeNull();
  });
});
