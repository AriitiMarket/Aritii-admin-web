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
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-dark-950">
      <div className="grid h-full w-full lg:grid-cols-12 overflow-hidden">
        {/* Left Hero Pane (Visible on lg and above) */}
        <aside className="relative hidden h-full flex-col justify-between overflow-hidden bg-slate-950 p-8 text-white lg:col-span-5 lg:flex xl:col-span-5 xl:p-10">
          {/* Ambient Background Glows */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-lime-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

          {/* Top Logo & Enterprise Badge */}
          <div className="relative z-10 flex items-center justify-between">
            <Logo />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-500/30 bg-lime-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-lime-400">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse" />
              Marketplace Admin
            </span>
          </div>

          {/* Central Showcase Content */}
          <div className="relative z-10 my-auto py-4">
            <h1 className="text-2xl font-extrabold tracking-tight text-white xl:text-3xl">
              {t('Operations Center for')} <br />
              <span className="bg-gradient-to-r from-lime-400 via-emerald-300 to-green-400 bg-clip-text text-transparent">
                {t('Multi-Vendor E-Commerce')}
              </span>
            </h1>

            <p className="mt-3 text-xs leading-relaxed text-slate-300 xl:text-sm">
              {t(
                'Centralized administration for vendor stores, catalogs, real-time fulfillment, dispute arbitrations, and financial settlements.'
              )}
            </p>

            {/* Feature Pills */}
            <div className="mt-5 space-y-2.5">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md transition-colors hover:border-lime-500/40">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-lime-500/20 text-lime-400">
                  <FontAwesomeIcon icon={faStore} className="text-xs" />
                </span>
                <div>
                  <p className="text-xs font-bold text-white">{t('Merchant & Store Governance')}</p>
                  <p className="text-[11px] text-slate-400">{t('Vendor onboarding, product catalogs & commission tiers')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md transition-colors hover:border-lime-500/40">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <FontAwesomeIcon icon={faTruckFast} className="text-xs" />
                </span>
                <div>
                  <p className="text-xs font-bold text-white">{t('Order Fulfillment & Logistics Dispatch')}</p>
                  <p className="text-[11px] text-slate-400">{t('Live order pipelines, SLA breach monitoring & courier routing')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md transition-colors hover:border-lime-500/40">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-xs" />
                </span>
                <div>
                  <p className="text-xs font-bold text-white">{t('Enterprise Security & Ledgers')}</p>
                  <p className="text-[11px] text-slate-400">{t('OAuth 2.1 PKCE, wallet payouts & double-entry reconciliation')}</p>
                </div>
              </div>
            </div>

            {/* Live Platform Health Card */}
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3 backdrop-blur-md">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-emerald-300">{t('Marketplace Core Services Active')}</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-400/80">Gateway · Commerce · Logistics</span>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="relative z-10 flex items-center justify-between text-xs text-slate-500">
            <span>© {new Date().getFullYear()} Aritii Market Inc.</span>
            <div className="flex gap-4">
              <span className="hover:text-slate-400 cursor-pointer">{t('Privacy')}</span>
              <span className="hover:text-slate-400 cursor-pointer">{t('Security')}</span>
              <span className="hover:text-slate-400 cursor-pointer">{t('Compliance')}</span>
            </div>
          </div>
        </aside>

        {/* Right Authentication Pane */}
        <main className="flex h-full flex-col justify-between overflow-y-auto p-4 sm:p-6 lg:col-span-7 xl:col-span-7 xl:p-8">
          {/* Top Controls: Mobile Logo + Language & Theme Toggles */}
          <div className="flex items-center justify-between shrink-0">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
          </div>

          {/* Centered Form Outlet */}
          <div className="my-auto mx-auto w-full max-w-md py-3">
            <Outlet />
          </div>

          {/* Bottom Compliance Badge */}
          <div className="mt-auto shrink-0 pt-2 text-center text-xs text-slate-400 dark:text-slate-500">
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