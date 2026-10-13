/**
 * Provider-status presentation — TWO separate axes, always shown separately:
 *
 *   ACCOUNT STATUS (Admin-controlled) — the provider lifecycle
 *     pending (PENDING)  ->  approved & active  ->  suspended (DEACTIVATED)
 *     pending (PENDING)  ->  rejected (REJECTED)
 *
 *   AVAILABILITY (provider/system-controlled, READ-ONLY for the Admin)
 *     available | busy | offline
 *
 * The API stores ONE `status` field carrying both axes: `pending` / `rejected` /
 * `suspended` are account states, while `available` / `busy` / `offline` are the
 * operational shift of an ACTIVE provider. Everything here derives from that
 * single field so the list, the filters and the detail panel can never
 * disagree — and so provider status is never confused with delivery status.
 * The Admin sees availability as information; it never sets it (§7, §19).
 */
import {
  PROVIDER_STATUS_LABELS,
  type ProviderStatus,
} from '@/services/providers.service';

export { PROVIDER_STATUS_LABELS };

/** The statuses the "Active" section groups: approved and not suspended. */
export const ACTIVE_PROVIDER_STATUSES: ProviderStatus[] = ['available', 'busy', 'offline'];

/** Statuses that mean "approved and operating" — one Status column value. */
const ACCOUNT_ACTIVE: ProviderStatus[] = ['available', 'busy', 'offline'];

export interface StateBadge {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
}

/**
 * The ONE account-status badge: Pending / Rejected / Active / Deactivated.
 * This replaces the old two-column "Approval + Active/Suspended" split.
 */
export function accountStateOf(status?: string): StateBadge {
  switch (status) {
    case 'pending':
      return { label: 'Pending', variant: 'warning' };
    case 'rejected':
      return { label: 'Rejected', variant: 'danger' };
    case 'suspended':
      // Backend value `suspended` == the Admin lifecycle's DEACTIVATED.
      return { label: 'Deactivated', variant: 'neutral' };
    default:
      return ACCOUNT_ACTIVE.includes(status as ProviderStatus)
        ? { label: 'Active', variant: 'success' }
        : { label: '—', variant: 'neutral' };
  }
}

/**
 * The provider's availability — READ-ONLY information for the Admin.
 * Only meaningful for an ACTIVE provider; anything else reads as "—".
 */
export function operationalStateOf(status?: string): StateBadge {
  if (!ACCOUNT_ACTIVE.includes(status as ProviderStatus)) {
    return { label: '—', variant: 'neutral' };
  }
  const label = PROVIDER_STATUS_LABELS[status as ProviderStatus] ?? status ?? '—';
  const variant: StateBadge['variant'] =
    status === 'available' ? 'success' : status === 'busy' ? 'info' : 'neutral';
  return { label, variant };
}
