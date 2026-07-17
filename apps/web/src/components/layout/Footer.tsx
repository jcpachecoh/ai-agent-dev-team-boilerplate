import { Instagram, Linkedin, Twitter } from 'lucide-react';
import Link from 'next/link';

import { COMPANY_LINKS, LEGAL_LINKS, MODULES } from '@/lib/navigation';

import { Logo } from './Logo';

const SOCIAL_LINKS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/opssync', icon: Linkedin },
  { label: 'X (Twitter)', href: 'https://twitter.com/opssynk', icon: Twitter },
  { label: 'Instagram', href: 'https://instagram.com/opssynk', icon: Instagram },
];

export function Footer(): React.JSX.Element {
  return (
    <footer className="border-t border-white/10 bg-brand-950 text-neutral-400">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo className="text-white" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              Plataforma ERP multi-sede para restaurantes en LATAM: POS, inventarios, nómina,
              contabilidad y producción en una sola app.
            </p>
            <div className="mt-6 flex gap-4">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="text-neutral-400 transition-colors hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Producto</h3>
            <ul className="mt-4 space-y-3">
              {MODULES.map((mod) => (
                <li key={mod.href}>
                  <Link href={mod.href} className="text-sm transition-colors hover:text-white">
                    {mod.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Empresa</h3>
            <ul className="mt-4 space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Legal</h3>
            <ul className="mt-4 space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm sm:flex-row">
          <p>&copy; {new Date().getFullYear()} OpsSync. Todos los derechos reservados.</p>
          <p>Hecho con ❤️ en Colombia</p>
        </div>
      </div>
    </footer>
  );
}
