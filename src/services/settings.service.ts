/** Settings service facade. */
import type {
  NotificationsSettings,
  PlatformSettings,
  SystemSettings,
} from '@/types';
import {
  realGetNotificationSettings,
  realGetPlatformSettings,
  realGetSystemSettings,
  realUpdateNotificationSettings,
  realUpdatePlatformSettings,
  realUpdateSystemSettings,
} from './real/settings';

export const settingsService = {
  async getPlatform(): Promise<PlatformSettings> {
    return realGetPlatformSettings();
  },
  async updatePlatform(patch: Partial<PlatformSettings>): Promise<PlatformSettings> {
    return realUpdatePlatformSettings(patch);
  },
  async getNotifications(): Promise<NotificationsSettings> {
    return realGetNotificationSettings();
  },
  async updateNotifications(
    patch: Partial<NotificationsSettings>
  ): Promise<NotificationsSettings> {
    return realUpdateNotificationSettings(patch);
  },
  async getSystem(): Promise<SystemSettings> {
    return realGetSystemSettings();
  },
  async updateSystem(patch: Partial<SystemSettings>): Promise<SystemSettings> {
    return realUpdateSystemSettings(patch);
  },
};
