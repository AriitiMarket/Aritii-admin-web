/**
 * Real stores service — Ariiti API Gateway contract.
 * @boundary: these endpoints are the documented integration contracts and
 * are pending gateway/backend implementation.
 */
import { assertGatewayConfigured, http } from '@/services/client/httpClient';
import type { Store, StoreDetail } from '@/types';

interface RealStoresResponse {
  data: { stores: Store[]; pending: Store[] };
}

export async function realListStores(): Promise<Store[]> {
  assertGatewayConfigured();
  const response = await http.get<RealStoresResponse>('/stores');
  return response.data.stores;
}

export async function realListPendingStores(): Promise<Store[]> {
  assertGatewayConfigured();
  const response = await http.get<RealStoresResponse>('/stores');
  return response.data.pending;
}

export async function realGetStore(id: string): Promise<StoreDetail> {
  assertGatewayConfigured();
  const response = await http.get<{ data: { store: StoreDetail } }>(
    `/stores/${id}`
  );
  return response.data.store;
}