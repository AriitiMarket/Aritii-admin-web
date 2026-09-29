/**
 * UserPicker — pick a platform user by NAME.
 *
 * Filters and assignment fields used to take a raw uuid ("Seller ID", "Buyer
 * ID"), which nobody can read and everybody mistypes. This control searches
 * the identity directory by name/email (narrowed to one role when the field is
 * role-specific) and exposes the id to the caller, so the FIELD speaks names
 * while the QUERY still speaks ids.
 *
 * The selected id renders as its name (via the shared user directory), so the
 * control looks the same before and after a selection.
 */
import { useEffect, useId, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { identityAdmin } from '@/api/admin';
import { useDebounce } from '@/hooks/useDebounce';
import { useUserDirectory } from '@/hooks/useUserDirectory';

export interface UserPickerProps {
  label?: string;
  /** Selected user id ('' = nothing selected). */
  value: string;
  onChange: (userId: string) => void;
  /** Restrict the search to one role — e.g. 'SELLER' for a seller filter. */
  role?: string;
  placeholder?: string;
  className?: string;
}

interface Option {
  id: string;
  name: string;
  email: string;
}

export function UserPicker({
  label,
  value,
  onChange,
  role,
  placeholder = 'Search by name…',
  className = '',
}: UserPickerProps) {
  const listId = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 250);

  // Selected id -> its name, so the input shows "TechHub Seller", not a uuid.
  const { nameFor, emailFor } = useUserDirectory(value ? [value] : []);

  useEffect(() => {
    let cancelled = false;
    const term = debouncedQuery.trim();
    if (!open && !term) {
      setOptions([]);
      return;
    }
    setLoading(true);
    identityAdmin
      .listUsers(1, 8, term, role || '')
      .then((result) => {
        if (cancelled) return;
        setOptions(
          (result.items ?? []).map((user) => {
            // `/admin/users` answers with the directory shape (`id`); the
            // AdminUser variant of the shared type spells it `userId`.
            const entry = user as { id?: string; userId?: string; name?: string; email?: string };
            return {
              id: String(entry.id ?? entry.userId ?? ''),
              name: entry.name || entry.email || '',
              email: entry.email || '',
            };
          })
        );
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setOptions([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open, role]);

  // Close on outside click (a blur race would otherwise swallow the selection).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const selectedName = value ? nameFor(value) : '';
  const selectedEmail = value ? emailFor(value) : '';
  const displayValue = query || (value ? (selectedName || selectedEmail || 'Selected user') : '');

  const select = (option: Option) => {
    onChange(option.id);
    setQuery('');
    setOpen(false);
  };

  const clear = (event: ReactMouseEvent) => {
    event.preventDefault();
    onChange('');
    setQuery('');
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
        </span>
      )}
      <div className="relative">
        <input
          id={listId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={displayValue}
          placeholder={placeholder}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 pr-7 text-xs text-gray-800 placeholder:text-gray-400 focus:border-primary-dark focus:outline-none focus:ring-1 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
        />
        {value && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear selection"
            className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
      {open && (
        <ul
          role="listbox"
          id={listId}
          className="absolute z-30 mt-1 max-h-60 w-full min-w-[16rem] overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-dark-600 dark:bg-dark-900"
        >
          {loading && <li className="px-3 py-2 text-xs text-gray-500">Searching…</li>}
          {!loading && options.length === 0 && (
            <li className="px-3 py-2 text-xs text-gray-500">No users found</li>
          )}
          {!loading &&
            options.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => select(option)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-dark-800 ${
                    option.id === value ? 'bg-gray-50 dark:bg-dark-800' : ''
                  }`}
                >
                  <span className="truncate text-gray-800 dark:text-gray-100">{option.name}</span>
                  <span className="truncate text-xs text-gray-500">{option.email}</span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
