"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/modal";
import { ShiftTemplate, ShiftTemplateFormData, ShiftTemplateSchema } from "../types/shift";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import DatePicker from "@/components/form/date-picker";
import { TimeIcon } from "@/icons";

function formatDuration(start: string, end: string): string | null {
  const timeRe = /^([01]\d|2[0-3]):([0-5]\d)/;
  if (!timeRe.test(start) || !timeRe.test(end)) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) return null;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

interface ShiftFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShiftTemplateFormData) => Promise<void>;
  initialData?: ShiftTemplate | null;
  isSubmitting: boolean;
}

const ShiftFormModal: React.FC<ShiftFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ShiftTemplateFormData>({
    resolver: zodResolver(ShiftTemplateSchema),
    defaultValues: {
      shiftName: "",
      startTime: "",
      endTime: "",
      maxOrdersPerShift: 20,
      isActive: true,
    },
  });

  const startTime = watch("startTime");
  const endTime = watch("endTime");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          shiftName: initialData.shiftName,
          startTime: initialData.startTime.slice(0, 5),
          endTime: initialData.endTime.slice(0, 5),
          maxOrdersPerShift: initialData.maxOrdersPerShift,
          isActive: initialData.isActive,
        });
      } else {
        reset({
          shiftName: "",
          startTime: "",
          endTime: "",
          maxOrdersPerShift: 20,
          isActive: true,
        });
      }
    }
  }, [initialData, reset, isOpen]);

  const isEdit = !!initialData;
  const timeLocked = isEdit && (initialData?.activeScheduleCount ?? 0) > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[520px] p-0 overflow-hidden">
      <div className="bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
              <TimeIcon className="h-6 w-6 fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {isEdit ? "Edit Shift Template" : "Create New Shift"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {isEdit ? "Update the operational shift configuration." : "Define a new operational time block for your team."}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {timeLocked && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-500/10 dark:text-amber-300">
              This template has active work schedules. Shift times cannot be changed until those schedules finish.
              You can still update the name or default max orders for new schedules.
            </div>
          )}

          {/* Shift Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Shift Name <span className="text-error-500">*</span>
            </label>
            <Input
              placeholder="e.g. Morning Shift, Afternoon Run..."
              {...register("shiftName")}
              error={!!errors.shiftName}
              hint={errors.shiftName?.message}
            />
          </div>

          {/* Time Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Time Interval {!timeLocked && <span className="text-error-500">*</span>}
            </label>
            {timeLocked ? (
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
                <span>{startTime?.slice(0, 5) ?? initialData?.startTime.slice(0, 5)}</span>
                <span className="text-gray-400">—</span>
                <span>{endTime?.slice(0, 5) ?? initialData?.endTime.slice(0, 5)}</span>
              </div>
            ) : (
            <div className="flex items-start gap-3">
              <div className="flex-1 relative">
                <DatePicker
                  id="startTime"
                  mode="time"
                  dateFormat="H:i"
                  defaultDate={startTime}
                  onChange={(_, dateStr) => setValue("startTime", dateStr, { shouldValidate: true })}
                />
                {errors.startTime?.message && (
                  <p className="mt-1 text-[11px] text-error-500 font-medium">{errors.startTime.message}</p>
                )}
              </div>

              <div className="flex flex-col items-center justify-start shrink-0 pt-2.5 gap-1">
                <span className="text-gray-400 dark:text-gray-500 font-medium">—</span>
                {formatDuration(startTime, endTime) && (
                  <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                    {formatDuration(startTime, endTime)}
                  </span>
                )}
              </div>

              <div className="flex-1 relative">
                <DatePicker
                  id="endTime"
                  mode="time"
                  dateFormat="H:i"
                  defaultDate={endTime}
                  onChange={(_, dateStr) => setValue("endTime", dateStr, { shouldValidate: true })}
                />
                {errors.endTime?.message && (
                  <p className="mt-1 text-[11px] text-error-500 font-medium">{errors.endTime.message}</p>
                )}
              </div>
            </div>
            )}
          </div>

          {/* Max Orders */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Default Max Orders Per Shift <span className="text-error-500">*</span>
            </label>
            <Input
              type="number"
              min={1}
              {...register("maxOrdersPerShift", { valueAsNumber: true })}
              error={!!errors.maxOrdersPerShift}
              hint={errors.maxOrdersPerShift?.message}
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Applies to newly created work schedules only. Existing schedules keep their current capacity.
            </p>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Shift Active</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {timeLocked
                  ? "Cannot deactivate while work schedules are Scheduled or On Duty"
                  : "Enable this shift for work schedule assignments"}
              </p>
            </div>
            <label className={`relative inline-flex items-center ${timeLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
              <input
                type="checkbox"
                id="isActive"
                {...register("isActive")}
                disabled={timeLocked}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-300 transition-all after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:bg-brand-500 peer-checked:after:translate-x-full dark:bg-gray-600"></div>
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-lg px-6 h-10 text-sm font-medium border-gray-300">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-lg px-8 h-10 text-sm font-medium shadow-sm">
              {isSubmitting ? "Saving..." : isEdit ? "Update Shift" : "Create Shift"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ShiftFormModal;
