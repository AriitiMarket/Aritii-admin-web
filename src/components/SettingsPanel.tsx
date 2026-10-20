import { useState, useEffect, useCallback, type FormEvent } from 'react';
import {
  settingsService,
  type AllSettings,
  type SettingsSection,
  type SettingsSectionName,
} from '@/services/settings.admin.service';

/** A single editable settings field. */
export interface SettingsField {
  key: string;
  label: string;
  type: string;
  options?: string[];
}

/** The value a settings field can hold. */
export type SettingsFieldValue = string | number | boolean | undefined;

/**
 * Settings Management Hook
 */
export function useSettings() {
  const [settings, setSettings] = useState<AllSettings>({
    platform: {},
    notifications: {},
    system: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError(null);

      try {
        const allSettings = await settingsService.getAllSettings();
        setSettings(allSettings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updatePlatformSettings = useCallback(async (updates: SettingsSection) => {
    setSaving((prev) => ({ ...prev, platform: true }));
    setError(null);
    setSuccess(null);

    try {
      const updated = await settingsService.updatePlatformSettings(updates);
      setSettings((prev) => ({
        ...prev,
        platform: { ...prev.platform, ...updated },
      }));
      setSuccess('Platform settings updated successfully');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setSaving((prev) => ({ ...prev, platform: false }));
    }
  }, []);

  const updateNotificationSettings = useCallback(async (updates: SettingsSection) => {
    setSaving((prev) => ({ ...prev, notifications: true }));
    setError(null);
    setSuccess(null);

    try {
      const updated = await settingsService.updateNotificationSettings(updates);
      setSettings((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, ...updated },
      }));
      setSuccess('Notification settings updated successfully');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setSaving((prev) => ({ ...prev, notifications: false }));
    }
  }, []);

  const updateSystemSettings = useCallback(async (updates: SettingsSection) => {
    setSaving((prev) => ({ ...prev, system: true }));
    setError(null);
    setSuccess(null);

    try {
      const updated = await settingsService.updateSystemSettings(updates);
      setSettings((prev) => ({
        ...prev,
        system: { ...prev.system, ...updated },
      }));
      setSuccess('System settings updated successfully');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setSaving((prev) => ({ ...prev, system: false }));
    }
  }, []);

  return {
    settings,
    loading,
    saving,
    error,
    success,
    clearMessages,
    updatePlatformSettings,
    updateNotificationSettings,
    updateSystemSettings,
  };
}

export interface SettingsPanelProps {
  section: SettingsSectionName;
  settings: AllSettings;
  saving: Record<string, boolean>;
  onUpdate: (
    section: SettingsSectionName,
    data: SettingsSection
  ) => void | Promise<unknown>;
  onClearMessages: () => void;
  error: string | null;
  success: string | null;
}

/**
 * Settings Panel Component
 */
export function SettingsPanel({
  section,
  settings,
  saving,
  onUpdate,
  onClearMessages,
  error,
  success,
}: SettingsPanelProps) {
  const [formData, setFormData] = useState<SettingsSection>(
    settings?.[section] || {}
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormData(settings?.[section] || {});
    setHasChanges(false);
  }, [settings, section]);

  const handleChange = (key: string, value: SettingsFieldValue) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(settings[section]));
      return updated;
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (section === 'platform') {
      await onUpdate('platform', formData);
    } else if (section === 'notifications') {
      await onUpdate('notifications', formData);
    } else if (section === 'system') {
      await onUpdate('system', formData);
    }
  };

  const isLoading = saving[section];

  return (
    <div className="settings-panel">
      <div className="panel-header">
        <h3>{section.charAt(0).toUpperCase() + section.slice(1)} Settings</h3>
      </div>

      {error && (
        <div className="alert alert-error" onClick={onClearMessages}>
          {error} ✕
        </div>
      )}

      {success && (
        <div className="alert alert-success" onClick={onClearMessages}>
          {success} ✕
        </div>
      )}

      <form onSubmit={handleSubmit} className="settings-form">
        <SettingsFields
          section={section}
          data={formData}
          onChange={handleChange}
        />

        <div className="form-actions">
          <button
            type="submit"
            disabled={isLoading || !hasChanges}
            className="btn btn-primary"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Dynamic Settings Fields
 */
function SettingsFields({
  section,
  data,
  onChange,
}: {
  section: SettingsSectionName;
  data: SettingsSection;
  onChange: (key: string, value: SettingsFieldValue) => void;
}) {
  const fields: Record<SettingsSectionName, SettingsField[]> = {
    platform: [
      { key: 'siteName', label: 'Site Name', type: 'text' },
      { key: 'siteUrl', label: 'Site URL', type: 'url' },
      { key: 'logo', label: 'Logo URL', type: 'text' },
      { key: 'favicon', label: 'Favicon URL', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'currency', label: 'Currency', type: 'select', options: ['USD', 'EUR', 'GBP', 'INR'] },
      { key: 'timezone', label: 'Timezone', type: 'text' },
    ],
    notifications: [
      { key: 'emailNotifications', label: 'Enable Email Notifications', type: 'checkbox' },
      { key: 'smsNotifications', label: 'Enable SMS Notifications', type: 'checkbox' },
      { key: 'pushNotifications', label: 'Enable Push Notifications', type: 'checkbox' },
      { key: 'orderNotifications', label: 'Order Notifications', type: 'checkbox' },
      { key: 'paymentNotifications', label: 'Payment Notifications', type: 'checkbox' },
      { key: 'shippingNotifications', label: 'Shipping Notifications', type: 'checkbox' },
    ],
    system: [
      { key: 'maintenanceMode', label: 'Maintenance Mode', type: 'checkbox' },
      { key: 'maxUploadSize', label: 'Max Upload Size (MB)', type: 'number' },
      { key: 'sessionTimeout', label: 'Session Timeout (minutes)', type: 'number' },
      { key: 'rateLimit', label: 'Rate Limit (requests/min)', type: 'number' },
      { key: 'apiVersion', label: 'API Version', type: 'text' },
      { key: 'logLevel', label: 'Log Level', type: 'select', options: ['DEBUG', 'INFO', 'WARN', 'ERROR'] },
    ],
  };

  const sectionFields = fields[section] || [];

  return (
    <div className="settings-fields">
      {sectionFields.map((field) => (
        <SettingField
          key={field.key}
          field={field}
          value={data?.[field.key] ?? ''}
          onChange={(value) => onChange(field.key, value)}
        />
      ))}
    </div>
  );
}

/**
 * Individual Settings Field
 */
function SettingField({
  field,
  value,
  onChange,
}: {
  field: SettingsField;
  value: SettingsFieldValue;
  onChange: (value: SettingsFieldValue) => void;
}) {
  const inputValue = (value || '') as string | number;

  if (field.type === 'checkbox') {
    return (
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={(value || false) as boolean}
            onChange={(e) => onChange(e.target.checked)}
          />
          {field.label}
        </label>
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="form-group">
        <label>{field.label}</label>
        <textarea
          value={inputValue}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className="form-group">
        <label>{field.label}</label>
        <select value={inputValue} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select...</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="form-group">
      <label>{field.label}</label>
      <input
        type={field.type}
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/**
 * Settings Page Component
 */
export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsSectionName>('platform');
  const {
    settings,
    loading,
    saving,
    error,
    success,
    clearMessages,
    updatePlatformSettings,
    updateNotificationSettings,
    updateSystemSettings,
  } = useSettings();

  if (loading) {
    return <div className="settings-loading">Loading settings...</div>;
  }

  const handleUpdate = async (
    section: SettingsSectionName,
    data: SettingsSection
  ) => {
    if (section === 'platform') {
      return updatePlatformSettings(data);
    } else if (section === 'notifications') {
      return updateNotificationSettings(data);
    } else if (section === 'system') {
      return updateSystemSettings(data);
    }
  };

  return (
    <div className="settings-page">
      <h1>Platform Settings</h1>

      <div className="settings-tabs">
        {(['platform', 'notifications', 'system'] as SettingsSectionName[]).map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <SettingsPanel
        section={activeTab}
        settings={settings}
        saving={saving}
        onUpdate={handleUpdate}
        onClearMessages={clearMessages}
        error={error}
        success={success}
      />
    </div>
  );
}
