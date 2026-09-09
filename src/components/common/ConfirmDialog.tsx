import { useLocalization } from '@/i18n/I18nProvider';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  const { t } = useLocalization();
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          {t('Cancel') || 'Cancel'}
        </Button>
        <Button
          variant="danger"
          loading={loading}
          onClick={() => {
            onConfirm();
          }}
        >
          {confirmLabel ?? (t('Confirm') || 'Confirm')}
        </Button>
      </div>
    </Modal>
  );
}