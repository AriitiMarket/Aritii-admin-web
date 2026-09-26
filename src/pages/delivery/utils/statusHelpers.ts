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

export function isActiveActor(status: string): boolean {
  return status === 'available' || status === 'busy' || status === 'offline';
}