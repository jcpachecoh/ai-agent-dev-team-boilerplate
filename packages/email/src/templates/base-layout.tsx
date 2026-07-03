import type { CSSProperties } from 'react';
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

import type { BaseLayoutProps } from '../types';

export const RESTOPSIQ_LOGO_URL = 'https://placehold.co/180x44/E8943A/ffffff?text=RestOpsIQ';

const DEFAULT_PRIMARY_COLOR = '#E8943A';

export function BaseLayout({
  tenantName,
  tenantLogoUrl,
  primaryColor = DEFAULT_PRIMARY_COLOR,
  previewText,
  children,
}: BaseLayoutProps) {
  const logoUrl = tenantLogoUrl ?? RESTOPSIQ_LOGO_URL;

  return (
    <Html lang="es">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header — brand color bar with tenant logo */}
          <Section style={{ ...baseHeaderStyle, backgroundColor: primaryColor }}>
            <Img
              src={logoUrl}
              alt={`${tenantName} logo`}
              width={180}
              height={44}
              style={logoStyle}
            />
          </Section>

          {/* Content — provided by each template */}
          <Section style={contentStyle}>{children}</Section>

          <Hr style={hrStyle} />

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>{tenantName} · Dirección pendiente de configuración</Text>
            <Text style={footerTextStyle}>
              <Link href="{{unsubscribeUrl}}" style={{ ...footerLinkStyle, color: primaryColor }}>
                Cancelar suscripción
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const bodyStyle: CSSProperties = {
  backgroundColor: '#f4f4f5',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: '0',
  padding: '40px 0',
};

const containerStyle: CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '600px',
  overflow: 'hidden',
};

const baseHeaderStyle: CSSProperties = {
  padding: '24px 32px',
};

const logoStyle: CSSProperties = {
  display: 'block',
};

const contentStyle: CSSProperties = {
  padding: '32px',
};

const hrStyle: CSSProperties = {
  borderColor: '#e4e4e7',
  margin: '0 32px',
};

const footerStyle: CSSProperties = {
  padding: '24px 32px',
};

const footerTextStyle: CSSProperties = {
  color: '#71717a',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0 0 4px 0',
  textAlign: 'center',
};

const footerLinkStyle: CSSProperties = {
  textDecoration: 'underline',
};
