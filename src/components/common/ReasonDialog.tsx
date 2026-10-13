import { useEffect, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/forms/TextField';

/**
 * Branded replacement for `window.prompt` when an action needs a reason
 * (rejection, cancellation notes).
 *
 * Per the module's UX rules a reason dialog is only for short actions that
 * require immediate confirmation — detail views belong in `RecordDrawer`.
 */
export function ReasonDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  placeholder = 'Reason shown to the applicant',
  loading = false,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  placeholder?: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('');
      setTouched(false);
    }
  }, [open]);

  const invalid = !reason.trim();

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        {message && (
          <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
        )}
        <TextField
          label="Reason"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          error={touched && invalid ? 'A reason is required.' : undefined}
          disabled={loading}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={loading}
            disabled={invalid}
            onClick={() => onConfirm(reason.trim())}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
