import React, { forwardRef } from "react";
import Tooltip from "@/components/ui/tooltip"; // Đảm bảo đường dẫn này khớp với project của bạn

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type?: "text" | "number" | "email" | "password" | "date" | "time" | "datetime-local" | string;
  success?: boolean;
  error?: boolean;
  hint?: string;
  absoluteHint?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = "text",
      className = "",
      disabled = false,
      success = false,
      error = false,
      hint,
      absoluteHint = false,
      ...props
    },
    ref
  ) => {
    // Determine input styles based on state (disabled, success, error)
    let inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${className}`;

    // Add styles for the different states
    if (disabled) {
      inputClasses += ` text-gray-500 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
    } else if (error) {
      inputClasses += ` text-error-800 border-error-500 focus:ring-3 focus:ring-error-500/10  dark:text-error-400 dark:border-error-500`;
    } else if (success) {
      inputClasses += ` text-success-500 border-success-400 focus:ring-success-500/10 focus:border-success-300  dark:text-success-400 dark:border-success-500`;
    } else {
      inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`;
    }

    if (error && hint && absoluteHint) {
      inputClasses += ` pr-10`;
    }

    return (
      <div className="relative group">
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={inputClasses}
          {...props}
        />

        {/* Error Icon and Tooltip for Table Mode */}
        {error && hint && absoluteHint && (
          // Ép khung div này cao đúng 20px (h-5) bằng với icon để translate-y-1/2 hoạt động hoàn hảo
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
            <Tooltip content={hint} position="top" variant="dark" className="flex">
              <svg
                // Thêm class 'block' để xóa bỏ khoảng cách baseline dư thừa của thẻ inline
                className="w-5 h-5 text-error-500 cursor-help block"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </Tooltip>
          </div>
        )}

        {/* Standard Hint Text (Normal Mode) */}
        {hint && !absoluteHint && (
          <p
            className={`mt-1.5 text-xs ${
              error
                ? "text-error-500"
                : success
                ? "text-success-500"
                : "text-gray-500"
            }`}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;