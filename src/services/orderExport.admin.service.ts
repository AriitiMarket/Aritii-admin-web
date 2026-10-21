import { http } from '@/services/client/httpClient';

/**
 * Order Export service (CSV / PDF download for fulfillment & analytics).
 *
 * Backing endpoints (commerce-service, mounted at /order-export):
 *   GET /order-export/csv          -> text/csv (Content-Disposition attachment)
 *   GET /order-export/pdf          -> application/pdf
 *   GET /order-export/json/:orderId -> single-order JSON (packing-slip data)
 *
 * These return a file body, so the client requests `blob` and the browser's
 * object-URL download is triggered by the caller (see useOrderExport).
 */
export type ExportFormat = 'csv' | 'pdf';

class OrderExportService {
  /**
   * Export the (filtered) order list as a file blob.
   * @param {ExportFormat} format
   * @param {Object} filters - query filters forwarded to the backend
   *   (status, startDate, endDate, shopId, businessId, …)
   * @returns {Promise<{blob: Blob, filename: string}>}
   */
  async exportOrders(
    format: ExportFormat,
    filters: Record<string, string | number | undefined> = {}
  ): Promise<{ blob: Blob; filename: string }> {
    // Drop empty/undefined filters so the query string stays clean.
    const params = Object.fromEntries(
      Object.entries(filters).filter(
        ([, value]) => value !== undefined && value !== '' && value !== null
      )
    ) as Record<string, string | number>;

    try {
      const blob = await http.get<Blob>(`/order-export/${format}`, {
        params,
        responseType: 'blob',
      });

      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      return { blob, filename: `orders-${stamp}.${format}` };
    } catch (err) {
      throw new Error(`Failed to export orders: ${(err as Error).message}`);
    }
  }

  /**
   * Export a single order as JSON (used for packing slips / integrations).
   * @param {string} orderId
   * @returns {Promise<Object>}
   */
  async exportSingleOrderJSON(orderId: string): Promise<unknown> {
    if (!orderId) throw new Error('Order ID is required');

    try {
      const data = await http.get<unknown>(
        `/order-export/json/${orderId}`
      );
      return data;
    } catch (err) {
      throw new Error(
        `Failed to export order ${orderId}: ${(err as Error).message}`
      );
    }
  }
}

export const orderExportService = new OrderExportService();

/**
 * Trigger a browser download for a blob. Extracted here so both the bulk
 * orders page and the single-order detail view share one implementation.
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke on the next tick so Safari has time to start the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}