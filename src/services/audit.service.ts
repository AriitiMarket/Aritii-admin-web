/** Audit logs service facade. */
import type { AuditLog, AuditLogFilters, AuditLogStats, AuditLogListResponse } from '@/types';
import { auditAdmin } from '@/api/admin';

export const auditService = {
  async listLogs(params: {
    page?: number;
    limit?: number;
    adminId?: string;
    action?: string;
    module?: string;
    targetEntity?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<AuditLogListResponse> {
    return auditAdmin.listLogs(params);
  },

  async getLog(id: string): Promise<AuditLog> {
    return auditAdmin.getLog(id);
  },

  async getFilters(): Promise<AuditLogFilters> {
    return auditAdmin.getFilters();
  },

  async getStats(): Promise<AuditLogStats> {
    return auditAdmin.getStats();
  },
};
