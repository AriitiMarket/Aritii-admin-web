/** Administrator accounts managed through the admin web. */
export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  sectors?: string[];
  adminScope?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

/** Admin permission definition. */
export interface AdminPermission {
  id: string;
  key: string;
  name: string;
  description: string;
  module: string;
}

/** Admin role definition. */
export interface AdminRoleItem {
  id: string;
  name: string;
  display_name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
  user_count?: number;
  created_at: string;
  updated_at: string;
}

/** User-role assignment. */
export interface UserRoleAssignment {
  user_id: string;
  user_name: string;
  user_email: string;
  role_id: string;
  role_name: string;
  role_display_name: string;
  assigned_at: string;
}

/** User's roles and effective permissions. */
export interface UserRolesResponse {
  user: { id: string; name: string; email: string; role: string };
  roles: AdminRoleItem[];
  permissions: string[];
}
