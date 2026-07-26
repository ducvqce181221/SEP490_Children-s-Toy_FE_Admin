"use client";

import React from "react";
import Image from "next/image";
import { WorkSchedule } from "../types/schedule";
import { TrashBinIcon, TimeIcon, BoxIcon, UserCircleIcon, CalenderIcon, PencilIcon, CloseIcon, CheckLineIcon } from "@/icons";
import WorkScheduleToolbar from "./WorkScheduleToolbar";
import toast from "react-hot-toast";
import { scheduleApi } from "../services/schedule-api";
import { AxiosError } from "axios";

function getApiErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as {
      message?: string;
      errorMessage?: string;
      errors?: Record<string, string[]>;
    } | undefined;
    if (data?.errors) {
      const first = Object.values(data.errors).flat().find(Boolean);
      if (first) return first;
    }
    return data?.message ?? data?.errorMessage ?? "Operation failed";
  }
  return "Operation failed";
}

interface WorkScheduleTableProps {
  schedules: WorkSchedule[];
  isLoading: boolean;
  onMarkAbsent: (id: number) => void;
  onEdit: (schedule: WorkSchedule) => void;
  onDelete: (id: number) => void;
  dateFilter: string;
  onDateChange: (date: Date[]) => void;
  onTodayClick: () => void;
  onAssignClick: () => void;
  onCloneWeekClick: () => void;
  isCloningWeek?: boolean;
  isAdmin?: boolean;
  onMaxLoadUpdated?: () => void;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Scheduled: {
    dot: "bg-blue-500",
    label: "Scheduled",
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  },
  OnDuty: {
    dot: "bg-success-500 animate-pulse",
    label: "On Duty",
    badge: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
  },
  Completed: {
    dot: "bg-success-500",
    label: "Completed",
    badge: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
  },
  Absent: {
    dot: "bg-error-500",
    label: "Absent",
    badge: "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400",
  },
  Cancelled: {
    dot: "bg-gray-400",
    label: "Cancelled",
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

// ─── Schedule Card ────────────────────────────────────────────────────────────
const ScheduleCard: React.FC<{
  schedule: WorkSchedule;
  onMarkAbsent: (id: number) => void;
  onEdit: (schedule: WorkSchedule) => void;
  onDelete: (id: number) => void;
  isAdmin?: boolean;
  onMaxLoadUpdated?: () => void;
}> = ({ schedule, onMarkAbsent, onEdit, onDelete, isAdmin = false, onMaxLoadUpdated }) => {
  const loadPercentage = schedule.maxLoad > 0
    ? Math.round((schedule.currentLoad / schedule.maxLoad) * 100)
    : 0;
  const isOverloaded = loadPercentage >= 100;
  const isHeavy = loadPercentage > 80 && !isOverloaded;

  const progressColor = isOverloaded
    ? "bg-error-500"
    : isHeavy
      ? "bg-warning-500"
      : "bg-brand-500";

  const statusCfg = STATUS_CONFIG[schedule.status as keyof typeof STATUS_CONFIG] ?? {
    dot: "bg-gray-400",
    label: schedule.status,
    badge: "bg-gray-100 text-gray-600",
  };

  const isStaff = schedule.roleId === 3;
  const avatarText = schedule.accountName ? schedule.accountName[0].toUpperCase() : "?";
  /** Backend allows PUT update + mark absent while OnDuty; only Completed/Cancelled/Absent are blocked. Only Admin can edit. */
  const canManageAssignment =
    isAdmin && (schedule.status === "Scheduled" || schedule.status === "OnDuty");

  const [isEditingMaxLoad, setIsEditingMaxLoad] = React.useState(false);
  const [tempMaxLoad, setTempMaxLoad] = React.useState(schedule.maxLoad);
  const [isSavingMaxLoad, setIsSavingMaxLoad] = React.useState(false);

  const handleSaveMaxLoad = async () => {
    if (tempMaxLoad < schedule.currentLoad) {
      toast.error(`Max load cannot be less than current load (${schedule.currentLoad}).`);
      return;
    }
    if (tempMaxLoad < 1) {
      toast.error("Max load must be at least 1.");
      return;
    }
    if (tempMaxLoad > 200) {
      toast.error("Max load cannot exceed 200.");
      return;
    }

    setIsSavingMaxLoad(true);
    try {
      await scheduleApi.updateMaxLoad(schedule.scheduleId, tempMaxLoad);
      toast.success("Workload limit updated successfully!");
      setIsEditingMaxLoad(false);
      onMaxLoadUpdated?.();
    } catch (err: any) {
      const msg = getApiErrorMessage(err);
      toast.error(msg);
    } finally {
      setIsSavingMaxLoad(false);
    }
  };

  return (
    <div className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-brand-200 dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:border-brand-500/30">
      {/* Role indicator strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${isStaff ? "bg-brand-500" : "bg-warning-500"}`} />

      {/* Header: Avatar + Name + Status */}
      <div className="flex items-start justify-between gap-3 mt-2 mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-sm font-black text-white shadow-md ${isStaff ? "bg-brand-500" : "bg-warning-500"}`}>
            {schedule.imageUrl ? (
              <Image
                src={schedule.imageUrl}
                alt={schedule.accountName}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            ) : (
              avatarText
            )}
          </div>

          <div>
            <h3 className="font-bold text-gray-900 dark:text-white leading-tight">
              {schedule.accountName}
            </h3>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isStaff ? "text-brand-500" : "text-warning-500"}`}>
              {isStaff ? "Staff Member" : "Merchandiser"}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <div className={`flex items-center gap-1.5 shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${statusCfg.badge}`}>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
          {statusCfg.label}
        </div>
      </div>

      {/* Shift info */}
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
          <TimeIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-white leading-none">{schedule.shiftName}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider font-semibold">Assigned Shift</p>
        </div>
      </div>

      {/* Load progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Workload Capacity
          </span>
          {isEditingMaxLoad ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-400">
                {schedule.currentLoad} /
              </span>
              <input
                type="number"
                min="1"
                max="200"
                value={tempMaxLoad}
                onChange={(e) => setTempMaxLoad(parseInt(e.target.value) || 0)}
                disabled={isSavingMaxLoad}
                className="w-12 h-6 text-center text-xs font-bold rounded border border-gray-300 bg-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <button
                onClick={handleSaveMaxLoad}
                disabled={isSavingMaxLoad}
                className="flex h-5 w-5 items-center justify-center rounded bg-success-500 text-white hover:bg-success-600 disabled:opacity-50 transition-all"
                title="Save"
              >
                <CheckLineIcon className="h-3 w-3" />
              </button>
              <button
                onClick={() => setIsEditingMaxLoad(false)}
                disabled={isSavingMaxLoad}
                className="flex h-5 w-5 items-center justify-center rounded bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-all"
                title="Cancel"
              >
                <CloseIcon className="h-2.5 w-2.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group/capacity">
              <span className={`text-xs font-bold tabular-nums ${isOverloaded ? "text-error-600" : isHeavy ? "text-warning-600" : "text-gray-600 dark:text-gray-300"}`}>
                {schedule.currentLoad} / {schedule.maxLoad}
              </span>
              {canManageAssignment && (
                <button
                  onClick={() => {
                    setTempMaxLoad(schedule.maxLoad);
                    setIsEditingMaxLoad(true);
                  }}
                  className="opacity-0 group-hover/capacity:opacity-100 focus:opacity-100 transition-opacity p-0.5 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400"
                  title="Change Limit"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
            style={{ width: `${Math.min(loadPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-end mt-1">
          <span className={`text-[10px] font-bold ${isOverloaded ? "text-error-500" : isHeavy ? "text-warning-500" : "text-gray-400"}`}>
            {loadPercentage}%
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t border-gray-100 dark:border-white/[0.05] pt-3">
        <span className="text-[10px] text-gray-400 font-medium">ID: #{schedule.scheduleId}</span>

        <div className="flex items-center gap-1.5">
          {canManageAssignment && (
            <>
              <button
                onClick={() => onEdit(schedule)}
                className="flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700"
                title="Edit Assignment"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              {schedule.status === "Scheduled" && (
                <button
                  onClick={() => onDelete(schedule.scheduleId)}
                  className="flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-error-300 hover:bg-error-50 hover:text-error-600 dark:border-gray-700"
                  title="Remove Assignment"
                >
                  <TrashBinIcon className="w-4.6 h-4.6" />
                </button>
              )}
              <button
                onClick={() => onMarkAbsent(schedule.scheduleId)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-500 transition-all hover:border-error-300 hover:bg-error-50 hover:text-error-600 dark:border-gray-700"
              >
                Mark Absent
              </button>
            </>
          )}
          {!canManageAssignment && (
            <span className="text-[10px] text-gray-400 italic font-medium uppercase tracking-tighter">
              {schedule.status} - Locked
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Grouped by shift name ────────────────────────────────────────────────────
const WorkScheduleTable: React.FC<WorkScheduleTableProps> = ({
  schedules,
  isLoading,
  onMarkAbsent,
  onEdit,
  onDelete,
  dateFilter,
  onDateChange,
  onTodayClick,
  onAssignClick,
  onCloneWeekClick,
  isCloningWeek,
  isAdmin = false,
  onMaxLoadUpdated,
}) => {
  const showInitialLoading = isLoading && schedules.length === 0;

  // Group by shiftName for easier admin oversight
  const grouped = schedules.reduce<Record<string, WorkSchedule[]>>((acc, s) => {
    const key = s.shiftName || "Unassigned";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const displayDate = dateFilter
    ? new Date(dateFilter + "T00:00:00").toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : "";

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
      <WorkScheduleToolbar
        dateFilter={dateFilter}
        onDateChange={onDateChange}
        onTodayClick={onTodayClick}
        onAssignClick={onAssignClick}
        onCloneWeekClick={onCloneWeekClick}
        isCloningWeek={isCloningWeek}
        isAdmin={isAdmin}
      />

      <div className="p-6 border-t border-gray-100 dark:border-white/[0.05]">
        {/* Date subheader */}
        {displayDate && (
          <div className="flex items-center gap-2 mb-6">
            <CalenderIcon className="w-4.6 h-4.6 text-brand-500" />
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {displayDate}
            </span>
            {!isLoading && (
              <span className="ml-auto text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1">
                {schedules.length} assignment{schedules.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {showInitialLoading ? (
          /* Skeleton */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 dark:border-white/[0.05] p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
                  </div>
                </div>
                <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl mb-3" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-full mb-1" />
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full w-2/3" />
              </div>
            ))}
          </div>
        ) : schedules.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-15 w-15 items-center justify-center rounded-3xl bg-gray-50 dark:bg-gray-800 mb-5 shadow-sm">
              <UserCircleIcon className="h-6 w-6 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">No Assignments Found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
              No staff assigned on {displayDate}. Assign a new shift to get started.
            </p>
          </div>
        ) : (
          /* Grouped card grid */
          <div className="space-y-8">
            {Object.entries(grouped).map(([shiftName, group]) => (
              <div key={shiftName}>
                {/* Group header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
                    <TimeIcon className="w-4.6 h-4.6 text-brand-500" />
                  </div>
                  <h4 className="text-sm font-black text-gray-800 dark:text-gray-200">{shiftName}</h4>
                  <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800"></div>
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-2.5 py-0.5">
                    {group.length} staff
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {group.map((schedule) => (
                    <ScheduleCard
                      key={schedule.scheduleId}
                      schedule={schedule}
                      onMarkAbsent={onMarkAbsent}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isAdmin={isAdmin}
                      onMaxLoadUpdated={onMaxLoadUpdated}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkScheduleTable;
