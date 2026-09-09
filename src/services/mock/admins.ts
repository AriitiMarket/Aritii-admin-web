/** Mock-mode admin accounts — resolved from the explicit demo generator. */
import type { AdminAccount } from '@/types/admin';
import { demoData } from './generators';

export async function mockListAdmins(): Promise<AdminAccount[]> {
  return [...demoData.admins];
}

export async function mockGetAdmin(id: string): Promise<AdminAccount | null> {
  return demoData.admins.find((admin) => admin.id === id) ?? null;
}

export async function mockCreateAdmin(
  input: Omit<AdminAccount, 'id' | 'createdAt'>
): Promise<AdminAccount> {
  const now = new Date().toISOString();
  const admin: AdminAccount = {
    ...input,
    id: `admin_${Date.now()}`,
    createdAt: now,
    lastLoginAt: undefined,
  };
  demoData.admins.unshift(admin);
  return admin;
}