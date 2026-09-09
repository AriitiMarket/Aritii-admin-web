/** Toast feedback context (migrated from legacy toast.context). */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warn';

export interface ToastMessage {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
}

export type ShowToastInput =
  | Omit<ToastMessage, 'id'>
  | string;

interface ToastContextValue {
  toasts: ToastMessage[];
  showToast: (toast: ShowToastInput) => void;
  removeToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_DURATION_MS = 5000;
const MAX_TOASTS = 5;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(1);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (input: ShowToastInput) => {
      const message: ToastMessage =
        typeof input === 'string'
          ? { id: nextId.current++, type: 'info', message: input }
          : { ...input, id: nextId.current++ };

      setToasts((prev) => {
        const queue = [...prev, message];
        return queue.length > MAX_TOASTS ? queue.slice(queue.length - MAX_TOASTS) : queue;
      });

      window.setTimeout(() => removeToast(message.id), TOAST_DURATION_MS);
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({ toasts, showToast, removeToast }),
    [toasts, showToast, removeToast]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToastContext(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}