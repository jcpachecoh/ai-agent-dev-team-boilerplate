import { createElement } from 'react';
import { render as renderEmail } from '@react-email/render';

import { InviteUserEmail } from '../templates/invite-user';
import { RESTOPSIQ_LOGO_URL } from '../templates/base-layout';
import type { InviteUserEmailProps } from '../templates/invite-user';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RenderOverrides = Partial<InviteUserEmailProps>;

function render(overrides: RenderOverrides = {}): string {
  return renderEmail(
    createElement(InviteUserEmail, {
      inviteeName: overrides.inviteeName ?? 'Carlos Mendoza',
      inviterName: overrides.inviterName ?? 'Ana García',
      role: overrides.role ?? 'Cajero',
      workspaceName: overrides.workspaceName ?? 'Restaurante Prueba',
      acceptUrl: overrides.acceptUrl ?? 'https://app.restopsiq.co/invites/token-abc',
      expiresAt: overrides.expiresAt ?? '22 de mayo de 2026 a las 10:00 a.m.',
      tenantName: overrides.tenantName ?? 'Restaurante Prueba',
      tenantLogoUrl: overrides.tenantLogoUrl,
      primaryColor: overrides.primaryColor,
    }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('InviteUserEmail', () => {
  describe('inviteeName', () => {
    it('renders a personalized greeting with inviteeName', () => {
      const html = render({ inviteeName: 'Luis Herrera' });
      expect(html).toContain('Luis Herrera');
    });
  });

  describe('inviterName', () => {
    it('renders inviterName in the body', () => {
      const html = render({ inviterName: 'María Pérez' });
      expect(html).toContain('María Pérez');
    });
  });

  describe('workspaceName', () => {
    it('renders workspaceName in the heading', () => {
      const html = render({ workspaceName: 'Pizzería Central' });
      expect(html).toContain('Pizzería Central');
    });

    it('renders workspaceName in the previewText', () => {
      const html = render({ workspaceName: 'Pizzería Central' });
      expect(html).toContain('Pizzería Central');
    });
  });

  describe('role', () => {
    it('renders the assigned role', () => {
      const html = render({ role: 'Contador' });
      expect(html).toContain('Contador');
    });
  });

  describe('CTA', () => {
    it('renders the CTA text "Aceptar invitación"', () => {
      const html = render();
      expect(html).toContain('Aceptar invitación');
    });

    it('includes acceptUrl in the rendered output', () => {
      const html = render({ acceptUrl: 'https://app.restopsiq.co/invites/xyz-token' });
      expect(html).toContain('https://app.restopsiq.co/invites/xyz-token');
    });

    it('applies primaryColor to the CTA button', () => {
      const html = render({ primaryColor: '#FF4500' });
      expect(html).toContain('#FF4500');
    });

    it('uses the default color #E8943A when primaryColor is omitted', () => {
      const html = render({ primaryColor: undefined });
      expect(html).toContain('#E8943A');
    });
  });

  describe('expiration', () => {
    it('renders expiresAt in the body', () => {
      const html = render({ expiresAt: '25 de mayo de 2026' });
      expect(html).toContain('25 de mayo de 2026');
    });

    it('renders the expiration label', () => {
      const html = render();
      expect(html).toContain('válida hasta');
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
