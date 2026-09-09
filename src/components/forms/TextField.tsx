import { forwardRef, type InputHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const baseInput =
  'h-10 w-full rounded-md border bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-dark dark:bg-dark-900 dark:text-white';

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    { label, error, hint, className, id: idProp, ...rest },
    ref
  ) {
    const generatedId = idProp ?? rest.name ?? 'text-field';
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={generatedId}
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={generatedId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${generatedId}-error` : hint ? `${generatedId}-hint` : undefined}
          className={twMerge(
            baseInput,
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary-dark dark:border-dark-600',
            className
          )}
          {...rest}
        />
        {error ? (
          <p
            id={`${generatedId}-error`}
            role="alert"
            className="mt-1 text-xs text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        ) : hint ? (
          <p id={`${generatedId}-hint`} className="mt-1 text-xs text-gray-400">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);