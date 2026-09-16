/**
 * Real settings service — Ariiti API Gateway contract.
 */
import { assertGatewayConfigured, http } from '@/services/client/httpClient';
import type {
  NotificationsSettings,
  PlatformSettings,
  SystemSettings,
} from '@/types';

export async function realGetPlatformSettings(): Promise<PlatformSettings> {
  assertGatewayConfigured();
  const response = await http.get<{ success: boolean } & PlatformSettings>('/settings/platform');
  // The API returns settings as top-level fields alongside success
  const { success, ...settings } = response as any;
  return settings as PlatformSettings;
}

export async function realUpdatePlatformSettings(
  patch: Partial<PlatformSettings>
): Promise<PlatformSettings> {
  assertGatewayConfigured();
  const response = await http.put<{ success: boolean } & PlatformSettings>('/settings/platform', patch);
  const { success, ...settings } = response as any;
  return settings as PlatformSettings;
}

export async function realGetNotificationSettings(): Promise<NotificationsSettings> {
  assertGatewayConfigured();
  const response = await http.get<{ success: boolean } & NotificationsSettings>('/settings/notifications');
  const { success, ...settings } = response as any;
  return settings as NotificationsSettings;
}

export async function realUpdateNotificationSettings(
  patch: Partial<NotificationsSettings>
): Promise<NotificationsSettings> {
  assertGatewayConfigured();
  const response = await http.put<{ success: boolean } & NotificationsSettings>('/settings/notifications', patch);
  const { success, ...settings } = response as any;
  return settings as NotificationsSettings;
}

export async function realGetSystemSettings(): Promise<SystemSettings> {
  assertGatewayConfigured();
  const response = await http.get<{ success: boolean } & SystemSettings>('/settings/system');
  const { success, ...settings } = response as any;
  return settings as SystemSettings;
}

export async function realUpdateSystemSettings(
  patch: Partial<SystemSettings>
): Promise<SystemSettings> {
  assertGatewayConfigured();
  const response = await http.put<{ success: boolean } & SystemSettings>('/settings/system', patch);
  const { success, ...settings } = response as any;
  return settings as SystemSettings;
}
