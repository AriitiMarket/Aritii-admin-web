import { PaymentLedgerViewer } from '@/components/PaymentLedgerViewer';

/**
 * ADMIN PAYMENT LEDGER PAGE - Financial transaction tracking
 */
export function AdminPaymentLedgerPage() {
  return (
    <div className="admin-payment-ledger-page">
      <PaymentLedgerViewer />
    </div>
  );
}

export default AdminPaymentLedgerPage;
