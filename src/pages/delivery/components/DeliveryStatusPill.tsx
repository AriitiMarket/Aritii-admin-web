import { getDeliveryStatusColor, getDeliveryStatusLabel } from '../utils/statusHelpers';

/**
 * The single delivery-status badge used on every page of the module.
 *
 * Canonical label (`DELIVERY_STATUSES`) + canonical color
 * (`DELIVERY_STATUS_COLORS`), so the same backend status renders identically
 * on Deliveries, Assignments, Overview, Tracking, Requests, Operations and the
 * dispatch panels.
 */
export function DeliveryStatusPill({
  status,
  className,
}: {
  status?: string | null;
  className?: string;
}) {
  if (!status) return <span className="text-gray-400">—</span>;
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${getDeliveryStatusColor(
        status
      )}${className ? ` ${className}` : ''}`}
    >
      {getDeliveryStatusLabel(status)}
    </span>
  );
}
