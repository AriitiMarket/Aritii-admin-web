import { Outlet } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';

/**
 * Public authentication shell (login and related screens).
 */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-white px-4 dark:bg-dark-950">
      <div className="mb-6">
        <Logo />
      </div>
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-600 dark:bg-dark-900">
        <Outlet />
      </div>
      <p className="mt-6 text-xs text-gray-400">
        © {new Date().getFullYear()} Aritii Market
      </p>
    </div>
  );
}