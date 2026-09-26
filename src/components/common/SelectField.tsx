import type { ChangeEvent, ComponentPropsWithoutRef } from 'react';
import { twMerge } from 'tailwind-merge';

export interface SelectFieldOption {
  label: string;
  value: string;
}

export interface SelectFieldProps
  extends Omit<ComponentPropsWithoutRef<'select'>, 'onChange'> {
  label?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  options?: SelectFieldOption[];
  required?: boolean;
}

const selectBase =
  'w-full rounded-md border border-dark-border bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-dark focus:ring-1 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white';

/**
 * A labelled select field used across the locations forms.
 * Mirrors the styling of the native input/textarea fields so the
 * form surfaces a consistent look and dark-mode support.
 */
export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  className,
  ...props
}: SelectFieldProps) {
  return (
    <div className="flex flex-col">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select value={value} onChange={onChange} className={twMerge(selectBase, className)} {...props}>
        {options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
