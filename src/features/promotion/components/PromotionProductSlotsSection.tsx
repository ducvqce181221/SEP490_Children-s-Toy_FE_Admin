"use client";

import React, { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import type { PromotionFormData } from "../types/promotion";
import { PromotionProductSlotTable } from "./PromotionProductSlotTable";
import { ProductCatalogSection } from "./ProductCatalogSection";
import type { ProductListItem } from "@/features/product/types/product";
import Select from "@/components/form/Select";
import { formatLocalToDisplay } from "@/utils/date-utils";

interface PromotionProductSlotsSectionProps {
  form: UseFormReturn<PromotionFormData>;
  readonly?: boolean;
}

// Inner component that actually manages the useFieldArray for the selected slot.
// By giving this component a key={slotIndex}, React will remount it when the slot changes,
// properly re-initializing the useFieldArray hook with the new name.
function PromotionProductSlotManager({
  form,
  slotIndex,
  readonly,
}: {
  form: UseFormReturn<PromotionFormData>;
  slotIndex: number;
  readonly: boolean;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `promotionTimeSlots.${slotIndex}.promotionProductSlots` as const,
  });

  const handleSyncProducts = (addedProducts: ProductListItem[], removedProductIds: number[]) => {
    if (removedProductIds.length > 0) {
      // Remove fields by matching productId backwards to avoid index shifting
      const indicesToRemove = fields
        .map((f, index) => (removedProductIds.includes(f.productId) ? index : -1))
        .filter((index) => index !== -1)
        .reverse();
      
      indicesToRemove.forEach((index) => remove(index));
    }

    if (addedProducts.length > 0) {
      // Filter out products that are already in the list
      const existingIds = new Set(fields.map((f) => f.productId));
      const filteredNewProducts = addedProducts.filter((p) => !existingIds.has(p.productId));

      if (filteredNewProducts.length > 0) {
        const newItems = filteredNewProducts.map((p) => ({
          productId: p.productId,
          productName: p.productName,
          originalPrice: p.price,
          stock: p.quantity,
          salePrice: p.price, // Default to original price (consistent with Discount)
          discountPercent: 0, // Default to 0% discount
          saleQuantity: null as unknown as number, // Keep null to force user input for slot quantity
          isActive: true,
        }));
        append(newItems);
      }
    }
  };

  return (
    <>
      {!readonly && (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
          <ProductCatalogSection
            onConfirm={handleSyncProducts}
            selectedProductIds={fields.map((f) => f.productId)}
          />
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
        <PromotionProductSlotTable
          form={form}
          slotIndex={slotIndex}
          fields={fields}
          remove={remove}
          readonly={readonly}
        />
      </div>
    </>
  );
}

export function PromotionProductSlotsSection({
  form,
  readonly = false,
}: PromotionProductSlotsSectionProps) {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);

  // Watch the time slots to build the dropdown options
  const timeSlots = form.watch("promotionTimeSlots") || [];

  if (timeSlots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
        Please add at least one Time Slot in Step 1 before assigning products.
      </div>
    );
  }

  // Ensure selected index is valid
  const currentSlotIndex = Math.min(selectedSlotIndex, timeSlots.length - 1);

  const slotOptions = timeSlots.map((ts, index) => {
    const start = formatLocalToDisplay(ts.startAt, "N/A");
    const end = formatLocalToDisplay(ts.endAt, "N/A");
    return {
      value: index.toString(),
      label: `Slot ${index + 1}: ${start} to ${end}`,
    };
  });

  const currentSlotStatus = timeSlots[currentSlotIndex]?.status;
  const isSlotReadOnly = readonly || currentSlotStatus === "Active" || currentSlotStatus === "Expired";

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-white/[0.02] p-4 rounded-xl border border-gray-200 dark:border-white/[0.05]">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Time Slot to Manage Products
        </label>
        <div className="max-w-md">
          <Select
            options={slotOptions}
            value={currentSlotIndex.toString()}
            onChange={(e) => setSelectedSlotIndex(parseInt(e.target.value, 10))}
          />
        </div>
      </div>

      <PromotionProductSlotManager
        key={currentSlotIndex}
        form={form}
        slotIndex={currentSlotIndex}
        readonly={isSlotReadOnly}
      />
    </div>
  );
}
