"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/modal";
import { ShiftTemplate, ShiftTemplateFormData, ShiftTemplateSchema } from "../types/shift";
import Button from "@/components/ui/button/Button";
import { TimeIcon, BoxIcon } from "@/icons";

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[520px] p-0 overflow-hidden">
      <div className="bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/30">
              <TimeIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEdit ? "Edit Shift Template" : "Create New Shift"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {isEdit ? "Update the operational shift configuration." : "Define a new operational time block for your team."}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-6 space-y-6">
          {/* Shift Name */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
              Shift Name <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Morning Shift, Afternoon Run..."
              className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-gray-800 transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white/90 dark:focus:border-brand-700 dark:focus:bg-gray-800"
              {...register("shiftName")}
            />
            {errors.shiftName?.message && (
              <p className="mt-1.5 text-xs text-error-500 font-medium">{errors.shiftName.message}</p>
            )}
          </div>

          {/* Time Range */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
              Time Interval <span className="text-error-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="time"
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-black text-gray-900 tabular-nums transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:focus:border-brand-700 dark:focus:bg-gray-800"
                    {...register("startTime")}
                  />
                  <p className="mt-1 text-[10px] text-gray-400 uppercase tracking-wider font-bold ml-1">Start</p>
                </div>
                {errors.startTime?.message && (
                  <p className="mt-1 text-xs text-error-500 font-medium">{errors.startTime.message}</p>
                )}
              </div>

              <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                <div className="h-px w-6 bg-gray-300 dark:bg-gray-600"></div>
                <TimeIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                <div className="h-px w-6 bg-gray-300 dark:bg-gray-600"></div>
              </div>

              <div className="flex-1">
                <div className="relative">
                  <input
                    type="time"
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-black text-gray-900 tabular-nums transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:focus:border-brand-700 dark:focus:bg-gray-800"
                    {...register("endTime")}
                  />
                  <p className="mt-1 text-[10px] text-gray-400 uppercase tracking-wider font-bold ml-1">End</p>
                </div>
                {errors.endTime?.message && (
                  <p className="mt-1 text-xs text-error-500 font-medium">{errors.endTime.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Max Orders */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
              Max Orders Per Shift <span className="text-error-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 shadow-sm">
                <BoxIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <input
                type="number"
                min={1}
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-14 pr-4 text-sm font-bold text-gray-900 transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:focus:border-brand-700 dark:focus:bg-gray-800"
                {...register("maxOrdersPerShift", { valueAsNumber: true })}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase tracking-wide">
                orders
              </span>
            </div>
            {errors.maxOrdersPerShift?.message && (
              <p className="mt-1.5 text-xs text-error-500 font-medium">{errors.maxOrdersPerShift.message}</p>
            )}
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Shift Active</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Enable this shift for work schedule assignments</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                id="isActive"
                {...register("isActive")}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 transition-all after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:bg-brand-500 peer-checked:after:translate-x-full dark:bg-gray-700 peer-checked:dark:bg-brand-500"></div>
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-xl px-6">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl px-8 shadow-md shadow-brand-500/25">
              {isSubmitting ? "Saving..." : isEdit ? "Update Shift" : "Create Shift"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ShiftFormModal;
