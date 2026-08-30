import { createElement } from 'react';
import { render as renderEmail } from '@react-email/render';

import { ResetPasswordEmail } from '../templates/reset-password';
import { RESTOPSIQ_LOGO_URL } from '../templates/base-layout';
import type { ResetPasswordEmailProps } from '../templates/reset-password';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RenderOverrides = Partial<ResetPasswordEmailProps>;

function render(overrides: RenderOverrides = {}): string {
  return renderEmail(
    createElement(ResetPasswordEmail, {
      userName: overrides.userName ?? 'Ana López',
      resetUrl: overrides.resetUrl ?? 'https://app.restopsiq.co/auth/reset?token=abc',
      expiresAt: overrides.expiresAt ?? '21 de mayo de 2026 a las 10:00 a.m.',
      ipAddress: overrides.ipAddress,
      tenantName: overrides.tenantName ?? 'Restaurante Prueba',
      tenantLogoUrl: overrides.tenantLogoUrl,
      primaryColor: overrides.primaryColor,
    }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ResetPasswordEmail', () => {
  describe('greeting', () => {
    it('renders a personalized greeting with userName', () => {
      const html = render({ userName: 'Pedro Gómez' });
      expect(html).toContain('Pedro Gómez');
    });

    it('renders a notice that a password reset was requested', () => {
      const html = render();
      expect(html).toContain('restablecer');
    });
  });

  describe('CTA', () => {
    it('renders the CTA text "Restablecer contraseña"', () => {
      const html = render();
      expect(html).toContain('Restablecer contraseña');
    });

    it('includes resetUrl in the rendered output', () => {
      const html = render({ resetUrl: 'https://app.restopsiq.co/auth/reset?token=xyz' });
      expect(html).toContain('https://app.restopsiq.co/auth/reset?token=xyz');
    });

    it('applies primaryColor to the CTA button', () => {
      const html = render({ primaryColor: '#654321' });
      expect(html).toContain('#654321');
    });

    it('uses the default color #E8943A when primaryColor is omitted', () => {
      const html = render({ primaryColor: undefined });
      expect(html).toContain('#E8943A');
    });
  });

  describe('expiration', () => {
    it('renders expiresAt in the body', () => {
      const html = render({ expiresAt: '22 de mayo de 2026 a las 9:00 a.m.' });
      expect(html).toContain('22 de mayo de 2026 a las 9:00 a.m.');
    });

    it('renders expiration copy', () => {
      const html = render();
      expect(html).toContain('expira');
    });
  });

  describe('ipAddress', () => {
    it('renders ipAddress when provided', () => {
      const html = render({ ipAddress: '10.0.0.5' });
      expect(html).toContain('10.0.0.5');
    });

    it('renders the security note label when ipAddress is provided', () => {
      const html = render({ ipAddress: '10.0.0.5' });
      expect(html).toContain('Solicitud desde');
    });

    it('does not render the IP block when ipAddress is omitted', () => {
      const html = render({ ipAddress: undefined });
      expect(html).not.toContain('Solicitud desde');
    });
  });

  describe('ignore instruction', () => {
    it('renders the ignore instruction', () => {
      const html = render();
      expect(html).toContain('ignora este correo');
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
