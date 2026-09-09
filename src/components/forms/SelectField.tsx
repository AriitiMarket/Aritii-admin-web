import {
  forwardRef,
  type SelectHTMLAttributes,
} from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField(
    { label, options, placeholder, error, className, id: idProp, ...rest },
    ref
  ) {
    const generatedId = idProp ?? rest.name ?? 'select-field';
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
        <select
          ref={ref}
          id={generatedId}
          aria-invalid={Boolean(error)}
          className={`h-10 w-full rounded-md border bg-white px-3 pr-8 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-dark dark:bg-dark-900 dark:text-white ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary-dark dark:border-dark-600'
          } ${className ?? ''}`}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);