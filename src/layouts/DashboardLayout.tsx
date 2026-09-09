import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

/**
 * Authenticated application shell: header + sidebar + route outlet.
 * The header stays sticky; page content scrolls independently.
 */
export function DashboardLayout() {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="layout-main flex h-screen flex-col bg-gray-50 dark:bg-dark-950 dark:text-white">
      <Header
        onToggleSidebar={() => setDesktopOpen((prev) => !prev)}
        onToggleMobile={() => setMobileOpen(true)}
      />
      <div className="layout-main-container">
        <Sidebar open={desktopOpen} />
        <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  );
}