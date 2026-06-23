"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver as zr } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/modal";
import {
  ShiftTemplate,
  ShiftTemplateFormData,
  ShiftTemplateCreateSchema,
  ShiftTemplateLockedUpdateSchema,
  formatDuration,
  timeToMinutes,
} from "../types/shift";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

interface ShiftFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShiftTemplateFormData) => Promise<void>;
  initialData?: ShiftTemplate | null;
  isSubmitting: boolean;
}

const hourOptions = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, "0");
  return { value: h, label: h };
});

const minuteOptions = Array.from({ length: 60 }, (_, i) => {
  const m = i.toString().padStart(2, "0");
  return { value: m, label: m };
});

const ShiftFormModal: React.FC<ShiftFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}) => {
  const isEdit = !!initialData;
  const timeLocked = isEdit && (initialData?.activeScheduleCount ?? 0) > 0;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ShiftTemplateFormData>({
    resolver: zr(timeLocked ? ShiftTemplateLockedUpdateSchema : ShiftTemplateCreateSchema) as any,
    defaultValues: {
      shiftName: "",
      startTime: "08:00",
      endTime: "17:00",
      maxOrdersPerShift: 20,
      isActive: true,
    },
  });

  const shiftName = watch("shiftName") || "";
  const startTime = watch("startTime") || "";
  const endTime = watch("endTime") || "";

  const startHour = startTime && startTime.includes(":") ? startTime.split(":")[0] : "08";
  const startMin = startTime && startTime.includes(":") ? startTime.split(":")[1] : "00";
  const endHour = endTime && endTime.includes(":") ? endTime.split(":")[0] : "17";
  const endMin = endTime && endTime.includes(":") ? endTime.split(":")[1] : "00";

  const handleStartHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue("startTime", `${e.target.value}:${startMin}`, { shouldValidate: true });
  };

  const handleStartMinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue("startTime", `${startHour}:${e.target.value}`, { shouldValidate: true });
  };

  const handleEndHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue("endTime", `${e.target.value}:${endMin}`, { shouldValidate: true });
  };

  const handleEndMinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue("endTime", `${endHour}:${e.target.value}`, { shouldValidate: true });
  };

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
          startTime: "08:00",
          endTime: "17:00",
          maxOrdersPerShift: 20,
          isActive: true,
        });
      }
    }
  }, [initialData, reset, isOpen]);

  const duration = formatDuration(startTime, endTime);
  const bothFilled = startTime.length >= 5 && endTime.length >= 5;
  const endBeforeStart =
    bothFilled && timeToMinutes(endTime) <= timeToMinutes(startTime);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[520px] p-0 overflow-hidden">
      <div className="bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {isEdit ? "Edit Shift Template" : "Create New Shift"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {isEdit
                ? "Update the operational shift configuration."
                : "Define a new operational time block for your team."}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Lock banner */}
          {timeLocked && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-500/10">
              <span className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                </svg>
              </span>
              <div>
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  This template has {initialData?.activeScheduleCount} active work schedule(s).
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Shift times and active status are locked until those schedules are completed or cancelled.
                  You can still update the name or default max orders.
                </p>
              </div>
            </div>
          )}

          {/* Shift Name */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Shift Name <span className="text-error-500">*</span>
              </label>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                {shiftName.length}/50 characters (min 2)
              </span>
            </div>
            <Input
              placeholder="e.g. Morning Shift, Afternoon Run..."
              {...register("shiftName")}
              maxLength={50}
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
              /* Read-only display when locked */
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
                <span className="text-gray-400 dark:text-gray-500">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                  {startTime?.slice(0, 5) ?? initialData?.startTime.slice(0, 5)}
                </span>
                <span className="text-gray-400 dark:text-gray-500">—</span>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                  {endTime?.slice(0, 5) ?? initialData?.endTime.slice(0, 5)}
                </span>
                {formatDuration(
                  startTime || initialData?.startTime || "",
                  endTime || initialData?.endTime || ""
                ) && (
                  <span className="ml-auto text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded">
                    {formatDuration(
                      startTime || initialData?.startTime || "",
                      endTime || initialData?.endTime || ""
                    )}
                  </span>
                )}
              </div>
            ) : (
              /* Editable Hour/Minute dropdowns */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {/* Start Time */}
                  <div>
                    <label htmlFor="start-hour" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Start Time
                    </label>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1">
                        <Select
                          id="start-hour"
                          options={hourOptions}
                          value={startHour}
                          onChange={handleStartHourChange}
                          disabled={isSubmitting}
                          placeholder="Hour"
                        />
                      </div>
                      <span className="text-gray-400 font-bold text-lg select-none">:</span>
                      <div className="flex-1">
                        <Select
                          id="start-minute"
                          options={minuteOptions}
                          value={startMin}
                          onChange={handleStartMinChange}
                          disabled={isSubmitting}
                          placeholder="Min"
                        />
                      </div>
                    </div>
                    {errors.startTime?.message && (
                      <p className="mt-1 text-[11px] text-error-500 font-medium">{errors.startTime.message}</p>
                    )}
                  </div>

                  {/* End Time */}
                  <div>
                    <label htmlFor="end-hour" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      End Time
                    </label>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1">
                        <Select
                          id="end-hour"
                          options={hourOptions}
                          value={endHour}
                          onChange={handleEndHourChange}
                          disabled={isSubmitting}
                          placeholder="Hour"
                        />
                      </div>
                      <span className="text-gray-400 font-bold text-lg select-none">:</span>
                      <div className="flex-1">
                        <Select
                          id="end-minute"
                          options={minuteOptions}
                          value={endMin}
                          onChange={handleEndMinChange}
                          disabled={isSubmitting}
                          placeholder="Min"
                        />
                      </div>
                    </div>
                    {errors.endTime?.message && (
                      <p className="mt-1 text-[11px] text-error-500 font-medium">{errors.endTime.message}</p>
                    )}
                  </div>
                </div>

                {/* Hidden input elements to register startTime and endTime */}
                <input type="hidden" {...register("startTime")} />
                <input type="hidden" {...register("endTime")} />

                {/* Duration badge / inline error */}
                <div>
                  {bothFilled && (
                    endBeforeStart ? (
                      <p className="text-[11px] text-error-500 font-medium">
                        End time must be later than start time
                      </p>
                    ) : duration ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded">
                        Duration: {duration}
                      </span>
                    ) : null
                  )}
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                    Shifts must be within the same day. Overnight shifts are not supported.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Max Orders */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Default Max Orders Per Shift <span className="text-error-500">*</span>
              </label>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                Allowed: 1 - 200
              </span>
            </div>
            <Input
              type="number"
              min={1}
              max={200}
              placeholder="e.g. 20"
              {...register("maxOrdersPerShift", { valueAsNumber: true })}
              error={!!errors.maxOrdersPerShift}
              hint={errors.maxOrdersPerShift?.message}
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Applies to newly created work schedules only. Existing schedules keep their current capacity.
            </p>
          </div>

          {/* Active Toggle */}
          {!timeLocked ? (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Shift Active</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Enable this shift for work schedule assignments
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register("isActive")}
                  disabled={isSubmitting}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-300 transition-all after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:bg-brand-500 peer-checked:after:translate-x-full dark:bg-gray-600"></div>
              </label>
            </div>
          ) : (
            <input type="hidden" {...register("isActive")} />
          )}

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
