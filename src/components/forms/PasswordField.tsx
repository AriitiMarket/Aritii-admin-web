import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

export interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ label, error, className, id: idProp, ...rest }, ref) {
    const [visible, setVisible] = useState(false);
    const generatedId = idProp ?? rest.name ?? 'password-field';

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
        <div className="relative">
          <input
            ref={ref}
            id={generatedId}
            type={visible ? 'text' : 'password'}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${generatedId}-error` : undefined}
            className={twMerge(
              'h-10 w-full rounded-md border bg-white px-3 pr-10 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-dark dark:bg-dark-900 dark:text-white',
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-primary-dark dark:border-dark-600',
              className
            )}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setVisible((prev) => !prev)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <FontAwesomeIcon icon={visible ? faEyeSlash : faEye} size="sm" />
          </button>
        </div>
        {error && (
          <p
            id={`${generatedId}-error`}
            role="alert"
            className="mt-1 text-xs text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);