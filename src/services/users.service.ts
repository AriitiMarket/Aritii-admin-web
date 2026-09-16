/** Users service facade. */
import type { PaginatedResult, User, UsersFilter } from '@/types';
import { identityAdmin } from '@/api/admin';

export const usersService = {
  async list(filter: UsersFilter): Promise<PaginatedResult<User>> {
    return identityAdmin.listUsers(
      filter.page || 1,
      filter.limit || 10,
      filter.search || '',
      filter.role || ''
    ) as unknown as Promise<PaginatedResult<User>>;
  },
  async get(id: string): Promise<User> {
    return identityAdmin.getUser(id) as unknown as Promise<User>;
  },
  async update(id: string, patch: Record<string, unknown>): Promise<User> {
    return identityAdmin.setUserStatus(id, patch.status as string) as unknown as Promise<User>;
  },
  async remove(id: string): Promise<void> {
    await identityAdmin.setUserStatus(id, 'banned');
  },
};
