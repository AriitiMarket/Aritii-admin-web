import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

const inputBase =
  'w-full rounded-md border border-dark-border bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-dark focus:ring-1 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white';

/**
 * A simple labelled text input used across the locations forms.
 * Mirrors the styling of the native textarea/select fields so the
 * form surfaces a consistent look and dark-mode support.
 */
export function TextField({
  label,
  onChange,
  required,
  className,
  ...props
}: TextFieldProps) {
  return (
    <div className="flex flex-col">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input type="text" onChange={onChange} className={twMerge(inputBase, className)} {...props} />
    </div>
  );
}
