import type { CSSProperties, ReactElement } from 'react';
import { Heading, Link, Section, Text } from '@react-email/components';

import { BaseLayout } from './base-layout';
import { WelcomeEmail } from './welcome';
import { ResetPasswordEmail } from './reset-password';
import { VerifyEmailEmail } from './verify-email';
import { InviteUserEmail } from './invite-user';
import type { EmailTemplate } from '../types';

const DEFAULT_PRIMARY_COLOR = '#E8943A';

interface LayoutProps {
  tenantName: string;
  tenantLogoUrl?: string;
  primaryColor?: string;
}

/**
 * Maps an EmailTemplate discriminated union to a fully-wrapped React element
 * ready to be passed to @react-email/render. Each case uses BaseLayout so
 * the tenant branding is applied uniformly. Real template bodies are
 * implemented in subsequent tickets (EMAIL-03 … EMAIL-07).
 */
export function renderTemplateElement(
  template: EmailTemplate,
  layoutProps: LayoutProps,
): ReactElement {
  const color = layoutProps.primaryColor ?? DEFAULT_PRIMARY_COLOR;

  switch (template.type) {
    case 'welcome':
      return (
        <WelcomeEmail
          {...template.props}
          tenantName={layoutProps.tenantName}
          tenantLogoUrl={layoutProps.tenantLogoUrl}
          primaryColor={color}
        />
      );

    case 'reset-password':
      return (
        <ResetPasswordEmail
          {...template.props}
          tenantName={layoutProps.tenantName}
          tenantLogoUrl={layoutProps.tenantLogoUrl}
          primaryColor={color}
        />
      );

    case 'verify-email':
      return (
        <VerifyEmailEmail
          {...template.props}
          tenantName={layoutProps.tenantName}
          tenantLogoUrl={layoutProps.tenantLogoUrl}
          primaryColor={color}
        />
      );

    case 'invite-user':
      return (
        <InviteUserEmail
          {...template.props}
          tenantName={layoutProps.tenantName}
          tenantLogoUrl={layoutProps.tenantLogoUrl}
          primaryColor={color}
        />
      );

    case 'dian-invoice':
      return (
        <BaseLayout
          {...layoutProps}
          previewText={`Factura electrónica ${template.props.invoiceNumber}`}
        >
          <Heading style={headingStyle}>Factura Electrónica</Heading>
          <Text style={textStyle}>
            Estimado/a {template.props.customerName}, adjuntamos la factura número{' '}
            <strong>{template.props.invoiceNumber}</strong> por un valor de{' '}
            <strong>${template.props.totalAmount.toLocaleString('es-CO')}</strong>.
          </Text>
          <Section style={ctaStyle}>
            <Link href={template.props.invoiceUrl} style={linkStyle(color)}>
              Ver factura en línea
            </Link>
          </Section>
        </BaseLayout>
      );

    case 'stock-alert':
      return (
        <BaseLayout
          {...layoutProps}
          previewText={`Alerta de stock: ${template.props.ingredientName}`}
        >
          <Heading style={headingStyle}>Alerta de Stock Bajo</Heading>
          <Text style={textStyle}>
            El insumo <strong>{template.props.ingredientName}</strong> ha alcanzado el nivel mínimo
            de stock.
          </Text>
          <Text style={textStyle}>
            Stock actual:{' '}
            <strong>
              {template.props.currentStock} {template.props.unit}
            </strong>{' '}
            · Mínimo:{' '}
            <strong>
              {template.props.minimumStock} {template.props.unit}
            </strong>
          </Text>
        </BaseLayout>
      );

    case 'shift-summary':
      return (
        <BaseLayout {...layoutProps} previewText={`Resumen de turno — ${template.props.shiftDate}`}>
          <Heading style={headingStyle}>Resumen de Turno</Heading>
          <Text style={textStyle}>
            <strong>Fecha:</strong> {template.props.shiftDate}
          </Text>
          <Text style={textStyle}>
            <strong>Apertura:</strong> {template.props.openedBy} · <strong>Cierre:</strong>{' '}
            {template.props.closedBy}
          </Text>
          <Section style={ctaStyle}>
            <Link href={template.props.reportUrl} style={linkStyle(color)}>
              Ver reporte completo
            </Link>
          </Section>
        </BaseLayout>
      );

    default: {
      const _exhaustive: never = template;
      void _exhaustive;
      throw new Error('Unknown email template type');
    }
  }
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

const ctaStyle: CSSProperties = {
  margin: '24px 0',
  textAlign: 'center',
};

function linkStyle(primaryColor: string): CSSProperties {
  return {
    color: primaryColor,
    fontSize: '14px',
    textDecoration: 'underline',
  };
}
