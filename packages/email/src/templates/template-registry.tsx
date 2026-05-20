import type { CSSProperties, ReactElement } from 'react';
import { Button, Heading, Link, Section, Text } from '@react-email/components';

import { BaseLayout } from './base-layout';
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
        <BaseLayout {...layoutProps} previewText={`Bienvenido a ${template.props.tenantName}`}>
          <Heading style={headingStyle}>¡Bienvenido, {template.props.firstName}!</Heading>
          <Text style={textStyle}>
            Tu cuenta en <strong>{template.props.tenantName}</strong> ha sido creada exitosamente.
            Ya puedes iniciar sesión.
          </Text>
          <Section style={ctaStyle}>
            <Button href={template.props.loginUrl} style={buttonStyle(color)}>
              Iniciar sesión
            </Button>
          </Section>
        </BaseLayout>
      );

    case 'reset-password':
      return (
        <BaseLayout {...layoutProps} previewText="Restablece tu contraseña">
          <Heading style={headingStyle}>Restablece tu contraseña</Heading>
          <Text style={textStyle}>
            Hola {template.props.firstName}, haz clic en el botón para restablecer tu contraseña. El
            enlace expira en {template.props.expiresInMinutes} minutos.
          </Text>
          <Section style={ctaStyle}>
            <Button href={template.props.resetUrl} style={buttonStyle(color)}>
              Restablecer contraseña
            </Button>
          </Section>
        </BaseLayout>
      );

    case 'verify-email':
      return (
        <BaseLayout {...layoutProps} previewText="Verifica tu correo electrónico">
          <Heading style={headingStyle}>Verifica tu correo</Heading>
          <Text style={textStyle}>
            Hola {template.props.firstName}, usa el siguiente código para verificar tu correo
            electrónico:
          </Text>
          <Text style={otpStyle(color)}>{template.props.otp}</Text>
          <Text style={{ ...textStyle, color: '#71717a', fontSize: '14px' }}>
            El código expira en {template.props.expiresInMinutes} minutos.
          </Text>
        </BaseLayout>
      );

    case 'invite-user':
      return (
        <BaseLayout
          {...layoutProps}
          previewText={`${template.props.inviterName} te invita a ${template.props.tenantName}`}
        >
          <Heading style={headingStyle}>Invitación a {template.props.tenantName}</Heading>
          <Text style={textStyle}>
            <strong>{template.props.inviterName}</strong> te ha invitado a unirte como{' '}
            <strong>{template.props.role}</strong>.
          </Text>
          <Section style={ctaStyle}>
            <Button href={template.props.inviteUrl} style={buttonStyle(color)}>
              Aceptar invitación
            </Button>
          </Section>
        </BaseLayout>
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

function otpStyle(primaryColor: string): CSSProperties {
  return {
    color: primaryColor,
    fontSize: '36px',
    fontWeight: '700',
    letterSpacing: '8px',
    margin: '16px 0',
    textAlign: 'center',
  };
}

function linkStyle(primaryColor: string): CSSProperties {
  return {
    color: primaryColor,
    fontSize: '14px',
    textDecoration: 'underline',
  };
}
