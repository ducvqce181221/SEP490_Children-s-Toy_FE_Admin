"use client";

import React from "react";
import type { UseFieldArrayReturn, UseFormReturn } from "react-hook-form";
import type { PromotionFormData } from "../types/promotion";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrashBinIcon } from "@/icons";

interface ProductPromotionTableProps {
  form: UseFormReturn<PromotionFormData>;
  fieldArray: UseFieldArrayReturn<PromotionFormData, "productPromotions">;
  onOpenPicker: () => void;
}

export function ProductPromotionTable({
  form,
  fieldArray,
  onOpenPicker,
}: ProductPromotionTableProps) {
  const { fields, remove } = fieldArray;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Danh sách sản phẩm áp dụng
        </h3>
        <Button type="button" onClick={onOpenPicker} variant="outline" size="sm">
          + Thêm sản phẩm
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-white/[0.05] overflow-hidden">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-4 py-3 font-medium text-gray-500 text-theme-xs dark:text-gray-400"
              >
                Tên sản phẩm
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 w-44 font-medium text-gray-500 text-theme-xs dark:text-gray-400"
              >
                Giá Sale (đ)
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 w-32 font-medium text-gray-500 text-theme-xs dark:text-gray-400"
              >
                % Giảm
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 w-36 font-medium text-gray-500 text-theme-xs dark:text-gray-400"
              >
                SL Giới hạn
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 w-16 font-medium text-gray-500 text-theme-xs dark:text-gray-400 text-center"
              >
                Xóa
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {fields.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500"
                >
                  Chưa có sản phẩm nào. Hãy bấm &quot;Thêm sản phẩm&quot; để thêm.
                </TableCell>
              </TableRow>
            ) : (
              fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                    {field.productName || `Sản phẩm #${field.productId}`}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Input
                      type="number"
                      {...form.register(`productPromotions.${index}.salePrice`, {
                        valueAsNumber: true,
                      })}
                      error={!!form.formState.errors.productPromotions?.[index]?.salePrice}
                      hint={form.formState.errors.productPromotions?.[index]?.salePrice?.message}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Input
                      type="number"
                      {...form.register(`productPromotions.${index}.discountPercent`, {
                        valueAsNumber: true,
                      })}
                      placeholder="%"
                      error={!!form.formState.errors.productPromotions?.[index]?.discountPercent}
                      hint={form.formState.errors.productPromotions?.[index]?.discountPercent?.message}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Input
                      type="number"
                      {...form.register(`productPromotions.${index}.saleQuantity`, {
                        valueAsNumber: true,
                      })}
                      placeholder="SL"
                      error={!!form.formState.errors.productPromotions?.[index]?.saleQuantity}
                      hint={form.formState.errors.productPromotions?.[index]?.saleQuantity?.message}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-gray-400 hover:text-error-500 transition-colors"
                      title="Xóa sản phẩm"
                    >
                      <TrashBinIcon className="w-5 h-5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
