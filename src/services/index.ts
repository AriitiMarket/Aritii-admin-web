/**
 * Feature service exports.
 *
 * Every feature facade is reachable from this barrel so pages never need a
 * deep import and no service can be "forgotten" (platformAdmin, businesses and
 * audit were previously missing).
 */
export * from './auth.service';
export * from './users.service';
export * from './customers.service';
export * from './sellers.service';
export * from './stores.service';
export * from './riders.service';
export * from './orders.service';
export * from './catalog.service';
export * from './admins.service';
export * from './analytics.service';
export * from './settings.service';
export * from './notifications.service';
export * from './audit.service';
export * from './businesses.service';

// This module exports a framework-agnostic type of its own, so only the
// service object is re-exported here.
export { platformAdminService } from './platformAdmin.service';

// Phase-1 fulfillment surfaces (order notes, holds, export). These are
// single-instance service classes, so they are re-exported by name.
export { orderNotesService } from './orderNotes.admin.service';
export { orderHoldService } from './orderHold.admin.service';
export {
  orderExportService,
  triggerDownload,
} from './orderExport.admin.service';
export type { ExportFormat } from './orderExport.admin.service';
export {
  orderPriorityService,
  PRIORITY_LEVELS,
} from './orderPriority.admin.service';
export type {
  OrderPriority,
  PriorityLevel,
} from './orderPriority.admin.service';
export { orderSLAService } from './orderSLA.admin.service';
export type { OrderSLA, SLACompliance } from './orderSLA.admin.service';
export { paymentReconciliationService } from './paymentReconciliation.admin.service';
export type {
  ReconciliationReport,
  ReconciliationSummary,
} from './paymentReconciliation.admin.service';
export { commissionLedgerAdminService } from './commissionLedger.admin.service';
export type { CommissionEntry, CommissionTotals, CommissionAudit } from './commissionLedger.admin.service';
export { paymentLedgerAdminService } from './paymentLedger.admin.service';
export type { PaymentLedgerEntry, PaymentLedgerStats } from './paymentLedger.admin.service';

export { http, assertGatewayConfigured } from './client/httpClient';
export type { HttpRequestOptions } from './client/httpClient';
