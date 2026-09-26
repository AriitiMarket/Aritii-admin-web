import { twMerge } from 'tailwind-merge';
import { NavList } from '@/components/layout/NavList';
import { Logo } from '@/components/common/Logo';

export function Sidebar({ open }: { open: boolean }) {
  return (
    <aside
      id="app-sidebar"
      aria-label="Sidebar"
      className={twMerge(
        'hidden shrink-0 overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-300 dark:border-dark-600 dark:bg-dark-900 lg:block',
        open ? 'w-64' : 'w-0'
      )}
    >
      <div
        className={twMerge(
          'flex h-full w-64 flex-col overflow-y-auto transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <div className="mb-4 flex-shrink-0 px-5 py-4">
          <Logo />
        </div>
        <nav className="flex-1 overflow-y-auto">
          <NavList />
        </nav>
      </div>
    </aside>
  );
}