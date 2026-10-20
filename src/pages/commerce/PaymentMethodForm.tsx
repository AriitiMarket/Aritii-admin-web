import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { TextField } from '@/components/forms/TextField';
import { SelectField } from '@/components/forms/SelectField';
import { commerceService, type PaymentMethodRecord } from '@/services/commerce.service';

type Draft = {
  name: string;
  key: string;
  providerKey: string;
  type: string;
  description: string;
  availableFor: string[];
  supportedTransactionTypes: string[];
  currency: string;
  minAmount: string;
  maxAmount: string;
  fixedFee: string;
  percentageFee: string;
  verificationRequired: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  sortOrder: string;
};

const EMPTY: Draft = {
  name: '',
  key: '',
  providerKey: '',
  type: 'WALLET',
  description: '',
  availableFor: ['BUYERS'],
  supportedTransactionTypes: ['PAYMENT'],
  currency: 'ETB',
  minAmount: '0',
  maxAmount: '',
  fixedFee: '0',
  percentageFee: '0',
  verificationRequired: false,
  status: 'INACTIVE',
  sortOrder: '0',
};

export function PaymentMethodForm({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial?: PaymentMethodRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState('');
  const initialDraftRef = useRef<Draft>(EMPTY);

  useEffect(() => {
    if (!open) return;
    setError('');
    setTestResult(null);
    const newDraft = initial
      ? {
          name: initial.name,
          key: initial.key || '',
          providerKey: initial.providerKey || '',
          type: initial.type,
          description: initial.description || '',
          availableFor: initial.availableFor || ['BUYERS'],
          supportedTransactionTypes: initial.supportedTransactionTypes || ['PAYMENT'],
          currency: initial.currency || 'ETB',
          minAmount: String(initial.minAmount ?? 0),
          maxAmount: String(initial.maxAmount ?? ''),
          fixedFee: String(initial.fixedFee ?? 0),
          percentageFee: String(initial.percentageFee ?? 0),
          verificationRequired: Boolean(initial.verificationRequired),
          status: initial.status,
          sortOrder: String(initial.sortOrder ?? 0),
        }
      : EMPTY;
    setDraft(newDraft);
    initialDraftRef.current = newDraft;
  }, [open, initial]);

  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const toggle = (field: 'availableFor' | 'supportedTransactionTypes', value: string) =>
    update({
      [field]: draft[field].includes(value)
        ? draft[field].filter((x) => x !== value)
        : [...draft[field], value],
    } as Partial<Draft>);

  const hasUnsavedChanges = () => {
    return JSON.stringify(draft) !== JSON.stringify(initialDraftRef.current);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setError('');
    try {
      await commerceService.savePaymentMethod({
        id: initial?.id,
        ...draft,
        minAmount: Number(draft.minAmount),
        maxAmount: draft.maxAmount ? Number(draft.maxAmount) : undefined,
        fixedFee: Number(draft.fixedFee),
        percentageFee: Number(draft.percentageFee),
        sortOrder: Number(draft.sortOrder),
        configured: draft.status === 'ACTIVE' ? initial?.configured || false : false,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save payment method');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!initial?.id) {
      setError('Save the payment method first before testing connection');
      return;
    }
    if (draft.type === 'OFFLINE') {
      setTestResult({ success: true, message: 'Offline method - no connection test needed' });
      return;
    }
    if (!draft.providerKey) {
      setError('Provider key is required to test connection');
      return;
    }

    setTesting(true);
    setTestResult(null);
    setError('');
    try {
      const result = await commerceService.testConnection(initial.id);
      setTestResult(result);
    } catch (err) {
      setTestResult({ success: false, message: err instanceof Error ? err.message : 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  const validateForm = () => {
    if (!draft.name || !draft.name.trim()) {
      setError('Method name is required');
      return false;
    }
    if (!draft.key || !draft.key.trim()) {
      setError('Method key is required');
      return false;
    }
    if (!draft.providerKey || !/^[a-z0-9_]+$/.test(draft.providerKey)) {
      setError('A valid provider key is required (lowercase, numbers, underscore only)');
      return false;
    }
    if (!['OFFLINE', 'BANK', 'WALLET', 'GATEWAY', 'CARD'].includes(draft.type)) {
      setError('Invalid payment method type');
      return false;
    }
    if (!['ACTIVE', 'INACTIVE'].includes(draft.status)) {
      setError('Invalid payment method status');
      return false;
    }
    const minAmt = Number(draft.minAmount);
    const maxAmt = draft.maxAmount ? Number(draft.maxAmount) : Infinity;
    if (isNaN(minAmt) || minAmt < 0) {
      setError('Minimum amount must be a non-negative number');
      return false;
    }
    if (draft.maxAmount && (isNaN(maxAmt) || maxAmt < 0)) {
      setError('Maximum amount must be a non-negative number');
      return false;
    }
    if (draft.maxAmount && maxAmt <= minAmt) {
      setError('Maximum amount must be greater than minimum amount');
      return false;
    }
    const fixedFee = Number(draft.fixedFee);
    const pctFee = Number(draft.percentageFee);
    if (isNaN(fixedFee) || fixedFee < 0) {
      setError('Fixed fee must be a non-negative number');
      return false;
    }
    if (isNaN(pctFee) || pctFee < 0 || pctFee > 100) {
      setError('Percentage fee must be between 0 and 100');
      return false;
    }
    const sortOrder = Number(draft.sortOrder);
    if (isNaN(sortOrder) || sortOrder < 0) {
      setError('Sort order must be a non-negative number');
      return false;
    }
    if (draft.status === 'ACTIVE' && draft.type !== 'OFFLINE' && !initial?.configured) {
      setError('Configure provider settings before activating this method');
      return false;
    }
    return true;
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={initial ? 'Edit payment method' : 'Add payment method'} size="lg">
      <form onSubmit={save} className="space-y-5">
        <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
          Provider secrets are never entered here. Configure them through secure environment-backed settings.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Method name"
            required
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
          />
          <TextField
            label="Method key"
            required
            value={draft.key}
            onChange={(e) => update({ key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })}
          />
          <TextField
            label="Provider key"
            required
            hint="For example: telebirr, cbe_birr, bank_transfer"
            value={draft.providerKey}
            onChange={(e) => update({ providerKey: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
          />
          <SelectField
            label="Payment type"
            value={draft.type}
            onChange={(e) => update({ type: e.target.value })}
            options={['OFFLINE', 'BANK', 'WALLET', 'GATEWAY', 'CARD'].map((value) => ({ value, label: value }))}
          />
          <TextField
            label="Description"
            value={draft.description}
            onChange={(e) => update({ description: e.target.value })}
          />
          <TextField
            label="Currency"
            required
            value={draft.currency}
            onChange={(e) => update({ currency: e.target.value.toUpperCase() })}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Available for</p>
          <div className="flex gap-4">
            {['BUYERS', 'SELLERS'].map((x) => (
              <label key={x} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.availableFor.includes(x)}
                  onChange={() => toggle('availableFor', x)}
                />
                {x === 'BUYERS' ? 'Buyers' : 'Sellers'}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Supported transaction types</p>
          <div className="flex gap-4">
            {['PAYMENT', 'PAYOUT', 'REFUND'].map((x) => (
              <label key={x} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.supportedTransactionTypes.includes(x)}
                  onChange={() => toggle('supportedTransactionTypes', x)}
                />
                {x}
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <TextField
            label="Min amount"
            type="number"
            required
            value={draft.minAmount}
            onChange={(e) => update({ minAmount: e.target.value })}
            min="0"
          />
          <TextField
            label="Max amount"
            type="number"
            value={draft.maxAmount}
            onChange={(e) => update({ maxAmount: e.target.value })}
            min="0"
            hint="Leave empty for no limit"
          />
          <TextField
            label="Fixed fee"
            type="number"
            required
            value={draft.fixedFee}
            onChange={(e) => update({ fixedFee: e.target.value })}
            min="0"
            step="0.01"
          />
          <TextField
            label="Percentage fee"
            type="number"
            required
            value={draft.percentageFee}
            onChange={(e) => update({ percentageFee: e.target.value })}
            min="0"
            max="100"
            step="0.01"
          />
          <TextField
            label="Sort order"
            type="number"
            required
            value={draft.sortOrder}
            onChange={(e) => update({ sortOrder: e.target.value })}
            min="0"
            hint="Lower numbers appear first in checkout"
          />
          <SelectField
            label="Status"
            value={draft.status}
            onChange={(e) => update({ status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
          />
          <TextField
            label="Verification required"
            type="checkbox"
            value={draft.verificationRequired ? 'true' : 'false'}
            onChange={(e) => update({ verificationRequired: e.target.checked })}
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {testResult && (
          <div
            className={`rounded-md p-3 text-sm ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
            role="alert"
          >
            {testResult.message}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose} disabled={saving || testing}>
            Cancel
          </Button>
          {initial && (
            <Button
              type="button"
              variant={draft.type === 'OFFLINE' ? 'outline' : 'secondary'}
              onClick={testConnection}
              disabled={saving || testing || draft.type === 'OFFLINE' || !initial?.id}
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
          )}
          <Button type="submit" disabled={saving || testing}>
            {saving ? 'Saving...' : 'Save Payment Method'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}