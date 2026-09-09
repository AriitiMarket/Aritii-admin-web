'use client';

// Prime React
import { Card } from 'primereact/card';

// Components
import CustomButton from '@/lib/ui/useable-components/button';
import CustomTextField from '@/lib/ui/useable-components/input-field';

// Translations
import { useTranslations } from 'next-intl';

export default function EmailVerificationMain() {
  const t = useTranslations();

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="w-2/6">
        <Card>
          <div className="mb-2 flex flex-col p-2">
            <i className="pi pi-envelope" style={{ fontSize: '40px' }} />
            <span className="text-3xl">{t("What's your email?")}</span>
            <span className="text-sm text-gray-400">
              {t("We'll check if you have an account")}.
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <CustomTextField
              placeholder={t('Enter your email address')}
              type="text"
              name="lastName"
              maxLength={35}
              showLabel={true}
            />

            <CustomButton
              className="h-12 w-full border-primary-color bg-primary-color text-white hover:bg-white hover:text-primary-color"
              label={t('Continue')}
              rounded={true}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
