import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/common/Button';
import { providerPayoutsService, type ProviderPayout, type ProviderWallet } from '@/services/providerPayouts.service';
import { apiErrorMessage } from '@/utils/error';
import { useAuth } from '@/hooks/useAuth';

const money = (amount: number | undefined) => `${Number(amount || 0).toFixed(2)} ETB`;

export function DelivererPayoutsPage() {
  const { user } = useAuth();
  const canManage = Boolean(user?.permissions?.includes('*') || user?.permissions?.includes('delivery.manage'));
  const [payouts, setPayouts] = useState<ProviderPayout[]>([]);
  const [wallets, setWallets] = useState<ProviderWallet[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const load = useCallback(async () => {
    const [queue, balances] = await Promise.all([providerPayoutsService.list('pending'), providerPayoutsService.listWallets()]);
    setPayouts(queue); setWallets(balances);
  }, []);
  useEffect(() => { load().catch((err) => setError(apiErrorMessage(err, 'Could not load deliverer payouts'))); }, [load]);

  const review = async (payout: ProviderPayout, decision: 'approve' | 'reject') => {
    const reason = decision === 'reject' ? window.prompt('Enter the rejection reason:') : '';
    if (decision === 'reject' && !reason?.trim()) return;
    const reference = decision === 'approve' ? (window.prompt('Transfer reference (optional):') || '') : '';
    setBusy(payout._id); setError('');
    try { await providerPayoutsService.review(payout._id, decision, { reason: reason || undefined, reference }); await load(); }
    catch (err) { setError(apiErrorMessage(err, 'Payout review failed')); }
    finally { setBusy(''); }
  };

  const verifyAccount = async (wallet: ProviderWallet) => {
    setBusy(String(wallet._id)); setError('');
    const providerId = wallet.providerId?._id;
    if (!providerId) { setError('This deliverer wallet has no linked provider'); return; }
    try { await providerPayoutsService.verifyAccount(providerId, true, 'Verified by delivery payouts administrator'); await load(); }
    catch (err) { setError(apiErrorMessage(err, 'Account verification failed')); }
    finally { setBusy(''); }
  };

  return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-bold">Deliverer Payouts</h1><p className="mt-1 text-sm text-gray-500">Review payout requests and inspect deliverer wallet balances.</p></header>
      {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <section className="overflow-x-auto rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-semibold">Pending requests</h2>
        <table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b text-gray-500"><th className="py-2">Deliverer</th><th>Amount</th><th>Account</th><th>Requested</th><th>Actions</th></tr></thead><tbody>
          {payouts.map((payout) => <tr key={payout._id} className="border-b"><td className="py-3">{payout.providerId?.name}<div className="text-xs text-gray-500">{payout.providerId?.phone}</div></td><td>{money(payout.amount)}</td><td>{payout.payoutAccount?.bankName || payout.payoutAccount?.type}<div className="text-xs text-gray-500">{payout.payoutAccount?.accountName} · {payout.payoutAccount?.accountNumber}</div></td><td>{new Date(payout.createdAt).toLocaleString()}</td><td><div className="flex gap-2">{canManage && <><Button size="sm" loading={busy === payout._id} onClick={() => review(payout, 'approve')}>Approve & Pay</Button><Button size="sm" variant="danger" disabled={!!busy} onClick={() => review(payout, 'reject')}>Reject</Button></>}</div></td></tr>)}
          {!payouts.length && <tr><td colSpan={5} className="py-6 text-center text-gray-500">No pending payout requests.</td></tr>}
        </tbody></table>
      </section>
      <section className="overflow-x-auto rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-semibold">Deliverer wallets</h2>
        <table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b text-gray-500"><th className="py-2">Deliverer</th><th>Available</th><th>Pending</th><th>Locked</th><th>Withdrawn</th><th>Payout account</th></tr></thead><tbody>
          {wallets.map((wallet) => { const account = wallet.providerId?.metadata?.payoutAccount; return <tr key={wallet._id} className="border-b"><td className="py-2">{wallet.providerId?.name || 'Deliverer'}</td><td>{money(wallet.availableBalance)}</td><td>{money(wallet.pendingBalance)}</td><td>{money(wallet.lockedBalance)}</td><td>{money(wallet.withdrawnBalance)}</td><td>{account?.verified ? 'Verified' : account?.accountNumber && canManage ? <Button size="sm" variant="outline" loading={busy === String(wallet._id)} onClick={() => verifyAccount(wallet)}>Verify</Button> : account?.accountNumber ? 'Needs verification' : 'Not added'}</td></tr>; })}
          {!wallets.length && <tr><td colSpan={6} className="py-5 text-center text-gray-500">No wallet balances yet.</td></tr>}
        </tbody></table>
      </section>
    </div>
  );
}
