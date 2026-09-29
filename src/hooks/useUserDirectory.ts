/**
 * User directory — resolves user ids to NAMES.
 *
 * The console shows a person's name everywhere a person appears (orders,
 * overview, transactions, delivery requests) and a raw uuid only as a last
 * resort. A page of rows can carry dozens of different ids, so the lookup is
 *   * batched  (one request per 40 ids, not one per cell),
   * shared    (module-level cache: two tables on one screen never refetch),
   * idempotent (ids that resolve to nothing are remembered as misses, so an
   *     unknown id cannot schedule the same request again).
 *
 * All of that lives here; screens just call `useUserDirectory(ids)` and then
 * `nameFor(id)`.
 */
import { useEffect, useMemo, useState } from 'react';
import { identityAdmin } from '@/api/admin';

export interface UserBrief {
  name: string;
  email: string;
}

const BATCH_SIZE = 40;

/** id -> directory entry. Empty strings mean "known miss" (user not found). */
const cache = new Map<string, UserBrief>();
/** Ids currently in flight, so concurrent tables do not double-fetch. */
const inFlight = new Set<string>();
/** Bump on every cache change so mounted hooks re-render. */
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

async function loadMissing(ids: string[]): Promise<void> {
  const missing = ids.filter((id) => !cache.has(id) && !inFlight.has(id));
  if (missing.length === 0) return;
  missing.forEach((id) => inFlight.add(id));
  try {
    for (let index = 0; index < missing.length; index += BATCH_SIZE) {
      const batch = missing.slice(index, index + BATCH_SIZE);
      const users = await identityAdmin.listUsersByIds(batch);
      const found = new Set<string>();
      for (const user of users) {
        const id = String((user as { id?: string }).id ?? '');
        if (!id) continue;
        found.add(id);
        cache.set(id, { name: user.name || '', email: user.email || '' });
      }
      // Remember the misses too: an id that no longer exists must not be
      // requested again on every render of every table that still shows it.
      for (const id of batch) {
        if (!found.has(id)) cache.set(id, { name: '', email: '' });
      }
    }
    notify();
  } catch {
    // Leave the ids uncached so the next mount retries; the effect only runs
    // when the id set changes, so this cannot loop.
  } finally {
    missing.forEach((id) => inFlight.delete(id));
  }
}

export interface UserDirectory {
  /** Display name, or '' while loading / when the id is unknown. */
  nameFor: (id?: string | null) => string;
  /** Email, or '' when unknown. */
  emailFor: (id?: string | null) => string;
  /** Both fields at once, for cells that want the name plus a hover/second line. */
  briefFor: (id?: string | null) => UserBrief;
}

/**
 * Subscribes to the directory for the given ids and re-renders when their
 * names arrive. Pass the ids a screen displays — the hook dedupes, batches
 * and caches the lookups itself.
 */
export function useUserDirectory(ids: (string | null | undefined)[]): UserDirectory {
  const idsKey = useMemo(
    () => Array.from(new Set(ids.filter((id): id is string => Boolean(id)))).sort().join(','),
    // `ids` is usually built inline, so the join is the real identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids.join(',')]
  );

  const [version, setVersion] = useState(0);

  useEffect(() => {
    const listener = () => setVersion((value) => value + 1);
    listeners.add(listener);
    if (idsKey) void loadMissing(idsKey.split(','));
    return () => {
      listeners.delete(listener);
    };
  }, [idsKey]);

  return useMemo(() => {
    const briefFor = (id?: string | null): UserBrief =>
      (id && cache.get(id)) || { name: '', email: '' };
    return {
      briefFor,
      nameFor: (id?: string | null) => briefFor(id).name,
      emailFor: (id?: string | null) => briefFor(id).email,
    };
    // `version` is the trigger that a fetch resolved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, version]);
}
