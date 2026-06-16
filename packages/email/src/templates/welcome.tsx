import type { CSSProperties, ReactElement } from 'react';
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
    'Como propietario puedes configurar tu espacio de trabajo, invitar a tu equipo y revisar los reportes del negocio.',
  manager:
    'Como gerente puedes gestionar turnos, supervisar el inventario y revisar el desempeño del equipo.',
  cashier:
    'Como cajero puedes registrar ventas, gestionar el punto de venta y cerrar tu turno al finalizar.',
  accountant:
    'Como contador tienes acceso a los reportes financieros, facturas y el historial de transacciones.',
};

const ROLE_STEPS: Record<WelcomeProps['role'], string[]> = {
  owner: [
    'Configura tu espacio de trabajo y personaliza el perfil de tu restaurante.',
    'Invita a tu equipo y asigna roles desde el panel de administración.',
    'Revisa los reportes del negocio para tomar decisiones informadas.',
  ],
  manager: [
    'Crea y gestiona los turnos de tu equipo desde el tablero de operaciones.',
    'Supervisa el inventario y configura alertas de stock mínimo.',
    'Revisa el desempeño del equipo en los reportes de productividad.',
  ],
  cashier: [
    'Registra las ventas del día desde el punto de venta.',
    'Gestiona el flujo de caja y los métodos de pago aceptados.',
    'Cierra tu turno al finalizar y genera el resumen del día.',
  ],
  accountant: [
    'Accede a los reportes financieros desde el módulo de contabilidad.',
    'Descarga las facturas y comprobantes del periodo.',
    'Revisa el historial de transacciones para la conciliación bancaria.',
  ],
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
}: WelcomeEmailProps): ReactElement {
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

      <Section style={stepsSection}>
        <Text style={stepsSectionHeadingStyle}>Primeros pasos</Text>
        {ROLE_STEPS[role].map((step, index) => (
          <Text key={index} style={stepStyle}>
            {'• '}
            {step}
          </Text>
        ))}
      </Section>

      {temporaryPassword ? (
        <Text style={tempPasswordStyle}>
          Tu contraseña temporal es: <strong>{temporaryPassword}</strong>
        </Text>
      ) : null}

      <Section style={ctaSection}>
        <Button href={loginUrl} style={buttonStyle(primaryColor)}>
          Acceder a mi espacio de trabajo
        </Button>
      </Section>
    </BaseLayout>
  );
}

export default function WelcomeEmailPreview(): ReactElement {
  return (
    <WelcomeEmail
      userName="María García"
      role="owner"
      loginUrl="https://app.restopsiq.co/login"
      tenantName="Restaurante Demo"
      temporaryPassword="Temp@2026!"
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

const stepsSection: CSSProperties = {
  margin: '20px 0',
};

const stepsSectionHeadingStyle: CSSProperties = {
  color: '#18181b',
  fontSize: '14px',
  fontWeight: '700',
  lineHeight: '20px',
  margin: '0 0 8px 0',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const stepStyle: CSSProperties = {
  color: '#3f3f46',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 6px 0',
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
