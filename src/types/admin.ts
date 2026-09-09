/** Administrator accounts managed through the admin web. */
export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  sectors: string[];
  lastLoginAt?: string;
  createdAt?: string;
}