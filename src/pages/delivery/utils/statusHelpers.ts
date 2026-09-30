// Helper functions for status colors and labels

import { DELIVERY_STATUS_COLORS, STATUS_COLORS, ACTOR_STATUS_LABELS, VALID_TRANSITIONS } from '../constants';

export function getDeliveryStatusColor(status: string): string {
  return DELIVERY_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
}

export function getRiderStatusColor(status: string): string {
  return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
}

export function getRiderStatusLabel(status: string): string {
  return ACTOR_STATUS_LABELS[status] || status || '—';
}

export function getValidTransitions(currentStatus: string): string[] {
  return VALID_TRANSITIONS[currentStatus] || [];
}

/**
 * Transitions the console may fire as one-click buttons.
 *
 * `VALID_TRANSITIONS` is the full service table and includes steps the rider
 * and dispatch flow own (`assigned`, `reassigned`) plus the requeue to
 * `pending`. Offering those as manual actions produces rows the console cannot
 * explain — an "assigned" delivery with no provider, a requeue that silently
 * releases a rider — so manual buttons keep only what an operator legitimately
 * drives here. `pending` (retry) is offered solely from `failed`, where
 * requeueing is the recovery step.
 */
export function getManualTransitions(currentStatus: string): string[] {
  return getValidTransitions(currentStatus).filter((target) => {
    if (target === 'assigned' || target === 'reassigned') return false;
    if (target === 'pending') return currentStatus === 'failed';
    return true;
  });
}

export function isActiveActor(status: string): boolean {
  return status === 'available' || status === 'busy' || status === 'offline';
}