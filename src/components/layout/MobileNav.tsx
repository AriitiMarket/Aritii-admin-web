import { useEffect } from 'react';
import { NavList } from '@/components/layout/NavList';
import { Logo } from '@/components/common/Logo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

export function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white pb-4 shadow-xl dark:bg-dark-900 dark:text-white">
        <div className="flex items-center justify-between px-5 py-4">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-950"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <NavList onNavigate={onClose} />
      </div>
    </div>
  );
}