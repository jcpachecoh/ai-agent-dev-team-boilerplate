export type MaritalStatus = 'SOLTERO' | 'CASADO' | 'UNION_LIBRE' | 'DIVORCIADO' | 'VIUDO';

export type Gender = 'MASCULINO' | 'FEMENINO' | 'OTRO';

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

export interface EmployeePersonalData {
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
  estadoCivil?: MaritalStatus | '';
  sexo?: Gender | '';
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

export interface ColombiaDepartment {
  code: string;
  name: string;
}
