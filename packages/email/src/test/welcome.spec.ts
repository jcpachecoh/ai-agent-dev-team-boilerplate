import { createElement } from 'react';
import { render as renderEmail } from '@react-email/render';

import { WelcomeEmail } from '../templates/welcome';
import { RESTOPSIQ_LOGO_URL } from '../templates/base-layout';
import type { WelcomeEmailProps } from '../templates/welcome';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RenderOverrides = Partial<WelcomeEmailProps>;

function render(overrides: RenderOverrides = {}): string {
  return renderEmail(
    createElement(WelcomeEmail, {
      userName: overrides.userName ?? 'Ana López',
      role: overrides.role ?? 'owner',
      loginUrl: overrides.loginUrl ?? 'https://app.restopsiq.co/login',
      temporaryPassword: overrides.temporaryPassword,
      tenantName: overrides.tenantName ?? 'Restaurante Prueba',
      tenantLogoUrl: overrides.tenantLogoUrl,
      primaryColor: overrides.primaryColor,
    }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WelcomeEmail', () => {
  describe('greeting', () => {
    it('renders a personalized greeting with userName', () => {
      const html = render({ userName: 'Carlos Ruiz' });
      expect(html).toContain('Carlos Ruiz');
    });
  });

  describe('CTA', () => {
    it('renders the CTA text "Acceder a mi espacio de trabajo"', () => {
      const html = render();
      expect(html).toContain('Acceder a mi espacio de trabajo');
    });

    it('includes loginUrl in the rendered output', () => {
      const html = render({ loginUrl: 'https://app.restopsiq.co/login?ref=test' });
      expect(html).toContain('https://app.restopsiq.co/login?ref=test');
    });

    it('applies primaryColor to the CTA button', () => {
      const html = render({ primaryColor: '#123456' });
      expect(html).toContain('#123456');
    });

    it('uses the default color #E8943A when primaryColor is omitted', () => {
      const html = render({ primaryColor: undefined });
      expect(html).toContain('#E8943A');
    });
  });

  describe('tenantName', () => {
    it('renders tenantName in the body', () => {
      const html = render({ tenantName: 'Pizzería Central' });
      expect(html).toContain('Pizzería Central');
    });
  });

  describe('logo', () => {
    it('renders tenantLogoUrl when provided', () => {
      const html = render({ tenantLogoUrl: 'https://cdn.example.com/logo.png' });
      expect(html).toContain('https://cdn.example.com/logo.png');
    });

    it('falls back to RESTOPSIQ_LOGO_URL when tenantLogoUrl is omitted', () => {
      const html = render({ tenantLogoUrl: undefined });
      expect(html).toContain(RESTOPSIQ_LOGO_URL);
    });
  });

  describe('temporaryPassword', () => {
    it('renders temporaryPassword when provided', () => {
      const html = render({ temporaryPassword: 'Temp@1234' });
      expect(html).toContain('Temp@1234');
    });

    it('does not render a temporaryPassword block when omitted', () => {
      const html = render({ temporaryPassword: undefined });
      expect(html).not.toContain('contraseña temporal');
    });
  });

  describe('role', () => {
    it('renders owner role label', () => {
      const html = render({ role: 'owner' });
      expect(html).toContain('Propietario');
    });

    it('renders cashier role label', () => {
      const html = render({ role: 'cashier' });
      expect(html).toContain('Cajero');
    });

    it('renders manager role label', () => {
      const html = render({ role: 'manager' });
      expect(html).toContain('Gerente');
    });

    it('renders accountant role label', () => {
      const html = render({ role: 'accountant' });
      expect(html).toContain('Contador');
    });

    it('renders owner-specific tip', () => {
      const html = render({ role: 'owner' });
      expect(html).toContain('propietario');
    });

    it('renders cashier-specific tip', () => {
      const html = render({ role: 'cashier' });
      expect(html).toContain('cajero');
    });
  });

  describe('primerosPasos', () => {
    it('renders the "Primeros pasos" section heading', () => {
      const html = render();
      expect(html).toContain('Primeros pasos');
    });

    it('renders 3 step bullets for the owner role', () => {
      const html = render({ role: 'owner' });
      const matches = html.match(/•/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(3);
    });

    it('renders role-specific steps for manager', () => {
      const html = render({ role: 'manager' });
      expect(html).toContain('turnos');
    });

    it('renders role-specific steps for cashier', () => {
      const html = render({ role: 'cashier' });
      expect(html).toContain('punto de venta');
    });

    it('renders role-specific steps for accountant', () => {
      const html = render({ role: 'accountant' });
      expect(html).toContain('conciliación');
    });
  });

  describe('structure', () => {
    it('produces a non-empty HTML string', () => {
      const html = render();
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(100);
    });

    it('wraps content in an html element', () => {
      const html = render();
      expect(html).toContain('<html');
    });
  });
});
