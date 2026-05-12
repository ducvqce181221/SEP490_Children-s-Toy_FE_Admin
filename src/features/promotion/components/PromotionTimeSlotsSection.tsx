"use client";

import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import type { PromotionFormData } from "../types/promotion";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrashBinIcon } from "@/icons";
import { formatUTCtoLocal, formatLocalToUTC, getIdealFutureTime } from "@/utils/date-utils";

interface PromotionTimeSlotsSectionProps {
  form: UseFormReturn<PromotionFormData>;
  readonly?: boolean;
  isNew?: boolean;
}



export function PromotionTimeSlotsSection({
  form,
  readonly = false,
  isNew = false,
}: PromotionTimeSlotsSectionProps) {
  const { fields, append, remove } = useFieldArray({
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
                <TableCell isHeader className="px-4 py-3 w-16 text-center font-medium text-gray-500 text-theme-xs">
                  Delete
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
                const isSlotActive = field.status === "Active";
                const isTimeLocked = readonly || field.status !== "Scheduled";
                


                return (
                <TableRow key={field.id}>
                  <TableCell className="px-4 py-3 text-sm text-gray-500">
                    {index + 1}
                  </TableCell>

                  {/* startAt */}
                  <TableCell className="px-4 py-3">
                    {isTimeLocked ? (
                      <span className="text-sm">
                        {/* Hiển thị local từ giá trị datetime-local đã lưu */}
                        {field.startAt ? field.startAt.replace("T", " ").substring(0, 16) : "—"}
                      </span>
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
                      <span className="text-sm">
                        {field.endAt ? field.endAt.replace("T", " ").substring(0, 16) : "—"}
                      </span>
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
                    <span className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-medium text-gray-900 dark:text-white">
                      {field.status || "Scheduled"}
                    </span>
                  </TableCell>

                  {!readonly && (
                    <TableCell className="px-4 py-3 text-center">
                      {!isTimeLocked && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-gray-400 hover:text-error-500 transition-colors"
                          title="Delete slot"
                        >
                          <TrashBinIcon className="w-5 h-5" />
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
