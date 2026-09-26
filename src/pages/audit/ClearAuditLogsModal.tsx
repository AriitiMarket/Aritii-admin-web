import { useEffect, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { TextField } from '@/components/forms/TextField';
import { SelectField } from '@/components/forms/SelectField';
import { auditService } from '@/services/audit.service';
import { ApiError } from '@/types/api';

/** Must match the phrase the server requires — kept in one place. */
const CONFIRM_PHRASE = 'DELETE AUDIT LOGS';
const MIN_REASON = 10;

const SCOPE_OPTIONS = [
  { value: 'all', label: 'Everything' },
  { value: 'range', label: 'Date range only' },
];

/**
 * Destructive "clear audit logs" dialog.
 *
 * Clearing an audit log destroys the evidence trail, so this deliberately
 * forces a decision rather than allowing a single click:
 *   - the real number of matching logs is previewed before anything is deleted,
 *   - scoping is offered (all, or a bounded date range),
 *   - a reason is mandatory and is stored on the audit record of the purge,
 *   - the admin must type the exact confirmation phrase,
 *   - the server re-audits the purge, so the action is never silent.
 */
export function ClearAuditLogsModal({
  open,
  onClose,
  onCleared,
  filterOptions,
}: {
  open: boolean;
  onClose: () => void;
  onCleared: () => void;
  filterOptions: { modules: string[]; actions: string[] };
}) {
  const [scope, setScope] = useState<'all' | 'range'>('range');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [module, setModule] = useState('');
  const [reason, setReason] = useState('');
  const [phrase, setPhrase] = useState('');
  const [preview, setPreview] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const range = scope === 'range' && !!(startDate || endDate);

  useEffect(() => {
    if (!open) return;
    setReason(''); setPhrase(''); setError(null);
    setScope('range'); setStartDate(''); setEndDate(''); setModule('');
  }, [open]);

  // Preview the real affected count whenever the scope changes.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    auditService
      .previewPurge({
        module: module || undefined,
        startDate: range ? startDate || undefined : undefined,
        endDate: range ? endDate || undefined : undefined,
      })
      .then((r) => { if (!cancelled) setPreview(r.total); })
      .catch(() => { if (!cancelled) setPreview(null); });
    return () => { cancelled = true; };
  }, [open, range, startDate, endDate, module]);

  const canSubmit =
    reason.trim().length >= MIN_REASON &&
    phrase === CONFIRM_PHRASE &&
    !busy &&
    (preview ?? 0) > 0;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await auditService.clearLogs({
        reason: reason.trim(),
        confirm: phrase,
        module: module || undefined,
        startDate: range ? startDate || undefined : undefined,
        endDate: range ? endDate || undefined : undefined,
      });
      onCleared();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not clear audit logs');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Clear Audit Logs" size="lg">
      <div className="space-y-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          <p className="font-semibold">This permanently deletes audit records and cannot be undone.</p>
          <p className="mt-1">
            Export the logs first if you need a copy. Every purge is itself recorded as a critical
            audit entry, including who did it and why.
          </p>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-200">
          {preview === null
            ? 'Counting matching logs…'
            : <><span className="font-semibold">{preview}</span> audit log{preview === 1 ? '' : 's'} will be permanently deleted.</>}
        </p>

        <SelectField
          label="What to clear"
          value={scope}
          onChange={(e) => setScope(e.target.value as 'all' | 'range')}
          options={SCOPE_OPTIONS}
        />

        {scope === 'range' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="From" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <TextField label="To" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        )}

        <SelectField
          label="Module (optional)"
          value={module}
          onChange={(e) => setModule(e.target.value)}
          options={[
            { value: '', label: 'All modules' },
            ...filterOptions.modules.map((m) => ({ value: m, label: m })),
          ]}
        />

        <TextField
          label={`Reason (required, min ${MIN_REASON} characters)`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Removing test data generated during staging seeding"
        />

        <TextField
          label={`Type "${CONFIRM_PHRASE}" to confirm`}
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder={CONFIRM_PHRASE}
        />

        {error && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="danger" onClick={submit} loading={busy} disabled={!canSubmit}>
            {busy ? 'Clearing…' : 'Clear Audit Logs'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
