import type { ChangeEvent, TextareaHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
}

const textareaBase =
  'w-full rounded-md border border-dark-border bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-dark focus:ring-1 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white';

/**
 * A labelled multi-line text input.
 * Mirrors the styling of the native text field so forms keep a consistent
 * look and dark-mode support.
 */
export function Textarea({
  label,
  onChange,
  required,
  className,
  ...props
}: TextareaProps) {
  return (
    <div className="flex flex-col">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        onChange={onChange}
        className={twMerge(textareaBase, className)}
        {...props}
      />
    </div>
  );
}
