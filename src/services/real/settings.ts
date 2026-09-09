/**
 * Real settings service — Ariiti API Gateway contract.
 * @boundary: these endpoints are the documented integration contracts and
 * are pending gateway/backend implementation.
 */
import { assertGatewayConfigured, http } from '@/services/client/httpClient';
import type {
  NotificationsSettings,
  PlatformSettings,
  SystemSettings,
} from '@/types';

interface RealResponse<T> {
  data: T;
}

export async function realGetPlatformSettings(): Promise<PlatformSettings> {
  assertGatewayConfigured();
  const response = await http.get<RealResponse<PlatformSettings>>(
    '/settings/platform'
  );
  return response.data;
}

export async function realUpdatePlatformSettings(
  patch: Partial<PlatformSettings>
): Promise<PlatformSettings> {
  assertGatewayConfigured();
  const response = await http.put<RealResponse<PlatformSettings>>(
    '/settings/platform',
    patch
  );
  return response.data;
}

export async function realGetNotificationSettings(): Promise<NotificationsSettings> {
  assertGatewayConfigured();
  const response = await http.get<RealResponse<NotificationsSettings>>(
    '/settings/notifications'
  );
  return response.data;
}

export async function realUpdateNotificationSettings(
  patch: Partial<NotificationsSettings>
): Promise<NotificationsSettings> {
  assertGatewayConfigured();
  const response = await http.put<RealResponse<NotificationsSettings>>(
    '/settings/notifications',
    patch
  );
  return response.data;
}

export async function realGetSystemSettings(): Promise<SystemSettings> {
  assertGatewayConfigured();
  const response = await http.get<RealResponse<SystemSettings>>('/settings/system');
  return response.data;
}

export async function realUpdateSystemSettings(
  patch: Partial<SystemSettings>
): Promise<SystemSettings> {
  assertGatewayConfigured();
  const response = await http.put<RealResponse<SystemSettings>>(
    '/settings/system',
    patch
  );
  return response.data;
}