import type {
  EmployeePersonalData,
  Gender,
  MaritalStatus,
  StorageObject,
  User,
} from '@prisma/client';

export type PersonalDataFieldKey =
  | 'tipoDocumento'
  | 'numeroDocumento'
  | 'nombres'
  | 'primerNombre'
  | 'segundoNombre'
  | 'primerApellido'
  | 'segundoApellido'
  | 'fechaNacimiento'
  | 'estadoCivil'
  | 'sexo'
  | 'departamento'
  | 'ciudad'
  | 'localidad'
  | 'barrio'
  | 'direccion'
  | 'telefono'
  | 'correo'
  | 'contactoEmergenciaNombre'
  | 'contactoEmergenciaTelefono'
  | 'contactoEmergenciaParentesco'
  | 'profilePhotoStorageObjectId';

export interface EmployeePersonalDataView {
  employeeDetailsId: string;
  userId: string;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  nombres: string | null;
  primerNombre: string | null;
  segundoNombre: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
  fechaNacimiento: string | null;
  estadoCivil: MaritalStatus | null;
  sexo: Gender | null;
  departamento: string | null;
  ciudad: string | null;
  localidad: string | null;
  barrio: string | null;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
  contactoEmergenciaParentesco: string | null;
  profilePhotoStorageObjectId: string | null;
  profilePhotoUrl: string | null;
  editableFields: PersonalDataFieldKey[];
}

export interface UpdateEmployeePersonalDataInput {
  tipoDocumento?: string;
  numeroDocumento?: string;
  nombres?: string;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  fechaNacimiento?: string;
  estadoCivil?: MaritalStatus;
  sexo?: Gender;
  departamento?: string;
  ciudad?: string;
  localidad?: string;
  barrio?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  contactoEmergenciaParentesco?: string;
  profilePhotoStorageObjectId?: string | null;
}

export type EmployeeWithUser = {
  id: string;
  userId: string;
  tenantId: string;
  name: string;
  photoStorageObjectId?: string | null;
  user: User;
  personalData: EmployeePersonalData | null;
  photoStorageObject?: Pick<
    StorageObject,
    'id' | 'key' | 'visibility' | 'status' | 'deletedAt'
  > | null;
};

export interface IEmployeePersonalDataRepository {
  findEmployeeByUserId(userId: string, tenantId: string): Promise<EmployeeWithUser | null>;
  upsertPersonalData(
    tenantId: string,
    employeeDetailsId: string,
    data: Partial<EmployeePersonalData>,
  ): Promise<EmployeePersonalData>;
  updateUserIdentity(
    tenantId: string,
    userId: string,
    data: Pick<User, 'cedula' | 'documentType' | 'email'>,
  ): Promise<User>;
}

export interface IEmployeePersonalDataService {
  getByUserId(
    tenantId: string,
    userId: string,
    actorUserId: string,
    actorRoleCode: string,
  ): Promise<EmployeePersonalDataView>;
  updateByUserId(
    tenantId: string,
    userId: string,
    actorUserId: string,
    actorRoleCode: string,
    input: UpdateEmployeePersonalDataInput,
  ): Promise<EmployeePersonalDataView>;
  uploadProfilePhoto(
    tenantId: string,
    userId: string,
    actorUserId: string,
    actorRoleCode: string,
    file: Express.Multer.File,
  ): Promise<{ storageObjectId: string; profilePhotoUrl: string | null }>;
}
