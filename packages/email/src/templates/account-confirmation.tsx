import type { CSSProperties, ReactElement } from 'react';
import { Button, Heading, Section, Text } from '@react-email/components';

import { BaseLayout } from './base-layout';
import type { AccountConfirmationProps } from '../types';

const DEFAULT_PRIMARY_COLOR = '#E8943A';

export interface AccountConfirmationEmailProps extends AccountConfirmationProps {
  tenantName: string;
  tenantLogoUrl?: string;
  primaryColor?: string;
}

export function AccountConfirmationEmail({
  userName,
  confirmUrl,
  expiresAt,
  tenantName,
  tenantLogoUrl,
  primaryColor = DEFAULT_PRIMARY_COLOR,
}: AccountConfirmationEmailProps): ReactElement {
  return (
    <BaseLayout
      tenantName={tenantName}
      tenantLogoUrl={tenantLogoUrl}
      primaryColor={primaryColor}
      previewText={`Confirma tu cuenta en ${tenantName}`}
    >
      <Heading style={headingStyle}>Confirma tu cuenta</Heading>

      <Text style={textStyle}>
        Hola <strong>{userName}</strong>, se creó una cuenta para ti en{' '}
        <strong>{tenantName}</strong>. Para activarla y configurar tu contraseña, usa el siguiente
        enlace:
      </Text>

      <Text style={textStyle}>
        El enlace expira el <strong>{expiresAt}</strong>.
      </Text>

      <Section style={ctaSection}>
        <Button href={confirmUrl} style={buttonStyle(primaryColor)}>
          Configurar contraseña
        </Button>
      </Section>

      <Text style={ignoreNoteStyle}>
        Si no esperabas este correo, ignóralo. Tu cuenta no quedará activa hasta que completes la
        configuración.
      </Text>
    </BaseLayout>
  );
}

export default function AccountConfirmationPreview(): ReactElement {
  return (
    <AccountConfirmationEmail
      userName="Laura Martínez"
      confirmUrl="https://app.restopsiq.co/auth/activate-account?token=preview"
      expiresAt="23 de junio de 2026 a las 10:00 a.m."
      tenantName="Restaurante Demo"
    />
  );
}

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

const ignoreNoteStyle: CSSProperties = {
  color: '#71717a',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
};
