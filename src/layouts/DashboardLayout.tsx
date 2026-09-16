import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { HierarchySelector } from '@/components/HierarchySelector';
import { AdminScopeBar } from '@/components/AdminScopeBar';

/**
 * Authenticated application shell: header + hierarchy selector + scope bar + sidebar + route outlet.
 * The header and hierarchy selector stay sticky; admin scope bar and page content scroll independently.
 *
 * HIERARCHY FLOW:
 * 1. HierarchySelector (sidebar) — admin selects hierarchy
 * 2. AdminScopeBar (top of pages) — shows current scope
 * 3. Page modules — use useHierarchy() to filter data
 */
export function DashboardLayout() {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showHierarchySelector, setShowHierarchySelector] = useState(false);

  return (
    <div className="layout-main flex h-screen flex-col bg-gray-50 dark:bg-dark-950 dark:text-white">
      <Header
        onToggleSidebar={() => setDesktopOpen((prev) => !prev)}
        onToggleMobile={() => setMobileOpen(true)}
      />
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-dark-700 dark:bg-dark-900 lg:px-6">
        <HierarchySelector />
      </div>
      <div className="layout-main-container">
        <Sidebar open={desktopOpen} />
        <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <main className="flex-1 overflow-y-auto">
          {/* Unified Admin Scope Bar — shows on every page */}
          <AdminScopeBar onSelectHierarchy={() => setShowHierarchySelector(true)} />
          
          <div className="p-4 lg:p-6">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}