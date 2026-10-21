import { http } from '@/services/client/httpClient';

export interface ProviderPayout {
  _id: string;
  amount: number;
  status: string;
  createdAt: string;
  reason?: string;
  reference?: string | null;
  payoutAccount: { type?: string; bankName?: string; accountName: string; accountNumber: string };
  providerId: { _id: string; name: string; phone: string; identityUserId?: string };
}

/** A delivery provider's payout wallet as returned by the admin endpoint. */
export interface ProviderWallet {
  _id: string;
  providerId?: {
    _id: string;
    name?: string;
    phone?: string;
    metadata?: {
      payoutAccount?: {
        type?: string;
        bankName?: string;
        accountName?: string;
        accountNumber?: string;
        verified?: boolean;
      };
    };
  };
  availableBalance?: number;
  pendingBalance?: number;
  lockedBalance?: number;
  withdrawnBalance?: number;
  currency?: string;
}

export const providerPayoutsService = {
  async list(status = 'pending') {
    const res = await http.get<{ payouts?: ProviderPayout[] }>('/delivery/provider-payouts', { params: { status } });
    return res.payouts || [];
  },
  async listWallets() {
    const res = await http.get<{ wallets?: ProviderWallet[] }>('/delivery/provider-wallet/admin');
    return res.wallets || [];
  },
  async review(id: string, decision: 'approve' | 'reject', payload: { reason?: string; reference?: string }) {
    return http.put<{ payout: ProviderPayout }>(`/delivery/provider-payouts/${id}/${decision}`, payload);
  },
  async verifyAccount(providerId: string, verified: boolean, reason?: string) {
    return http.put(`/delivery/provider-wallet/admin/${providerId}/payout-account`, { verified, reason });
  },
};
