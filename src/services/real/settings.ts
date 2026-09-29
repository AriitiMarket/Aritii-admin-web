/**
 * Real settings service — Aritii API Gateway contract.
 */
import { assertGatewayConfigured, http } from '@/services/client/httpClient';
import type {
  NotificationsSettings,
  PlatformSettings,
  SystemSettings,
} from '@/types';

/**
 * Strips the response envelope (`success`) from a settings payload.
 *
 * The API answers with `{ success: true, ...settings }`. Destructuring keeps the
 * payload typed; the previous `as any` erased it and defeated the very
 * `PlatformSettings` / `NotificationsSettings` / `SystemSettings` contracts this
 * module exists to enforce.
 */
function toSettings<T extends object>(payload: { success: boolean } & T): T {
  const { success: _success, ...settings } = payload;
  return settings as T;
}

export async function realGetPlatformSettings(): Promise<PlatformSettings> {
  assertGatewayConfigured();
  const response = await http.get<{ success: boolean } & PlatformSettings>('/settings/platform');
  return toSettings<PlatformSettings>(response);
}

export async function realUpdatePlatformSettings(
  patch: Partial<PlatformSettings>
): Promise<PlatformSettings> {
  assertGatewayConfigured();
  const response = await http.put<{ success: boolean } & PlatformSettings>('/settings/platform', patch);
  return toSettings<PlatformSettings>(response);
}

export async function realGetNotificationSettings(): Promise<NotificationsSettings> {
  assertGatewayConfigured();
  const response = await http.get<{ success: boolean } & NotificationsSettings>('/settings/notifications');
  return toSettings<NotificationsSettings>(response);
}

export async function realUpdateNotificationSettings(
  patch: Partial<NotificationsSettings>
): Promise<NotificationsSettings> {
  assertGatewayConfigured();
  const response = await http.put<{ success: boolean } & NotificationsSettings>('/settings/notifications', patch);
  return toSettings<NotificationsSettings>(response);
}

export async function realGetSystemSettings(): Promise<SystemSettings> {
  assertGatewayConfigured();
  const response = await http.get<{ success: boolean } & SystemSettings>('/settings/system');
  return toSettings<SystemSettings>(response);
}

export async function realUpdateSystemSettings(
  patch: Partial<SystemSettings>
): Promise<SystemSettings> {
  assertGatewayConfigured();
  const response = await http.put<{ success: boolean } & SystemSettings>('/settings/system', patch);
  return toSettings<SystemSettings>(response);
}
