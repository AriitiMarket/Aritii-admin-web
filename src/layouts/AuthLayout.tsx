import { Outlet } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faStore,
  faTruckFast,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useLocalization } from '@/i18n/I18nProvider';

export function AuthLayout() {
  const { t } = useLocalization();

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-dark-950">
      <div className="grid min-h-screen w-full lg:grid-cols-12">
        {/* Left Hero Pane (Visible on lg and above) */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:col-span-5 lg:flex xl:col-span-5 xl:p-14">
          {/* Ambient Background Glows */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-lime-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

          {/* Top Logo & Enterprise Badge */}
          <div className="relative z-10 flex items-center justify-between">
            <Logo />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-500/30 bg-lime-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-lime-400">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse" />
              Console v2.0
            </span>
          </div>

          {/* Central Showcase Content */}
          <div className="relative z-10 my-auto py-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-white xl:text-4xl">
              {t('The Operating System for')} <br />
              <span className="bg-gradient-to-r from-lime-400 via-emerald-300 to-green-400 bg-clip-text text-transparent">
                {t('Modern Multi-Vendor Commerce')}
              </span>
            </h1>

            <p className="mt-4 text-sm leading-relaxed text-slate-300 xl:text-base">
              {t(
                'Complete end-to-end administration for multi-sector marketplace operations, live delivery dispatch, and seller management.'
              )}
            </p>

            {/* Feature Pills */}
            <div className="mt-8 space-y-3.5">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition-colors hover:border-lime-500/40">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime-500/20 text-lime-400">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-sm" />
                </span>
                <div>
                  <p className="text-xs font-bold text-white">{t('Enterprise Zero-Trust Security')}</p>
                  <p className="text-[11px] text-slate-400">{t('Multi-factor TOTP & granular role permission gates')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition-colors hover:border-lime-500/40">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <FontAwesomeIcon icon={faStore} className="text-sm" />
                </span>
                <div>
                  <p className="text-xs font-bold text-white">{t('Multi-Sector Store Management')}</p>
                  <p className="text-[11px] text-slate-400">{t('Instant KYC approvals, product catalogs & commission tiers')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition-colors hover:border-lime-500/40">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                  <FontAwesomeIcon icon={faTruckFast} className="text-sm" />
                </span>
                <div>
                  <p className="text-xs font-bold text-white">{t('Real-Time Logistics & Fleet Tracking')}</p>
                  <p className="text-[11px] text-slate-400">{t('Live order fulfillment and automated rider settlements')}</p>
                </div>
              </div>
            </div>

            {/* Live Platform Health Card */}
            <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-emerald-300">{t('All Core Services Operational')}</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-400/80">99.99% Uptime</span>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="relative z-10 flex items-center justify-between text-xs text-slate-500">
            <span>© {new Date().getFullYear()} Aritii Market Inc.</span>
            <div className="flex gap-4">
              <span className="hover:text-slate-400 cursor-pointer">{t('Privacy')}</span>
              <span className="hover:text-slate-400 cursor-pointer">{t('Security')}</span>
              <span className="hover:text-slate-400 cursor-pointer">{t('Terms')}</span>
            </div>
          </div>
        </aside>

        {/* Right Authentication Pane */}
        <main className="flex flex-col justify-between p-6 sm:p-10 lg:col-span-7 xl:col-span-7 xl:p-14">
          {/* Top Controls: Mobile Logo + Language & Theme Toggles */}
          <div className="flex items-center justify-between">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
          </div>

          {/* Centered Form Outlet */}
          <div className="my-auto mx-auto w-full max-w-md py-6">
            <Outlet />
          </div>

          {/* Bottom Compliance Badge */}
          <div className="mt-auto pt-6 text-center text-xs text-slate-400 dark:text-slate-500">
            <div className="flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faCheckCircle} className="text-lime-600 dark:text-lime-400 text-xs" />
              <span>{t('Encrypted Session · TLS 1.3 · Restricted Operator Access')}</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}