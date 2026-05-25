import { createElement } from 'react';
import { render as renderEmail } from '@react-email/render';

import { VerifyEmailEmail } from '../templates/verify-email';
import { RESTOPSIQ_LOGO_URL } from '../templates/base-layout';
import type { VerifyEmailEmailProps } from '../templates/verify-email';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RenderOverrides = Partial<VerifyEmailEmailProps>;

function render(overrides: RenderOverrides = {}): string {
  return renderEmail(
    createElement(VerifyEmailEmail, {
      userName: overrides.userName ?? 'Ana López',
      otpCode: overrides.otpCode ?? '123 456',
      expiresInMinutes: overrides.expiresInMinutes ?? 15,
      tenantName: overrides.tenantName ?? 'Restaurante Prueba',
      tenantLogoUrl: overrides.tenantLogoUrl,
      primaryColor: overrides.primaryColor,
    }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('VerifyEmailEmail', () => {
  describe('greeting', () => {
    it('renders a personalized greeting with userName', () => {
      const html = render({ userName: 'Jorge Pérez' });
      expect(html).toContain('Jorge Pérez');
    });
  });

  describe('OTP code', () => {
    it('renders the otpCode in the output', () => {
      const html = render({ otpCode: '999 888' });
      expect(html).toContain('999 888');
    });

    it('applies primaryColor to the OTP element', () => {
      const html = render({ primaryColor: '#ABCDEF' });
      expect(html).toContain('#ABCDEF');
    });

    it('uses default color #E8943A for the OTP when primaryColor is omitted', () => {
      const html = render({ primaryColor: undefined });
      expect(html).toContain('#E8943A');
    });

    it('renders the OTP code with a monospace font-family and large font-size', () => {
      const html = render({ otpCode: '123456' });
      expect(html).toMatch(/font-family[^"]*monospace/);
      expect(html).toMatch(/font-size\s*:\s*40px/);
    });
  });

  describe('expiration', () => {
    it('renders expiresInMinutes in the body', () => {
      const html = render({ expiresInMinutes: 30 });
      expect(html).toContain('30');
    });

    it('renders expiration copy', () => {
      const html = render();
      expect(html).toContain('expira');
    });
  });

  describe('do-not-share warning', () => {
    it('renders the do-not-share warning', () => {
      const html = render();
      expect(html).toContain('nunca compartas');
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
