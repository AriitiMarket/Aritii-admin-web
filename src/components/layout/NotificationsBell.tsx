import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { useAsync } from '@/hooks/useAsync';
import { notificationsService } from '@/services/notifications.service';
import { timeAgo } from '@/utils/format';

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, loading } = useAsync(
    () => notificationsService.list(1, 6),
    []
  );

  const unread = (data?.items ?? []).filter((notification) => !notification.isRead).length;

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        className="relative rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-950"
      >
        <FontAwesomeIcon icon={faBell} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-dark-600 dark:bg-dark-900">
          <p className="border-b border-gray-200 px-4 py-3 text-sm font-semibold dark:border-dark-600 dark:text-white">
            Notifications
          </p>
          <ul className="max-h-80 overflow-y-auto">
            {loading && (
              <li className="px-4 py-3 text-sm text-gray-400">Loading…</li>
            )}
            {!loading && (data?.items ?? []).length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-400">
                No notifications
              </li>
            )}
            {(data?.items ?? []).map((notification) => (
              <li
                key={notification.id}
                className="border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-dark-600/50"
              >
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {notification.title}
                </p>
                {notification.body && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {notification.body}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {timeAgo(notification.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}