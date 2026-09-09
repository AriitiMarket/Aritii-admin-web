import { useToastContext } from '@/context/ToastContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faExclamationTriangle,
  faInfoCircle,
  faXmark,
  faXmarkCircle,
} from '@fortawesome/free-solid-svg-icons';

const ICONS = {
  success: faCheck,
  error: faXmarkCircle,
  info: faInfoCircle,
  warn: faExclamationTriangle,
} as const;

const STYLES = {
  success: 'border-green-300 bg-green-50 dark:bg-green-950/50',
  error: 'border-red-300 bg-red-50 dark:bg-red-950/50',
  info: 'border-sky-300 bg-sky-50 dark:bg-sky-950/50',
  warn: 'border-amber-300 bg-amber-50 dark:bg-amber-950/50',
} as const;

/** Renders stacked toast notifications with screen-reader announcements. */
export function ToastViewport() {
  const { toasts, removeToast } = useToastContext();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-3 shadow-lg ${STYLES[toast.type]}`}
        >
          <span className="mt-0.5 text-gray-700 dark:text-gray-200">
            <FontAwesomeIcon icon={ICONS[toast.type]} />
          </span>
          <div className="min-w-0 flex-1">
            {toast.title && (
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {toast.title}
              </p>
            )}
            <p className="text-sm text-gray-700 dark:text-gray-200">
              {toast.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
            className="rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <FontAwesomeIcon icon={faXmark} size="sm" />
          </button>
        </div>
      ))}
    </div>
  );
}