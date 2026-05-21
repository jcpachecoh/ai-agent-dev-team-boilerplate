import type { CSSProperties } from 'react';
import { Button, Heading, Section, Text } from '@react-email/components';

import { BaseLayout } from './base-layout';
import type { InviteUserProps } from '../types';

const DEFAULT_PRIMARY_COLOR = '#E8943A';

export interface InviteUserEmailProps extends InviteUserProps {
  tenantName: string;
  tenantLogoUrl?: string;
  primaryColor?: string;
}

export function InviteUserEmail({
  inviteeName,
  inviterName,
  role,
  workspaceName,
  acceptUrl,
  expiresAt,
  tenantName,
  tenantLogoUrl,
  primaryColor = DEFAULT_PRIMARY_COLOR,
}: InviteUserEmailProps) {
  return (
    <BaseLayout
      tenantName={tenantName}
      tenantLogoUrl={tenantLogoUrl}
      primaryColor={primaryColor}
      previewText={`${inviterName} te invita a ${workspaceName}`}
    >
      <Heading style={headingStyle}>Te han invitado a {workspaceName}</Heading>

      <Text style={textStyle}>
        Hola <strong>{inviteeName}</strong>, tienes una nueva invitación para colaborar en{' '}
        <strong>{workspaceName}</strong>.
      </Text>

      <Text style={textStyle}>
        <strong>{inviterName}</strong> te ha invitado a unirte como <strong>{role}</strong>.
      </Text>

      <Section style={ctaSection}>
        <Button href={acceptUrl} style={buttonStyle(primaryColor)}>
          Aceptar invitación
        </Button>
      </Section>

      <Text style={expiryStyle}>
        Invitación válida hasta: <strong>{expiresAt}</strong>
      </Text>

      <Text style={declineStyle}>
        Si no esperabas esta invitación, puedes ignorar este correo. Tu cuenta no se verá afectada.
      </Text>
    </BaseLayout>
  );
}

export default function InviteUserEmailPreview() {
  return (
    <InviteUserEmail
      inviteeName="Carlos Mendoza"
      inviterName="Ana García"
      role="Gerente"
      workspaceName="Restaurante Demo"
      acceptUrl="https://app.restopsiq.co/invites/preview-token"
      expiresAt="22 de mayo de 2026 a las 10:00 a.m."
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

const expiryStyle: CSSProperties = {
  color: '#71717a',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 12px 0',
  textAlign: 'center',
};

const declineStyle: CSSProperties = {
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
