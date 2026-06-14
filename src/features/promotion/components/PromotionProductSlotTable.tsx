"use client";

import React from "react";
import type { FieldArrayWithId, UseFormReturn } from "react-hook-form";
import type { PromotionFormData } from "../types/promotion";
import Input from "@/components/form/input/InputField";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrashBinIcon } from "@/icons";

interface PromotionProductSlotTableProps {
  form: UseFormReturn<PromotionFormData>;
  slotIndex: number;
  fields: FieldArrayWithId<PromotionFormData, `promotionTimeSlots.${number}.promotionProductSlots`>[];
  remove: (index: number) => void;
  readonly?: boolean;
}

export function PromotionProductSlotTable({
  form,
  slotIndex,
  fields,
  remove,
  readonly = false,
}: PromotionProductSlotTableProps) {

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-orange-500 dark:text-orange-400">
          List of Applicable Products
        </h3>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-white/[0.05] overflow-hidden">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-4 py-3 w-12 text-start font-medium text-gray-500 text-theme-xs dark:text-gray-400"
              >
                #
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-start font-medium text-gray-500 text-theme-xs dark:text-gray-400"
              >
                Product Name
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 w-36 text-start font-medium text-gray-500 text-theme-xs dark:text-gray-400"
              >
                Original Price (VND)
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 w-44 text-start font-medium text-gray-500 text-theme-xs dark:text-gray-400"
              >
                Sale Price (VND)
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 w-33 text-start font-medium text-gray-500 text-theme-xs dark:text-gray-400"
              >
                Discount (%)
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 w-36 text-start font-medium text-gray-500 text-theme-xs dark:text-gray-400"
              >
                Sale Quantity
              </TableCell>
              {readonly && (
                <TableCell
                  isHeader
                  className="px-4 py-3 w-36 text-start font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                >
                  Sold Quantity
                </TableCell>
              )}
              {!readonly && (
                <TableCell
                  isHeader
                  className="px-4 py-3 w-16 font-medium text-gray-500 text-theme-xs dark:text-gray-400 text-center"
                >
                  Delete
                </TableCell>
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {fields.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={readonly ? 7 : 7}
                  className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500"
                >
                  {readonly
                    ? "No products applied to this slot yet."
                    : "No products have been added to this slot yet. Please select from the catalog."}
                </TableCell>
              </TableRow>
            ) : (
              fields.map((field, index) => {
                const basePath = `promotionTimeSlots.${slotIndex}.promotionProductSlots.${index}` as const;

                return (
                  <TableRow key={field.id}>
                    <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                      {field.productName || `Product #${field.productId}`}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {field.originalPrice?.toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {readonly ? (
                        <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {Math.round(field.salePrice || 0).toLocaleString("vi-VN")}
                        </span>
                      ) : (
                        <Input
                          type="number"
                          step="any"
                          absoluteHint={true}
                          {...form.register(`${basePath}.salePrice`, {
                            setValueAs: (v) => (v === "" ? null : parseFloat(v)),
                            onChange: (e) => {
                              const val = e.target.value;
                              if (val === "") return;
                              const salePrice = parseFloat(val);
                              const originalPrice = form.getValues(`${basePath}.originalPrice`);
                              if (!isNaN(salePrice) && originalPrice) {
                                let discount = ((originalPrice - salePrice) / originalPrice) * 100;
                                discount = Math.round(discount * 100) / 100;
                                form.setValue(`${basePath}.discountPercent`, discount, { shouldValidate: true });
                              }
                            },
                          })}
                          error={!!form.formState.errors.promotionTimeSlots?.[slotIndex]?.promotionProductSlots?.[index]?.salePrice}
                          hint={form.formState.errors.promotionTimeSlots?.[slotIndex]?.promotionProductSlots?.[index]?.salePrice?.message}
                        />
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {readonly ? (
                        <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {field.discountPercent !== null && field.discountPercent !== undefined
                            ? `${field.discountPercent}`
                            : "-"}
                        </span>
                      ) : (
                        <Input
                          type="number"
                          step="0.01"
                          absoluteHint={true}
                          {...form.register(`${basePath}.discountPercent`, {
                            setValueAs: (v) => (v === "" ? null : parseFloat(v)),
                            onChange: (e) => {
                              const val = e.target.value;
                              if (val === "") return;
                              const discount = parseFloat(val);
                              const originalPrice = form.getValues(`${basePath}.originalPrice`);
                              if (!isNaN(discount) && originalPrice) {
                                const salePrice = Math.round(originalPrice * (1 - discount / 100));
                                form.setValue(`${basePath}.salePrice`, salePrice, { shouldValidate: true });
                              }
                            },
                          })}
                          placeholder="%"
                          error={!!form.formState.errors.promotionTimeSlots?.[slotIndex]?.promotionProductSlots?.[index]?.discountPercent}
                          hint={form.formState.errors.promotionTimeSlots?.[slotIndex]?.promotionProductSlots?.[index]?.discountPercent?.message}
                        />
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {readonly ? (
                        <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {field.saleQuantity !== null && field.saleQuantity !== undefined
                            ? field.saleQuantity
                            : "-"}
                        </span>
                      ) : (
                        <Input
                          type="number"
                          absoluteHint={true}
                          {...form.register(`${basePath}.saleQuantity`, {
                            setValueAs: (v) => (v === "" ? null : parseInt(v, 10)),
                          })}
                          placeholder={field.stock ? `Max ${field.stock}` : "Required"}
                          error={!!form.formState.errors.promotionTimeSlots?.[slotIndex]?.promotionProductSlots?.[index]?.saleQuantity}
                          hint={form.formState.errors.promotionTimeSlots?.[slotIndex]?.promotionProductSlots?.[index]?.saleQuantity?.message}
                        />
                      )}
                    </TableCell>
                    {readonly && (
                      <TableCell className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {field.soldQuantity ?? 0}
                        </span>
                      </TableCell>
                    )}
                    {!readonly && (
                      <TableCell className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-gray-400 hover:text-error-500 transition-colors"
                          title="Remove product"
                        >
                          <TrashBinIcon className="w-5 h-5" />
                        </button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
