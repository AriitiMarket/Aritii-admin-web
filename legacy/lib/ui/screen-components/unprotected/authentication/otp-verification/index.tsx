'use client';

// Component
import CustomButton from '@/lib/ui/useable-components/button';

// Prime React
import { Card } from 'primereact/card';
import { InputOtp } from 'primereact/inputotp';

// Translations
import { useTranslations } from 'next-intl';

// Style

export default function OTPVerificationMain() {
  const t = useTranslations();

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="w-2/6">
        <Card>
          <div className="mb-2 flex flex-col items-center p-2">
            <span className="text-xl">
              {t('We have sent OTP code to your email')}
            </span>
            <span className="text-sm text-gray-400">
              {t('Please check your inbox')}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="h-26 flex w-full justify-center">
              <InputOtp />
            </div>

            <div className="flex justify-center">
              <span className="text-sm text-gray-400">
                {t('Valid for 1min')}
              </span>
            </div>

            <CustomButton
              className="h-12 w-full border-primary-color bg-primary-color text-white hover:bg-white hover:text-primary-color"
              label={t('Continue')}
              rounded={true}
            />

            <CustomButton
              className="h-full w-full border-secondary-border-color bg-transparent text-black dark:text-white hover:bg-gray-100"
              label={t('Resend OTP')}
              rounded={true}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
