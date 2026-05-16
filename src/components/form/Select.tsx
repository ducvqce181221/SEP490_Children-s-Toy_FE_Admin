import React, { forwardRef } from "react";

export interface Option {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: Option[];
  placeholder?: string;
  error?: boolean;
  hint?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      placeholder = "Select an option",
      className = "",
      error = false,
      hint,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    // Determine the selected value for styling purposes
    const hasValue = value !== undefined && value !== "" || defaultValue !== undefined && defaultValue !== "";
    
    let selectClasses = `h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
      hasValue
        ? "text-gray-800 dark:text-white/90"
        : "text-gray-500 dark:text-gray-400"
    } ${className}`;

    if (error) {
      selectClasses = selectClasses.replace('border-gray-300', 'border-error-500').replace('focus:border-brand-300', 'focus:border-error-500').replace('focus:ring-brand-500/10', 'focus:ring-error-500/10');
    }

    return (
      <div className="relative">
        <select
          ref={ref}
          className={selectClasses}
          value={value}
          defaultValue={defaultValue}
          {...props}
        >
          {/* Placeholder option */}
          <option
            value=""
            disabled
            className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
          >
            {placeholder}
          </option>
          {/* Map over options */}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Dropdown Icon */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 dark:text-gray-400">
          <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>

        {hint && (
          <p className={`mt-1.5 text-xs ${error ? "text-error-500" : "text-gray-500"}`}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
