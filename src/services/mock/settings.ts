/**
 * Mock-mode settings implementation.
 * Platform settings come from the mock /config endpoint; notification and
 * system surfaces have no backend endpoint yet and use local demo state.
 */
import { http } from '@/services/client/httpClient';
import type {
  NotificationsSettings,
  PlatformSettings,
  SystemSettings,
} from '@/types';
import type { MockConfigResponse } from './types';

export async function mockGetPlatformSettings(): Promise<PlatformSettings> {
  const response = await http.get<MockConfigResponse>('/config');
  const configuration = response.configuration;
  return {
    currency: configuration.currency ?? 'USD',
    currencySymbol: configuration.currencySymbol ?? '$',
    deliveryRate: configuration.deliveryRate ?? 0,
    commissionRate: 0.15,
    defaultSector: '',
  };
}

export async function mockUpdatePlatformSettings(
  patch: Partial<PlatformSettings>
): Promise<PlatformSettings> {
  const current = await mockGetPlatformSettings();
  const next = { ...current, ...patch };
  await http.put('/config', {
    currency: next.currency,
    currencySymbol: next.currencySymbol,
    deliveryRate: next.deliveryRate,
  });
  return next;
}

const NOTIFICATION_SETTINGS_KEY = 'demo-notification-settings';
const SYSTEM_SETTINGS_KEY = 'demo-system-settings';

const defaultNotifications: NotificationsSettings = {
  orderCreated: true,
  orderDelivered: true,
  riderAssigned: true,
  disputeRaised: true,
  reviewSubmitted: true,
};

const defaultSystem: SystemSettings = {
  underMaintenance: false,
  forceUpdateEnabled: false,
  maxRetryAttempts: 3,
  requestTimeoutMs: 15000,
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function mockGetNotificationSettings(): Promise<NotificationsSettings> {
  return readLocal(NOTIFICATION_SETTINGS_KEY, defaultNotifications);
}

export async function mockUpdateNotificationSettings(
  patch: Partial<NotificationsSettings>
): Promise<NotificationsSettings> {
  const next = { ...(await mockGetNotificationSettings()), ...patch };
  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export async function mockGetSystemSettings(): Promise<SystemSettings> {
  return readLocal(SYSTEM_SETTINGS_KEY, defaultSystem);
}

export async function mockUpdateSystemSettings(
  patch: Partial<SystemSettings>
): Promise<SystemSettings> {
  const next = { ...(await mockGetSystemSettings()), ...patch };
  localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(next));
  return next;
}