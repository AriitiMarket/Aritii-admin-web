/** Admins service facade. */
import { isMockMode } from '@/utils/env';
import type { AdminAccount } from '@/types/admin';
import { mockCreateAdmin, mockGetAdmin, mockListAdmins } from './mock/admins';
import { realCreateAdmin, realGetAdmin, realListAdmins } from './real/admins';

export const adminsService = {
  list(): Promise<AdminAccount[]> {
    return isMockMode() ? mockListAdmins() : realListAdmins();
  },
  get(id: string): Promise<AdminAccount | null> {
    return isMockMode() ? mockGetAdmin(id) : realGetAdmin(id);
  },
  create(input: Omit<AdminAccount, 'id' | 'createdAt'>): Promise<AdminAccount> {
    return isMockMode() ? mockCreateAdmin(input) : realCreateAdmin(input);
  },
};