'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { MODULE_ICONS } from '@/lib/module-icons';
import { MODULES, NAV_LINKS } from '@/lib/navigation';

import { Logo } from './Logo';

export function Navbar(): React.JSX.Element {
  const pathname = usePathname();
  const isHome = pathname === '/';

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);
  const [mobileModulesOpen, setMobileModulesOpen] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const solid = scrolled || !isHome;
  const textColor = solid ? 'text-brand-900' : 'text-white';

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        solid ? 'bg-white/95 shadow-sm backdrop-blur-md' : 'bg-transparent',
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className={textColor}>
          <Logo />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) =>
            link.hasDropdown ? (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => setModulesOpen(true)}
                onMouseLeave={() => setModulesOpen(false)}
              >
                <button
                  type="button"
                  className={cn(
                    'flex items-center gap-1 text-sm font-medium transition-colors',
                    textColor,
                  )}
                >
                  {link.label}
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', modulesOpen && 'rotate-180')}
                  />
                </button>

                <AnimatePresence>
                  {modulesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-1/2 top-full grid w-[520px] -translate-x-1/2 grid-cols-2 gap-1 rounded-2xl border border-neutral-100 bg-white p-4 shadow-xl"
                    >
                      {MODULES.map((mod) => {
                        const Icon = MODULE_ICONS[mod.icon];
                        return (
                          <Link
                            key={mod.href}
                            href={mod.href}
                            className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-neutral-50"
                          >
                            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', mod.color)} />
                            <span>
                              <span className="block text-sm font-semibold text-brand-900">
                                {mod.label}
                              </span>
                              <span className="block text-xs text-neutral-500">
                                {mod.description}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className={cn('text-sm font-medium transition-colors hover:opacity-70', textColor)}
              >
                {link.label}
              </Link>
            ),
          )}
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <Link
            href="/contacto"
            className={cn('text-sm font-medium transition-colors hover:opacity-70', textColor)}
          >
            Iniciar sesión
          </Link>
          <Button href="/contacto" size="sm">
            Solicitar Demo
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          className={cn('lg:hidden', textColor)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 top-[68px] z-40 overflow-y-auto bg-brand-950 px-6 pb-10 pt-6 lg:hidden"
          >
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
              className="flex flex-col gap-1"
            >
              {NAV_LINKS.map((link) =>
                link.hasDropdown ? (
                  <motion.div
                    key={link.label}
                    variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                  >
                    <button
                      type="button"
                      onClick={() => setMobileModulesOpen((open) => !open)}
                      className="flex w-full items-center justify-between py-3 text-lg font-medium text-white"
                    >
                      {link.label}
                      <ChevronDown
                        className={cn(
                          'h-5 w-5 transition-transform',
                          mobileModulesOpen && 'rotate-180',
                        )}
                      />
                    </button>
                    <AnimatePresence>
                      {mobileModulesOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pl-4"
                        >
                          {MODULES.map((mod) => (
                            <Link
                              key={mod.href}
                              href={mod.href}
                              className="block py-2 text-white/70 hover:text-white"
                            >
                              {mod.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div
                    key={link.label}
                    variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                  >
                    <Link href={link.href} className="block py-3 text-lg font-medium text-white">
                      {link.label}
                    </Link>
                  </motion.div>
                ),
              )}

              <motion.div
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                className="mt-6"
              >
                <Button href="/contacto" className="w-full">
                  Solicitar Demo
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
