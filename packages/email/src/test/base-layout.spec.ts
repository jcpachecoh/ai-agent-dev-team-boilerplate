import { createElement } from 'react';
// Use the synchronous render — renderAsync uses dynamic import() internally
// which requires --experimental-vm-modules in Jest and is not needed here.
import { render as renderEmail } from '@react-email/render';

import { BaseLayout, RESTOPSIQ_LOGO_URL } from '../templates/base-layout';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type LayoutOverrides = {
  tenantName?: string;
  tenantLogoUrl?: string;
  primaryColor?: string;
  previewText?: string;
};

function render(overrides: LayoutOverrides = {}): string {
  // children must be in the props object — TypeScript's createElement overloads
  // do not infer children from the 3rd argument against a required prop type.
  return renderEmail(
    createElement(BaseLayout, {
      tenantName: overrides.tenantName ?? 'Tenant A',
      previewText: overrides.previewText ?? 'Default preview',
      tenantLogoUrl: overrides.tenantLogoUrl,
      primaryColor: overrides.primaryColor,
      children: createElement('p', null, 'Body content'),
    }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BaseLayout', () => {
  describe('logo', () => {
    it('uses tenantLogoUrl when provided', () => {
      const html = render({ tenantLogoUrl: 'https://cdn.example.com/logo.png' });
      expect(html).toContain('https://cdn.example.com/logo.png');
    });

    it('does NOT render the fallback logo when a custom URL is provided', () => {
      const html = render({ tenantLogoUrl: 'https://cdn.example.com/logo.png' });
      expect(html).not.toContain(RESTOPSIQ_LOGO_URL);
    });

    it('falls back to RESTOPSIQ_LOGO_URL when tenantLogoUrl is omitted', () => {
      const html = render({ tenantLogoUrl: undefined });
      expect(html).toContain(RESTOPSIQ_LOGO_URL);
    });
  });

  describe('primary color', () => {
    it('applies provided primaryColor to the output HTML', () => {
      const html = render({ primaryColor: '#C0FFEE' });
      expect(html).toContain('#C0FFEE');
    });

    it('uses the default color #E8943A when primaryColor is omitted', () => {
      const html = render({ primaryColor: undefined });
      expect(html).toContain('#E8943A');
    });
  });

  describe('preview text', () => {
    it('renders previewText in the output', () => {
      const html = render({ previewText: 'You have a new message' });
      expect(html).toContain('You have a new message');
    });
  });

  describe('footer', () => {
    it('renders the tenantName in the footer', () => {
      const html = render({ tenantName: 'Mi Restaurante' });
      expect(html).toContain('Mi Restaurante');
    });

    it('includes an unsubscribe link placeholder', () => {
      const html = render();
      expect(html).toContain('unsubscribeUrl');
    });
  });

  describe('children', () => {
    it('renders children content inside the layout', () => {
      const html = render();
      expect(html).toContain('Body content');
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
