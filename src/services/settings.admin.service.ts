import { http } from '@/services/client/httpClient';
import { isApiError } from '@/types/api';

/**
 * A settings section: a flat bag of primitive values the console renders as
 * a dynamic form.
 */
export type SettingsSection = Record<string, string | number | boolean | undefined>;

export type PlatformSettings = SettingsSection;
export type NotificationSettings = SettingsSection;
export type SystemSettings = SettingsSection;

/** Every settings section keyed by its console tab. */
export type AllSettings = {
  platform: PlatformSettings;
  notifications: NotificationSettings;
  system: SystemSettings;
};

/** The console tabs that map onto a settings section. */
export type SettingsSectionName = keyof AllSettings;

class SettingsService {
  BASE = '/settings';

  /** The server's message for a failed call, or a generic fallback. */
  private static reason(err: unknown, fallback: string): string {
    if (isApiError(err) && err.message) return err.message;
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  }

  /**
   * The settings themselves, without the response envelope.
   *
   * The service answers `ok(res, settings)`, which is `{ success, message,
   * ...settings }` — the section's fields are at the TOP level, not nested
   * under a `platform` / `notifications` / `system` key. Reading a nested key
   * therefore always produced an empty form.
   */
  private static section(body: unknown): SettingsSection {
    if (!body || typeof body !== 'object') return {};
    const { success, message, ...section } = body as Record<string, unknown>;
    void success;
    void message;
    return section as SettingsSection;
  }

  /**
   * Get platform settings
   */
  async getPlatformSettings(): Promise<PlatformSettings> {
    try {
      const data = await http.get<SettingsSection>(`${this.BASE}/platform`);
      return SettingsService.section(data);
    } catch (err) {
      throw new Error(
        `Failed to fetch platform settings: ${SettingsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Update platform settings
   * @param settings - Settings to update
   */
  async updatePlatformSettings(settings: SettingsSection): Promise<PlatformSettings> {
    if (!settings || typeof settings !== 'object') {
      throw new Error('Settings must be a valid object');
    }

    try {
      const data = await http.put<SettingsSection>(`${this.BASE}/platform`, settings);
      return SettingsService.section(data);
    } catch (err) {
      throw new Error(
        `Failed to update platform settings: ${SettingsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const data = await http.get<SettingsSection>(`${this.BASE}/notifications`);
      return SettingsService.section(data);
    } catch (err) {
      throw new Error(
        `Failed to fetch notification settings: ${SettingsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Update notification settings
   * @param settings - Notification settings
   */
  async updateNotificationSettings(
    settings: SettingsSection
  ): Promise<NotificationSettings> {
    if (!settings || typeof settings !== 'object') {
      throw new Error('Notification settings must be a valid object');
    }

    try {
      const data = await http.put<SettingsSection>(`${this.BASE}/notifications`, settings);
      return SettingsService.section(data);
    } catch (err) {
      throw new Error(
        `Failed to update notification settings: ${SettingsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Get system settings
   */
  async getSystemSettings(): Promise<SystemSettings> {
    try {
      const data = await http.get<SettingsSection>(`${this.BASE}/system`);
      return SettingsService.section(data);
    } catch (err) {
      throw new Error(
        `Failed to fetch system settings: ${SettingsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Update system settings
   * @param settings - System settings
   */
  async updateSystemSettings(settings: SettingsSection): Promise<SystemSettings> {
    if (!settings || typeof settings !== 'object') {
      throw new Error('System settings must be a valid object');
    }

    try {
      const data = await http.put<SettingsSection>(`${this.BASE}/system`, settings);
      return SettingsService.section(data);
    } catch (err) {
      throw new Error(
        `Failed to update system settings: ${SettingsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Get all settings
   */
  async getAllSettings(): Promise<AllSettings> {
    try {
      const [platform, notifications, system] = await Promise.all([
        this.getPlatformSettings(),
        this.getNotificationSettings(),
        this.getSystemSettings(),
      ]);

      return { platform, notifications, system };
    } catch (err) {
      throw new Error(
        `Failed to fetch all settings: ${SettingsService.reason(err, 'Unknown error')}`
      );
    }
  }
}

export const settingsService = new SettingsService();
