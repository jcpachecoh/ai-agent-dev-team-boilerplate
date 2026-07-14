import type { PrismaClient } from '@prisma/client';

const DRAFT_NOTICE = '[BORRADOR — PENDIENTE REVISIÓN LEGAL]';

const DEFAULT_POLICY_VERSION = '2026.07.1';

const DEFAULT_CONSENT_LABEL =
  'Autorizo el tratamiento de mi dato biométrico facial y de geolocalización para los fines aquí descritos.';

function buildPolicyContent(
  companyName: string,
  nit: string | null,
  contactEmail: string | null,
): string {
  return `${DRAFT_NOTICE}

AUTORIZACIÓN PARA EL TRATAMIENTO DE DATOS BIOMÉTRICOS Y DE GEOLOCALIZACIÓN

En cumplimiento de la Ley 1581 de 2012, el Decreto 1377 de 2013 y demás normas concordantes sobre protección de datos personales, ${companyName}, identificado con NIT ${nit ?? '[NIT]'}, en calidad de Responsable del Tratamiento, solicita su autorización expresa, previa e informada para el tratamiento de los siguientes datos personales:

Dato biométrico facial: captura y almacenamiento de su imagen facial con el fin de validar su identidad al momento de registrar su entrada y salida laboral (marcación de asistencia).

Dato de geolocalización: captura de las coordenadas de ubicación de su dispositivo móvil al momento de cada marcación, con el fin de verificar que el registro se realice dentro del radio autorizado de su sede de trabajo asignada.

Finalidad del tratamiento: verificar su identidad y evitar suplantación en el registro de asistencia; calcular de forma precisa las horas trabajadas, recargos y novedades de nómina; cumplir obligaciones legales y contractuales de la relación laboral.

Los datos biométricos y de geolocalización no serán utilizados para ningún fin distinto a los aquí descritos, no serán vendidos, cedidos ni compartidos con terceros salvo obligación legal, y se conservarán únicamente durante el tiempo necesario para la finalidad descrita.

Usted tiene derecho a conocer, actualizar, rectificar y suprimir sus datos personales, y a revocar esta autorización en cualquier momento, sin efectos retroactivos. La revocación del consentimiento biométrico no afecta su relación laboral; en ese caso la compañía habilitará un método alterno de marcación (PIN/código).

Para ejercer sus derechos puede escribir a ${contactEmail ?? '[correo de protección de datos]'} o consultar la Política de Tratamiento de Datos Personales publicada en la aplicación.

He leído y entiendo la finalidad del tratamiento de mis datos biométricos y de geolocalización, y otorgo mi autorización de forma libre, expresa e informada.`;
}

export async function seedDataProcessingPolicy(
  prisma: PrismaClient,
  tenantId: string,
): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      tradeName: true,
      legalName: true,
      name: true,
      nit: true,
      email: true,
    },
  });

  const companyName = tenant?.tradeName ?? tenant?.legalName ?? tenant?.name ?? 'La empresa';
  const content = buildPolicyContent(companyName, tenant?.nit ?? null, tenant?.email ?? null);

  await prisma.dataProcessingPolicy.updateMany({
    where: { tenantId, isActive: true, deletedAt: null },
    data: { isActive: false },
  });

  const policy = await prisma.dataProcessingPolicy.upsert({
    where: {
      tenantId_version: { tenantId, version: DEFAULT_POLICY_VERSION },
    },
    update: {
      title: 'Política de tratamiento de datos biométricos y geolocalización',
      content,
      consentLabel: DEFAULT_CONSENT_LABEL,
      publishedAt: new Date(),
      isActive: true,
      deletedAt: null,
    },
    create: {
      tenantId,
      version: DEFAULT_POLICY_VERSION,
      title: 'Política de tratamiento de datos biométricos y geolocalización',
      content,
      consentLabel: DEFAULT_CONSENT_LABEL,
      publishedAt: new Date(),
      isActive: true,
    },
  });

  console.log('Data processing policy:', policy.version, '—', policy.id, `(tenant ${tenantId})`);
}
