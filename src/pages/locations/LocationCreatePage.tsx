import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationsService } from '@/services/locations.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { TextField } from '@/components/forms/TextField';
import { SelectField } from '@/components/forms/SelectField';
import type { Location } from '@/types';

const LOCATION_TYPES = [
  { value: 'country', label: 'Country' },
  { value: 'region', label: 'Region' },
  { value: 'city', label: 'City' },
  { value: 'town', label: 'Town' },
  { value: 'area', label: 'Area' },
  { value: 'sector', label: 'Sector' },
  { value: 'community', label: 'Community' },
  { value: 'village', label: 'Village' },
  { value: 'rural', label: 'Rural' },
  { value: 'other', label: 'Other' },
];

export function LocationCreatePage() {
  const { t } = useLocalization();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Partial<Location>>({
    name: '',
    type: 'city',
    code: '',
    description: '',
    isActive: true,
    parentId: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load parent location if parentId is provided
  const { data: parentOptions } = useAsync(
    () => locationsService.list({ limit: 100 }),
    []
  );

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await locationsService.create(formData);
      navigate(`/locations/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t('Create Location')}
        description={t('Add a new geographic location for delivery coverage')}
        actions={
          <Button onClick={() => navigate('/locations')} variant="outline">
            {t('Back')}
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label={t('Name')}
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              placeholder="e.g., Addis Ababa"
            />
            <SelectField
              label={t('Type')}
              value={formData.type || 'city'}
              options={LOCATION_TYPES}
              onChange={(e) => handleChange('type', e.target.value)}
              required
            />
          </div>

          <TextField
            label={t('Code')}
            value={formData.code || ''}
            onChange={(e) => handleChange('code', e.target.value)}
            placeholder="e.g., AA01"
          />

          <TextField
            label={t('Description')}
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="e.g., Main commercial area"
          />

          <SelectField
            label={t('Parent Location (Optional)')}
            value={formData.parentId || ''}
            options={[
              { value: '', label: t('None') },
              ...(parentOptions?.items || []).map((loc) => ({
                value: loc.id,
                label: `${loc.name} (${loc.type})`,
              })),
            ]}
            onChange={(e) => handleChange('parentId', e.target.value || undefined)}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive ?? true}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
              {t('Active')}
            </label>
          </div>

          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900 dark:text-red-100">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} loading={loading}>
              {t('Create Location')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/locations')}
              disabled={loading}
            >
              {t('Cancel')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
