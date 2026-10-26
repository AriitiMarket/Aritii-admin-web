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
    <div className="layout-main fixed inset-0 flex h-full w-full flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-dark-950 dark:text-white">
      <Header
        onToggleSidebar={() => setDesktopOpen((prev) => !prev)}
        onToggleMobile={() => setMobileOpen(true)}
      />
      <div className="layout-main-container flex-1 min-h-0 min-w-0 w-full flex overflow-hidden">
        <Sidebar open={desktopOpen} />
        <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1600px] px-4 pt-3 pb-8 sm:px-6 sm:pt-4 sm:pb-10 lg:px-8 lg:pt-5 lg:pb-12">
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