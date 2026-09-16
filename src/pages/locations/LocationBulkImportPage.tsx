import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import type { Location } from '@/types';

interface ImportRow {
  name: string;
  type: string;
  parentName?: string;
  code?: string;
  description?: string;
  isActive: boolean;
}

export function LocationBulkImportPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        
        // Skip header
        const rows = lines.slice(1).map(line => {
          const [name, type, parentName, code, description, isActive] = line.split(',').map(v => v.trim());
          return {
            name,
            type,
            parentName,
            code,
            description,
            isActive: isActive === 'true' || isActive === '1' || !isActive,
          };
        }).filter(row => row.name);

        setPreview(rows);
        setError(null);
      } catch (err) {
        setError('Failed to parse CSV file');
        setPreview([]);
      }
    };

    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      setError('No rows to import');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate import
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      setTimeout(() => navigate('/locations'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t('Bulk Import Locations')}
        description={t('Import multiple locations from a CSV file')}
        actions={
          <Button onClick={() => navigate('/locations')} variant="outline">
            {t('Back')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <p className="card-h1 mb-4 dark:text-white">{t('CSV Format')}</p>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded font-mono text-xs overflow-auto">
            <pre>{`name,type,parentName,code,description,isActive
Addis Ababa,city,Ethiopia,AA,Main city,true
Downtown,area,Addis Ababa,AA01,Downtown area,true
Bole,sector,Downtown,AA0101,Bole district,true
Mumbai,city,India,MU,Tech city,true`}</pre>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            {t('Download template')}: <a href="#" className="text-blue-600 hover:underline">locations_template.csv</a>
          </p>
        </Card>

        <Card>
          <p className="card-h1 mb-4 dark:text-white">{t('Upload File')}</p>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-input"
            />
            <label htmlFor="csv-input" className="cursor-pointer">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {file ? `📄 ${file.name}` : t('Click to select CSV file')}
              </p>
            </label>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-100 rounded text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-100 rounded text-sm">
              ✅ Import successful! Redirecting...
            </div>
          )}

          {preview.length > 0 && (
            <div className="mt-4 flex gap-2">
              <Button
                onClick={handleImport}
                disabled={loading}
                loading={loading}
                variant="primary"
              >
                {t('Import')} ({preview.length} rows)
              </Button>
              <Button onClick={() => setPreview([])} variant="outline">
                {t('Clear')}
              </Button>
            </div>
          )}
        </Card>
      </div>

      {preview.length > 0 && (
        <Card className="mt-4">
          <p className="card-h1 mb-4 dark:text-white">{t('Preview')} ({preview.length} rows)</p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Name</th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Type</th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Parent</th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Code</th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {preview.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-2 text-gray-800 dark:text-gray-100">{row.name}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{row.type}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{row.parentName || '—'}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{row.code || '—'}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          row.isActive
                            ? 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-100'
                            : 'bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {row.isActive ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.length > 10 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {t('Showing 10 of')} {preview.length} rows
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
