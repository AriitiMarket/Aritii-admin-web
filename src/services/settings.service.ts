/** Settings service facade. */
import { isMockMode } from '@/utils/env';
import type {
  NotificationsSettings,
  PlatformSettings,
  SystemSettings,
} from '@/types';
import {
  mockGetNotificationSettings,
  mockGetPlatformSettings,
  mockGetSystemSettings,
  mockUpdateNotificationSettings,
  mockUpdatePlatformSettings,
  mockUpdateSystemSettings,
} from './mock/settings';
import {
  realGetNotificationSettings,
  realGetPlatformSettings,
  realGetSystemSettings,
  realUpdateNotificationSettings,
  realUpdatePlatformSettings,
  realUpdateSystemSettings,
} from './real/settings';

export const settingsService = {
  getPlatform(): Promise<PlatformSettings> {
    return isMockMode() ? mockGetPlatformSettings() : realGetPlatformSettings();
  },
  updatePlatform(patch: Partial<PlatformSettings>): Promise<PlatformSettings> {
    return isMockMode()
      ? mockUpdatePlatformSettings(patch)
      : realUpdatePlatformSettings(patch);
  },
  getNotifications(): Promise<NotificationsSettings> {
    return isMockMode()
      ? mockGetNotificationSettings()
      : realGetNotificationSettings();
  },
  updateNotifications(
    patch: Partial<NotificationsSettings>
  ): Promise<NotificationsSettings> {
    return isMockMode()
      ? mockUpdateNotificationSettings(patch)
      : realUpdateNotificationSettings(patch);
  },
  getSystem(): Promise<SystemSettings> {
    return isMockMode() ? mockGetSystemSettings() : realGetSystemSettings();
  },
  updateSystem(patch: Partial<SystemSettings>): Promise<SystemSettings> {
    return isMockMode()
      ? mockUpdateSystemSettings(patch)
      : realUpdateSystemSettings(patch);
  },
};