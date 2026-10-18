import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

/**
 * Authenticated application shell: sticky header + sidebar + route outlet.
 * The sidebar and page content scroll independently.
 */
export function DashboardLayout() {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="layout-main flex h-screen flex-col bg-slate-50 text-slate-900 dark:bg-dark-950 dark:text-white">
      <Header
        onToggleSidebar={() => setDesktopOpen((prev) => !prev)}
        onToggleMobile={() => setMobileOpen(true)}
      />
      <div className="layout-main-container">
        <Sidebar open={desktopOpen} />
        <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-5 lg:p-8">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}