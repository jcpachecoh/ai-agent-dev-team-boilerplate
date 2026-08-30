import { SupplierDocumentType } from '@prisma/client';

import type {
  DocumentCatalogItem,
  SupplierFlags,
} from './interfaces/supplier-documents.interfaces';

export const SUPPLIER_DOCUMENTS_READ_PERMISSION = 'suppliers.documents.read';
export const SUPPLIER_DOCUMENTS_WRITE_PERMISSION = 'suppliers.documents.write';
export const SUPPLIER_DOCUMENTS_READ_ROLES = [
  'OWNER',
  'SUPER_ADMIN',
  'SUPERVISOR',
  'MANAGER',
] as const;
export const SUPPLIER_DOCUMENTS_WRITE_ROLES = ['OWNER', 'SUPER_ADMIN', 'MANAGER'] as const;

export const SUPPLIER_DOCUMENT_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const SUPPLIER_DOCUMENT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;

function isPersonaJuridica(flags: SupplierFlags): boolean {
  return flags.tipo === 'PERSONA_JURIDICA';
}

export function buildSupplierDocumentCatalog(flags: SupplierFlags): DocumentCatalogItem[] {
  return [
    {
      documentType: SupplierDocumentType.RUT,
      label: 'RUT actualizado',
      requirement: 'REQUIRED',
    },
    {
      documentType: SupplierDocumentType.CAMARA_COMERCIO,
      label: 'Cámara de Comercio',
      requirement: isPersonaJuridica(flags) ? 'REQUIRED' : 'CONDITIONAL',
    },
    {
      documentType: SupplierDocumentType.CEDULA_REPRESENTANTE_LEGAL,
      label: 'Cédula representante legal',
      requirement: 'REQUIRED',
    },
    {
      documentType: SupplierDocumentType.CERTIFICACION_BANCARIA,
      label: 'Certificación bancaria',
      requirement: 'REQUIRED',
    },
    {
      documentType: SupplierDocumentType.LISTA_PRECIOS,
      label: 'Lista de precios',
      requirement: flags.sellsRecurrentProducts ? 'REQUIRED' : 'CONDITIONAL',
    },
    {
      documentType: SupplierDocumentType.CONTRATO_COMERCIAL,
      label: 'Contrato / acuerdo comercial',
      requirement: flags.isCritical ? 'REQUIRED' : 'CONDITIONAL',
    },
    {
      documentType: SupplierDocumentType.POLIZAS,
      label: 'Pólizas',
      requirement: 'CONDITIONAL',
    },
    {
      documentType: SupplierDocumentType.CERTIFICACION_SANITARIA,
      label: 'Certificaciones sanitarias',
      requirement: flags.isFoodSupplier ? 'REQUIRED' : 'CONDITIONAL',
    },
    {
      documentType: SupplierDocumentType.CONCEPTO_SANITARIO_INVIMA,
      label: 'Concepto sanitario / INVIMA',
      requirement: flags.isFoodSupplier ? 'REQUIRED' : 'CONDITIONAL',
    },
    {
      documentType: SupplierDocumentType.FICHA_TECNICA_PRODUCTO,
      label: 'Ficha técnica de producto',
      requirement: flags.isRawMaterialSupplier ? 'REQUIRED' : 'CONDITIONAL',
    },
    {
      documentType: SupplierDocumentType.HOJA_SEGURIDAD,
      label: 'Hoja de seguridad',
      requirement: flags.handlesChemicals ? 'REQUIRED' : 'CONDITIONAL',
    },
    {
      documentType: SupplierDocumentType.CERTIFICADO_BPM,
      label: 'Certificado BPM / calidad',
      requirement: flags.isCritical ? 'RECOMMENDED' : 'CONDITIONAL',
    },
    {
      documentType: SupplierDocumentType.ACUERDO_CONFIDENCIALIDAD,
      label: 'Acuerdo de confidencialidad',
      requirement: 'RECOMMENDED',
    },
    {
      documentType: SupplierDocumentType.TRATAMIENTO_DATOS_PERSONALES,
      label: 'Tratamiento de datos personales',
      requirement: 'REQUIRED',
    },
  ];
}
