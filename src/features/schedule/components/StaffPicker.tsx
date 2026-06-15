import React from "react";
import Image from "next/image";
import { AccountListItem } from "@/features/account/types/account";
import { CheckCircleIcon } from "@/icons";

interface StaffPickerProps {
  label: string;
  accounts: AccountListItem[];
  selectedId: number;
  onSelect: (id: number) => void;
  isLoading: boolean;
  error?: string;
  accentColor?: string; // "brand" | "warning"
}

const StaffPicker: React.FC<StaffPickerProps> = ({
  label,
  accounts,
  selectedId,
  onSelect,
  isLoading,
  error,
  accentColor = "brand",
}) => {
  const isWarning = accentColor === "warning";

  const accentRing = isWarning ? "ring-warning-500/20" : "ring-brand-500/20";
  const accentText = isWarning ? "text-warning-500" : "text-brand-500";
  const accentDot = isWarning ? "bg-warning-500" : "bg-brand-500";
  const accentAvatar = isWarning ? "bg-warning-500" : "bg-brand-500";

  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">
          <span className={`inline-block w-2 h-2 rounded-full ${accentDot} mr-1.5`} />
          {label} <span className="text-error-500">*</span>
        </label>
        {!isLoading && accounts.length > 0 && (
          <span className="text-[10px] font-bold text-gray-400">
            {accounts.length} available
          </span>
        )}
      </div>

      {/* Scrollable list */}
      <div
        className={`rounded-xl border overflow-hidden ${
          error ? "border-error-300" : "border-gray-200 dark:border-gray-700"
        }`}
      >
        <div className="max-h-[260px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-gray-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              Loading personnel...
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-400 italic">
              No personnel found for this role
            </div>
          ) : (
            accounts.map((account) => {
              const isSelected = selectedId === account.accountId;
              const initials = account.accountName?.[0]?.toUpperCase() ?? "?";

              return (
                <button
                  key={account.accountId}
                  type="button"
                  onClick={() => onSelect(account.accountId)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ${
                    isSelected
                      ? isWarning
                        ? "bg-warning-50 dark:bg-warning-500/10"
                        : "bg-brand-50 dark:bg-brand-500/10"
                      : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                  }`}
                >
                  {/* Avatar */}
                  <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white ${
                    isSelected ? accentAvatar : "bg-gray-300 dark:bg-gray-600"
                  }`}>
                    {account.imageUrl ? (
                      <Image
                        src={account.imageUrl}
                        alt={account.accountName}
                        width={36}
                        height={36}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${
                      isSelected
                        ? accentText
                        : "text-gray-800 dark:text-gray-200"
                    }`}>
                      {account.accountName}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{account.email}</p>
                  </div>

                  {/* Check indicator */}
                  {isSelected && (
                    <CheckCircleIcon className={`w-6 h-6 shrink-0 ${accentText}`} />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {error && <p className="text-xs text-error-500 font-medium">{error}</p>}
    </div>
  );
};

export default StaffPicker;
