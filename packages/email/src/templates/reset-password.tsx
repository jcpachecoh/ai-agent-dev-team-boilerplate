import type { CSSProperties, ReactElement } from 'react';
import { Button, Heading, Section, Text } from '@react-email/components';

import { BaseLayout } from './base-layout';
import type { ResetPasswordProps } from '../types';

const DEFAULT_PRIMARY_COLOR = '#E8943A';

export interface ResetPasswordEmailProps extends ResetPasswordProps {
  tenantName: string;
  tenantLogoUrl?: string;
  primaryColor?: string;
}

export function ResetPasswordEmail({
  userName,
  resetUrl,
  expiresAt,
  ipAddress,
  tenantName,
  tenantLogoUrl,
  primaryColor = DEFAULT_PRIMARY_COLOR,
}: ResetPasswordEmailProps): ReactElement {
  return (
    <BaseLayout
      tenantName={tenantName}
      tenantLogoUrl={tenantLogoUrl}
      primaryColor={primaryColor}
      previewText={`Restablece tu contraseña · expira el ${expiresAt}`}
    >
      <Heading style={headingStyle}>Restablece tu contraseña</Heading>

      <Text style={textStyle}>
        Hola <strong>{userName}</strong>, recibimos una solicitud para restablecer la contraseña de
        tu cuenta en <strong>{tenantName}</strong>.
      </Text>

      <Text style={textStyle}>
        El enlace para restablecer tu contraseña expira el <strong>{expiresAt}</strong>.
      </Text>

      <Section style={ctaSection}>
        <Button href={resetUrl} style={buttonStyle(primaryColor)}>
          Restablecer contraseña
        </Button>
      </Section>

      {ipAddress ? (
        <Text style={securityNoteStyle}>
          Solicitud desde: <strong>{ipAddress}</strong>
        </Text>
      ) : null}

      <Text style={ignoreNoteStyle}>
        Si no solicitaste este cambio, ignora este correo. Tu contraseña permanecerá sin cambios.
      </Text>
    </BaseLayout>
  );
}

export default function ResetPasswordEmailPreview(): ReactElement {
  return (
    <ResetPasswordEmail
      userName="Carlos Ruiz"
      resetUrl="https://app.restopsiq.co/auth/reset?token=preview"
      expiresAt="21 de mayo de 2026 a las 10:00 a.m."
      ipAddress="192.168.1.1"
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

const ctaSection: CSSProperties = {
  margin: '24px 0',
  textAlign: 'center',
};

const securityNoteStyle: CSSProperties = {
  backgroundColor: '#fef9c3',
  borderRadius: '6px',
  color: '#713f12',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 12px 0',
  padding: '10px 14px',
};

const ignoreNoteStyle: CSSProperties = {
  color: '#71717a',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
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
