import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { useLocalization } from '@/i18n/I18nProvider';
import { Button } from '@/components/common/Button';
import { apiErrorMessage } from '@/utils/error';
import {
  orderExportService,
  triggerDownload,
  type ExportFormat,
} from '@/services/orderExport.admin.service';

export interface OrderExportButtonProps {
  /** Current filter values forwarded to the export endpoint. */
  filters: Record<string, string | number | undefined>;
}

/**
 * ExportButton — download the currently-filtered order list as CSV or PDF.
 *
 * Wraps GET /order-export/{csv|pdf} and triggers a browser download. The
 * filters prop should carry the same query state the table is showing so the
 * export matches what the operator sees on screen.
 */
export function OrderExportButton({ filters }: OrderExportButtonProps) {
  const { t } = useLocalization();
  const { showToast } = useToast();
  const [busyFormat, setBusyFormat] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setBusyFormat(format);
    try {
      const { blob, filename } = await orderExportService.exportOrders(
        format,
        filters
      );
      triggerDownload(blob, filename);
      showToast({ type: 'success', message: t('Export downloaded') });
    } catch (err) {
      showToast({
        type: 'error',
        message: apiErrorMessage(err, t('Could not export orders')),
      });
    } finally {
      setBusyFormat(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="md"
        variant="outline"
        loading={busyFormat === 'csv'}
        onClick={() => void handleExport('csv')}
      >
        {t('Export CSV')}
      </Button>
      <Button
        size="md"
        variant="outline"
        loading={busyFormat === 'pdf'}
        onClick={() => void handleExport('pdf')}
      >
        {t('Export PDF')}
      </Button>
    </div>
  );
}

export default OrderExportButton;