import type { CSSProperties } from 'react';
import { Button, Heading, Section, Text } from '@react-email/components';

import { BaseLayout } from './base-layout';
import type { WelcomeProps } from '../types';

const DEFAULT_PRIMARY_COLOR = '#E8943A';

const ROLE_LABELS: Record<WelcomeProps['role'], string> = {
  owner: 'Propietario',
  manager: 'Gerente',
  cashier: 'Cajero',
  accountant: 'Contador',
};

const ROLE_TIPS: Record<WelcomeProps['role'], string> = {
  owner:
    'Como propietario puedes configurar tu workspace, invitar a tu equipo y revisar los reportes del negocio.',
  manager:
    'Como gerente puedes gestionar turnos, supervisar el inventario y revisar el desempeño del equipo.',
  cashier:
    'Como cajero puedes registrar ventas, gestionar el punto de venta y cerrar tu turno al finalizar.',
  accountant:
    'Como contador tienes acceso a los reportes financieros, facturas y el historial de transacciones.',
};

export interface WelcomeEmailProps extends WelcomeProps {
  tenantName: string;
  tenantLogoUrl?: string;
  primaryColor?: string;
}

export function WelcomeEmail({
  userName,
  role,
  loginUrl,
  temporaryPassword,
  tenantName,
  tenantLogoUrl,
  primaryColor = DEFAULT_PRIMARY_COLOR,
}: WelcomeEmailProps) {
  return (
    <BaseLayout
      tenantName={tenantName}
      tenantLogoUrl={tenantLogoUrl}
      primaryColor={primaryColor}
      previewText={`Tu cuenta en ${tenantName} está lista`}
    >
      <Heading style={headingStyle}>¡Bienvenido, {userName}!</Heading>

      <Text style={textStyle}>
        Tu cuenta en <strong>{tenantName}</strong> ha sido creada con el rol de{' '}
        <strong>{ROLE_LABELS[role]}</strong>.
      </Text>

      <Text style={tipStyle}>{ROLE_TIPS[role]}</Text>

      {temporaryPassword ? (
        <Text style={tempPasswordStyle}>
          Tu contraseña temporal es: <strong>{temporaryPassword}</strong>
        </Text>
      ) : null}

      <Section style={ctaSection}>
        <Button href={loginUrl} style={buttonStyle(primaryColor)}>
          Acceder a mi workspace
        </Button>
      </Section>
    </BaseLayout>
  );
}

export default function WelcomeEmailPreview() {
  return (
    <WelcomeEmail
      userName="María García"
      role="owner"
      loginUrl="https://app.restopsiq.co/login"
      tenantName="Restaurante Demo"
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const headingStyle: CSSProperties = {
  color: '#18181b',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '32px',
  margin: '0 0 16px 0',
};

const textStyle: CSSProperties = {
  color: '#3f3f46',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 12px 0',
};

const tipStyle: CSSProperties = {
  color: '#71717a',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 20px 0',
};

const tempPasswordStyle: CSSProperties = {
  backgroundColor: '#f4f4f5',
  borderRadius: '6px',
  color: '#18181b',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 20px 0',
  padding: '12px 16px',
};

const ctaSection: CSSProperties = {
  margin: '24px 0',
  textAlign: 'center',
};

function buttonStyle(primaryColor: string): CSSProperties {
  return {
    backgroundColor: primaryColor,
    borderRadius: '6px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '600',
    padding: '12px 24px',
    textDecoration: 'none',
  };
}
