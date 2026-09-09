/**
 * Real admins service — Ariiti API Gateway contract.
 * @boundary: these endpoints are the documented integration contracts and
 * are pending gateway/backend implementation.
 */
import { assertGatewayConfigured, http } from '@/services/client/httpClient';
import type { AdminAccount } from '@/types/admin';

interface RealListResponse {
  data: { items: AdminAccount[] };
}

export async function realListAdmins(): Promise<AdminAccount[]> {
  assertGatewayConfigured();
  const response = await http.get<RealListResponse>('/admins');
  return response.data.items;
}

export async function realGetAdmin(id: string): Promise<AdminAccount | null> {
  assertGatewayConfigured();
  const response = await http.get<{ data: { item: AdminAccount | null } }>(
    `/admins/${id}`
  );
  return response.data.item;
}

export async function realCreateAdmin(
  input: Omit<AdminAccount, 'id' | 'createdAt'>
): Promise<AdminAccount> {
  assertGatewayConfigured();
  const response = await http.post<{ data: { item: AdminAccount } }>('/admins', input);
  return response.data.item;
}