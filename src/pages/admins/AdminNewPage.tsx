import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminsService } from '@/services/admins.service';
import { useSector } from '@/hooks/useSector';
import { useToast } from '@/hooks/useToast';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { TextField } from '@/components/forms/TextField';
import { SelectField } from '@/components/forms/SelectField';
import { Button } from '@/components/common/Button';
import { isEmail, isRequired } from '@/utils/validation';
import { ADMIN_ROLES, ADMIN_ROLE_LABELS } from '@/utils/auth-roles';

export function AdminNewPage() {
  const { t } = useLocalization();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { sectors } = useSector();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('SUPER_ADMIN');
  const [sector, setSector] = useState('all');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const nextErrors: { name?: string; email?: string } = {};
    if (!isRequired(name)) nextErrors.name = t('Name is required');
    if (!isRequired(email)) nextErrors.email = t('Email is required');
    else if (!isEmail(email)) nextErrors.email = t('Invalid email address');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await adminsService.create({
        name: name.trim(),
        email: email.trim(),
        role,
        status: 'ACTIVE',
        sectors: sector === 'all' ? sectors.map((item) => item.id) : [sector],
      });
      showToast({
        type: 'success',
        title: t('Success'),
        message: t('Admin created successfully') || 'Admin created successfully',
      });
      navigate('/users?tab=admins');
    } catch (err) {
      showToast({
        type: 'error',
        title: t('Error'),
        message: err instanceof Error ? err.message : t('Something went wrong - Please try again'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t('New Admin')}
        description={t(
          'Admin provisioning is not available yet — grant an existing account the ADMIN role instead'
        )}
      />

      <form onSubmit={onSubmit} noValidate className="grid max-w-2xl grid-cols-1 gap-4">
        <TextField
          name="name"
          label={t('Name')}
          value={name}
          error={errors.name}
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          name="email"
          type="email"
          label={t('Email')}
          value={email}
          error={errors.email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <SelectField
          name="role"
          label="Role"
          value={role}
          options={ADMIN_ROLES.map((code) => ({ value: code, label: ADMIN_ROLE_LABELS[code] }))}
          onChange={(event) => setRole(event.target.value)}
        />
        <SelectField
          name="sector"
          label={t('Sectors')}
          value={sector}
          options={[
            { value: 'all', label: t('All sectors') },
            ...sectors.map((item) => ({ value: item.id, label: item.name })),
          ]}
          onChange={(event) => setSector(event.target.value)}
        />

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Integration boundary: the Ariiti identity service does not expose a
          documented POST /admins endpoint yet — in mock mode this stores the
          record in the demo generator only.
        </p>

        <div className="flex justify-end gap-2">
          <Button type="submit" loading={submitting}>
            {t('Create')}
          </Button>
        </div>
      </form>
    </div>
  );
}