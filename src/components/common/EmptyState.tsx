import React from "react";

interface EmptyStateProps {
  message?: string;
  description?: string;
  image?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message = "No data available",
  description = "There is currently no information to display.",
  image,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="mb-6 flex justify-center">
        {image || (
          <div className="w-24 h-24 bg-gray-100 dark:bg-white/[0.03] rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
        {message}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-8">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2.5 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors shadow-theme-xs"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
