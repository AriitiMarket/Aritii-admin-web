import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';

/**
 * Authenticated application shell: sticky header + sidebar + route outlet.
 * The sidebar and page content scroll independently.
 */
export function DashboardLayout() {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="layout-main flex h-screen w-full flex-col bg-slate-50 text-slate-900 dark:bg-dark-950 dark:text-white">
      <Header
        onToggleSidebar={() => setDesktopOpen((prev) => !prev)}
        onToggleMobile={() => setMobileOpen(true)}
      />
      <div className="layout-main-container w-full flex-1 overflow-hidden">
        <Sidebar open={desktopOpen} />
        <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-4 pt-3 pb-6 sm:px-6 sm:pt-4 sm:pb-8 lg:px-8 lg:pt-5 lg:pb-10">
            <Breadcrumbs />
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}