/** Users service facade. */
import { isMockMode } from '@/utils/env';
import type { PaginatedResult, User, UsersFilter } from '@/types';
import {
  mockDeleteUser,
  mockGetUser,
  mockListUsers,
  mockUpdateUser,
} from './mock/users';
import {
  realDeleteUser,
  realGetUser,
  realListUsers,
  realUpdateUser,
} from './real/users';

export const usersService = {
  list(filter: UsersFilter): Promise<PaginatedResult<User>> {
    return isMockMode() ? mockListUsers(filter) : realListUsers(filter);
  },
  get(id: string): Promise<User> {
    return isMockMode() ? mockGetUser(id) : realGetUser(id);
  },
  update(id: string, patch: Record<string, unknown>): Promise<User> {
    return isMockMode() ? mockUpdateUser(id, patch) : realUpdateUser(id, patch);
  },
  remove(id: string): Promise<void> {
    return isMockMode() ? mockDeleteUser(id) : realDeleteUser(id);
  },
};