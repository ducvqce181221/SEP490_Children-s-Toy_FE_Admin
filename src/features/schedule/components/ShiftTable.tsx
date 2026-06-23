import React from "react";
import { ShiftTemplate } from "../types/shift";
import { PencilIcon, TrashBinIcon, TimeIcon, BoxIcon, PlusIcon, CheckCircleIcon, CloseIcon } from "@/icons";
import ShiftToolbar from "./ShiftToolbar";

interface ShiftTableProps {
  shifts: ShiftTemplate[];
  isLoading: boolean;
  onEdit: (shift: ShiftTemplate) => void;
  onDeactivate: (shift: ShiftTemplate) => void;
  onReactivate: (shift: ShiftTemplate) => void;
  onAddClick: () => void;
  isAdmin?: boolean;
}

// Compute a visual "period" label from time string
function getPeriodLabel(startTime: string): { label: string; color: string; bg: string } {
  const hour = parseInt(startTime.split(":")[0], 10);
  if (hour >= 5 && hour < 12) {
    return { label: "Morning", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" };
  } else if (hour >= 12 && hour < 17) {
    return { label: "Afternoon", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" };
  } else if (hour >= 17 && hour < 21) {
    return { label: "Evening", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10" };
  } else {
    return { label: "Night", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" };
  }
}

// Format duration between two HH:mm[:ss] strings
function getDuration(start: string, end: string): string {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const totalMins = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMins <= 0) return "--";
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
}

const ShiftCard: React.FC<{
  shift: ShiftTemplate;
  onEdit: (shift: ShiftTemplate) => void;
  onDeactivate: (shift: ShiftTemplate) => void;
  onReactivate: (shift: ShiftTemplate) => void;
  isAdmin?: boolean;
}> = ({ shift, onEdit, onDeactivate, onReactivate, isAdmin = false }) => {
  const period = getPeriodLabel(shift.startTime);
  const duration = getDuration(shift.startTime, shift.endTime);

  return (
    <div className={`group relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:bg-white/[0.03] ${shift.isActive
      ? "border-gray-200 hover:border-brand-200 dark:border-white/[0.07] dark:hover:border-brand-500/30"
      : "border-gray-200/60 opacity-60 dark:border-white/[0.04]"
      }`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Period icon */}
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${period.bg}`}>
            <TimeIcon className={`h-5 w-5 ${period.color}`} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
              {shift.shiftName}
            </h3>
            <span className={`text-xs font-semibold uppercase tracking-wide ${period.color}`}>
              {period.label} Shift
            </span>
          </div>
        </div>

        {/* Status badge */}
        <div className={`shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${shift.isActive
          ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          }`}>
          {shift.isActive
            ? <><CheckCircleIcon className="w-4.6 h-4.6" /> Active</>
            : <><CloseIcon className="w-4.6 h-4.5" /> Inactive</>
          }
        </div>
      </div>

      {/* Time block */}
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
        <div className="flex-1 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Start</p>
          <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums">
            {shift.startTime.slice(0, 5)}
          </p>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-3">
          <div className="h-px w-6 bg-gray-300 dark:bg-gray-600"></div>
          <span className="text-[10px] font-bold text-gray-400 uppercase">{duration}</span>
          <div className="h-px w-6 bg-gray-300 dark:bg-gray-600"></div>
        </div>
        <div className="flex-1 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">End</p>
          <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums">
            {shift.endTime.slice(0, 5)}
          </p>
        </div>
      </div>

      {/* Capacity */}
      <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-brand-100 dark:border-brand-500/20 bg-brand-50/50 dark:bg-brand-500/5 px-4 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 shadow-sm shadow-brand-500/30">
          <BoxIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-lg font-black text-brand-700 dark:text-brand-400 leading-none">
            {shift.maxOrdersPerShift}
          </p>
          <p className="text-[10px] text-brand-500/70 font-semibold uppercase tracking-wider mt-0.5">
            Default max orders (new schedules)
          </p>
        </div>
      </div>

      {(shift.activeScheduleCount ?? 0) > 0 && (
        <p className="mb-4 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-3 py-2">
          {shift.activeScheduleCount} active schedule(s) — time changes and deactivation are locked.
        </p>
      )}

      {/* Footer actions */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 dark:border-white/[0.05] pt-3">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
          ID: #{shift.shiftTemplateId}
        </span>
        {isAdmin && (
          <div className="flex gap-1.5">
            <button
              onClick={() => onEdit(shift)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-500 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:hover:border-brand-500/40 dark:hover:text-brand-400"
              title="Edit shift"
            >
              <PencilIcon className="w-4.6 h-4.6" />
              Edit
            </button>
            {shift.isActive && (() => {
              const isDeactivateLocked = (shift.activeScheduleCount ?? 0) > 0;
              return (
                <button
                  onClick={isDeactivateLocked ? undefined : () => onDeactivate(shift)}
                  disabled={isDeactivateLocked}
                  title={
                    isDeactivateLocked
                      ? "Cannot deactivate while schedules are Scheduled or On Duty"
                      : "Deactivate shift"
                  }
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all
                    ${isDeactivateLocked
                      ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed dark:border-gray-800 dark:bg-gray-800/30 dark:text-gray-600"
                      : "border-gray-200 text-gray-500 hover:border-error-300 hover:bg-error-50 hover:text-error-600 dark:border-gray-700 dark:hover:border-error-500/40 dark:hover:text-error-400"
                    }`}
                >
                  <TrashBinIcon className="w-4.6 h-4.6" />
                  Deactivate
                </button>
              );
            })()}
            {!shift.isActive && (
              <button
                onClick={() => onReactivate(shift)}
                className="flex items-center gap-1.5 rounded-lg border border-success-200 px-3 py-1.5 text-xs font-bold text-success-700 transition-all hover:bg-success-50 dark:border-success-900/50 dark:text-success-400"
                title="Reactivate shift"
              >
                Reactivate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ShiftTable: React.FC<ShiftTableProps> = ({
  shifts,
  isLoading,
  onEdit,
  onDeactivate,
  onReactivate,
  onAddClick,
  isAdmin = false,
}) => {
  const showInitialLoading = isLoading && shifts.length === 0;
  const activeShifts = shifts.filter((s) => s.isActive);
  const inactiveShifts = shifts.filter((s) => !s.isActive);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
      <ShiftToolbar onAddClick={onAddClick} isAdmin={isAdmin} />
      <div className="p-6 border-t border-gray-100 dark:border-white/[0.05]">
        {showInitialLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 dark:border-white/[0.05] p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-11 w-11 rounded-xl bg-gray-100 dark:bg-gray-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4" />
                <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl" />
              </div>
            ))}
          </div>
        ) : shifts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-50 dark:bg-gray-800 mb-5 shadow-sm">
              <TimeIcon className="h-10 w-10 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">No Shift Templates</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
              {isAdmin ? "You haven't created any operational shifts yet. Click below to get started." : "No operational shifts have been created yet."}
            </p>
            {isAdmin && (
              <button
                onClick={onAddClick}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-500/25 hover:bg-brand-600 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Create First Shift
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active shifts */}
            {activeShifts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-block h-2 w-2 rounded-full bg-success-500"></span>
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Active Shifts ({activeShifts.length})
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {activeShifts.map((shift) => (
                    <ShiftCard
                      key={shift.shiftTemplateId}
                      shift={shift}
                      onEdit={onEdit}
                      onDeactivate={onDeactivate}
                      onReactivate={onReactivate}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Inactive shifts */}
            {inactiveShifts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-block h-2 w-2 rounded-full bg-gray-400"></span>
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Inactive Shifts ({inactiveShifts.length})
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {inactiveShifts.map((shift) => (
                    <ShiftCard
                      key={shift.shiftTemplateId}
                      shift={shift}
                      onEdit={onEdit}
                      onDeactivate={onDeactivate}
                      onReactivate={onReactivate}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftTable;
