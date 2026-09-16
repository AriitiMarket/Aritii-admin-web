/** Audit log domain types. */
export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  adminId: string | null;
  adminName: string | null;
  module: string | null;
  targetEntity: string | null;
  targetId: string | null;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  reason: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuditLogFilters {
  admins: { admin_id: string; admin_name: string }[];
  actions: string[];
  modules: string[];
}

export interface AuditLogStats {
  total: number;
  today: number;
  criticalLast7Days: number;
  byModule: { module: string; count: number }[];
}

export interface AuditLogListResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
