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

  /** How many logs a given purge scope would remove. */
  async previewPurge(params: {
    action?: string;
    module?: string;
    level?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{ total: number }> {
    return auditAdmin.previewPurge(params);
  },

  /**
   * Permanently clear audit logs (destructive).
   * The backend requires the `audit.manage` permission, a reason, and the
   * literal confirmation phrase — see AUDIT_CONFIRM_PHRASE.
   */
  async clearLogs(payload: {
    reason: string;
    confirm: string;
    action?: string;
    module?: string;
    level?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ deleted: number; total: number; byLevel: Record<string, number> }> {
    return auditAdmin.clearLogs(payload);
  },
};
