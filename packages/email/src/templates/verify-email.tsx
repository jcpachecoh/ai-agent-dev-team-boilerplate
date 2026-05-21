import type { CSSProperties } from 'react';
import { Heading, Text } from '@react-email/components';

import { BaseLayout } from './base-layout';
import type { VerifyEmailProps } from '../types';

const DEFAULT_PRIMARY_COLOR = '#E8943A';

export interface VerifyEmailTemplateProps extends VerifyEmailProps {
  tenantName: string;
  tenantLogoUrl?: string;
  primaryColor?: string;
}

export function VerifyEmailTemplate({
  userName,
  otpCode,
  expiresInMinutes,
  tenantName,
  tenantLogoUrl,
  primaryColor = DEFAULT_PRIMARY_COLOR,
}: VerifyEmailTemplateProps) {
  return (
    <BaseLayout
      tenantName={tenantName}
      tenantLogoUrl={tenantLogoUrl}
      primaryColor={primaryColor}
      previewText={`Tu código de verificación es ${otpCode}`}
    >
      <Heading style={headingStyle}>Verifica tu correo electrónico</Heading>

      <Text style={textStyle}>
        Hola <strong>{userName}</strong>, usa el siguiente código para verificar tu dirección de
        correo electrónico en <strong>{tenantName}</strong>:
      </Text>

      <Text style={otpStyle(primaryColor)}>{otpCode}</Text>

      <Text style={expiryStyle}>
        El código expira en <strong>{expiresInMinutes} minutos</strong>.
      </Text>

      <Text style={warningStyle}>
        Por tu seguridad, nunca compartas este código con nadie. Ningún empleado de{' '}
        <strong>{tenantName}</strong> te lo pedirá.
      </Text>

      <Text style={ignoreStyle}>
        Si no solicitaste la verificación, ignora este correo. Tu cuenta permanecerá sin cambios.
      </Text>
    </BaseLayout>
  );
}

export default function VerifyEmailPreview() {
  return (
    <VerifyEmailTemplate
      userName="Laura Martínez"
      otpCode="847 291"
      expiresInMinutes={15}
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

function otpStyle(primaryColor: string): CSSProperties {
  return {
    color: primaryColor,
    fontSize: '40px',
    fontWeight: '700',
    fontFamily: 'monospace, "Courier New", Courier',
    letterSpacing: '8px',
    margin: '20px 0',
    textAlign: 'center',
  };
}

const expiryStyle: CSSProperties = {
  color: '#71717a',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 16px 0',
  textAlign: 'center',
};

const warningStyle: CSSProperties = {
  backgroundColor: '#fef9c3',
  borderRadius: '6px',
  color: '#713f12',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 12px 0',
  padding: '10px 14px',
};

const ignoreStyle: CSSProperties = {
  color: '#71717a',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
};
