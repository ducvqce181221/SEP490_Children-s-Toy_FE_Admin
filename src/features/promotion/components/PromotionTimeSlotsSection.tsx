"use client";

import React, { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import type { PromotionFormData } from "../types/promotion";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrashBinIcon, CloseIcon } from "@/icons";
import { formatUTCtoLocal, formatLocalToUTC, getIdealFutureTime, formatLocalToDisplay } from "@/utils/date-utils";
import { twMerge } from "tailwind-merge";

interface PromotionTimeSlotsSectionProps {
  form: UseFormReturn<PromotionFormData>;
  readonly?: boolean;
  isNew?: boolean;
}

type TabFilter = "Active_Scheduled" | "Inactive" | "Expired" | "All";

export function PromotionTimeSlotsSection({
  form,
  readonly = false,
}: PromotionTimeSlotsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabFilter>("Active_Scheduled");

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "promotionTimeSlots",
  });

  const handleAddSlot = () => {
    // Tạo slot mặc định: bắt đầu sau 10 phút, kết thúc sau 2 giờ 10 phút — hiển thị theo local
    const startUtc = new Date(getIdealFutureTime()).toISOString();
    const plusTwoHrUtc = new Date(getIdealFutureTime() + 2 * 3600 * 1000).toISOString();

    append({
      startAt: formatUTCtoLocal(startUtc),
      originalStartAt: formatUTCtoLocal(startUtc),
      endAt: formatUTCtoLocal(plusTwoHrUtc),
      status: "Scheduled",
      isNewSlot: true,
      promotionProductSlots: [],
    });
  };

  const tabs: { id: TabFilter; label: string }[] = [
    { id: "Active_Scheduled", label: "Active & Scheduled" },
    { id: "Inactive", label: "Inactive" },
    { id: "Expired", label: "Expired" },
    { id: "All", label: "All" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-orange-500 dark:text-orange-400">
          Flash Sale Time Slots
        </h3>
        {!readonly && (
          <Button type="button" variant="outline" onClick={handleAddSlot}>
            + Add Time Slot
          </Button>
        )}
      </div>

      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={twMerge(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-white/[0.05] overflow-hidden">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-4 py-3 w-12 text-start font-medium text-gray-500 text-theme-xs">
                #
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-start font-medium text-gray-500 text-theme-xs">
                Start At (Local)
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-start font-medium text-gray-500 text-theme-xs">
                End At (Local)
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-start font-medium text-gray-500 text-theme-xs">
                Status
              </TableCell>
              {!readonly && (
                <TableCell isHeader className="px-4 py-3 w-24 text-center font-medium text-gray-500 text-theme-xs">
                  Action
                </TableCell>
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {fields.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={readonly ? 4 : 5}
                  className="px-4 py-10 text-center text-sm text-gray-400"
                >
                  {readonly
                    ? "No time slots defined."
                    : "No time slots added. Click '+ Add Time Slot' to create one."}
                </TableCell>
              </TableRow>
            ) : (
              fields.map((field, index) => {
                const status = field.status || "Scheduled";
                
                // Filter logic
                if (activeTab === "Active_Scheduled" && status !== "Active" && status !== "Scheduled") return null;
                if (activeTab === "Inactive" && status !== "Inactive") return null;
                if (activeTab === "Expired" && status !== "Expired") return null;

                const isTimeLocked = readonly || status !== "Scheduled";
                
                return (
                <TableRow key={field.id}>
                  <TableCell className="px-4 py-3 text-sm text-gray-500">
                    {index + 1}
                  </TableCell>

                  {/* startAt */}
                  <TableCell className="px-4 py-3">
                    {isTimeLocked ? (
                      <>
                        <input type="hidden" {...form.register(`promotionTimeSlots.${index}.startAt`)} />
                        <span className="text-sm dark:text-white">
                          {formatLocalToDisplay(field.startAt)}
                        </span>
                      </>
                    ) : (
                      <Input
                        type="datetime-local"
                        absoluteHint={true}
                        {...form.register(`promotionTimeSlots.${index}.startAt`)}
                        error={!!form.formState.errors.promotionTimeSlots?.[index]?.startAt}
                        hint={form.formState.errors.promotionTimeSlots?.[index]?.startAt?.message}
                      />
                    )}
                  </TableCell>

                  {/* endAt */}
                  <TableCell className="px-4 py-3">
                    {isTimeLocked ? (
                      <>
                        <input type="hidden" {...form.register(`promotionTimeSlots.${index}.endAt`)} />
                        <span className="text-sm dark:text-white">
                          {formatLocalToDisplay(field.endAt)}
                        </span>
                      </>
                    ) : (
                      <Input
                        type="datetime-local"
                        absoluteHint={true}
                        {...form.register(`promotionTimeSlots.${index}.endAt`)}
                        error={!!form.formState.errors.promotionTimeSlots?.[index]?.endAt}
                        hint={form.formState.errors.promotionTimeSlots?.[index]?.endAt?.message}
                      />
                    )}
                  </TableCell>

                  {/* status */}
                  <TableCell className="px-4 py-3">
                    <input type="hidden" {...form.register(`promotionTimeSlots.${index}.status`)} />
                    <span className="text-sm rounded text-gray-900 dark:text-white">
                      {field.status || "Scheduled"}
                    </span>
                  </TableCell>

                  {!readonly && (
                    <TableCell className="px-4 py-3 text-center">
                      {!isTimeLocked && status === "Scheduled" && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-gray-400 hover:text-error-500 transition-colors p-1"
                          title="Delete slot"
                        >
                          <TrashBinIcon className="w-5 h-5" />
                        </button>
                      )}
                      {status === "Active" && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to stop this Active time slot? It will become Inactive and cannot be resumed.")) {
                              update(index, { ...field, status: "Inactive" });
                            }
                          }}
                          className="text-gray-400 hover:text-error-500 transition-colors p-1"
                          title="Emergency Stop"
                        >
                          <CloseIcon className="w-5 h-5" />
                        </button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )})
            )}
          </TableBody>
        </Table>
      </div>

      {/* Ghi chú múi giờ */}
      <p className="text-xs text-gray-400">
        * Time is displayed in your local timezone. It will be converted to UTC before saving.
      </p>
    </div>
  );
}

// Re-export formatLocalToUTC để dùng khi submit từ parent
export { formatLocalToUTC };
