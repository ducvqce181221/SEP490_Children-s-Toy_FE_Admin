"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { twMerge } from "tailwind-merge";

import { promotionFormSchema, type PromotionFormData } from "../types/promotion.schema";
import type { Promotion } from "../types/promotion";
import type { ProductListItem } from "@/features/product/types/product";
import { usePromotionMutations } from "../hooks/usePromotionMutations";
import { ProductCatalogSection } from "./ProductCatalogSection";
import { ProductPromotionTable } from "./ProductPromotionTable";
import { WizardProgress } from "@/components/ui/wizard/WizardProgress";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";

interface PromotionWizardProps {
  initialData?: Promotion | null;
}

const PROMOTION_TYPE_OPTIONS = [
  { value: "Discount", label: "Giảm giá trực tiếp" },
  { value: "Voucher", label: "Voucher" },
  { value: "FlashSale", label: "Flash Sale" },
];

const PROMOTION_STATUS_OPTIONS = [
  { value: "Active", label: "Đang diễn ra (Active)" },
  { value: "Upcoming", label: "Sắp diễn ra (Upcoming)" },
  { value: "Expired", label: "Đã kết thúc (Expired)" },
];

const WIZARD_STEPS = ["General Information", "Select Products"];

export function PromotionWizard({ initialData }: PromotionWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  const { createPromotion, updatePromotion, isSubmitting } = usePromotionMutations(() => {
    router.push("/admin/promotions");
  });

  const form = useForm<PromotionFormData>({
    mode: "onTouched",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(promotionFormSchema) as any,
    defaultValues: {
      promotionName: "",
      promotionType: "Discount",
      description: "",
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      status: "Active",
      priority: 0,
      productPromotions: [],
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    formState: { errors },
    control,
  } = form;

  const fieldArray = useFieldArray({
    control,
    name: "productPromotions",
  });

  const { fields, append, remove: removeField } = fieldArray;

  useEffect(() => {
    if (initialData) {
      reset({
        promotionName: initialData.promotionName,
        promotionType: initialData.promotionType,
        description: initialData.description,
        startDate: new Date(initialData.startDate).toISOString().slice(0, 16),
        endDate: new Date(initialData.endDate).toISOString().slice(0, 16),
        status: initialData.status,
        priority: initialData.priority,
        productPromotions: initialData.productPromotions.map((p) => ({
          productId: p.productId,
          productName: p.productName,
          originalPrice: p.originalPrice,
          stock: p.stock,
          salePrice: p.salePrice,
          discountPercent: p.discountPercent,
          saleQuantity: p.saleQuantity,
          isActive: p.isActive,
        })),
      });
    }
  }, [initialData, reset]);

  const handleSyncProducts = (addedProducts: ProductListItem[], removedProductIds: number[]) => {
    if (removedProductIds.length > 0) {
      // We must iterate backwards or use filter to remove fields
      // Actually we can find the indices to remove
      const indicesToRemove = fields
        .map((f, index) => (removedProductIds.includes(f.productId) ? index : -1))
        .filter((index) => index !== -1)
        .reverse(); // Remove from end to avoid index shifting
      
      indicesToRemove.forEach((index) => removeField(index));
    }

    if (addedProducts.length > 0) {
      const newItems = addedProducts.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        originalPrice: p.price,
        stock: p.quantity,
        salePrice: p.price,
        discountPercent: null as number | null,
        saleQuantity: null as number | null,
        isActive: true,
      }));
      append(newItems);
    }
  };

  const onSubmit = async (data: PromotionFormData) => {
    // Strip productName and originalPrice before submitting
    const formattedData = {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      productPromotions: data.productPromotions.map(({ productName, originalPrice, stock, ...rest }) => rest),
    };

    if (initialData) {
      await updatePromotion(initialData.promotionId, formattedData);
    } else {
      await createPromotion(formattedData);
    }
  };

  const handleNextStep = async () => {
    // Validate Step 1 fields before proceeding
    const isStep1Valid = await trigger([
      "promotionName",
      "promotionType",
      "startDate",
      "endDate",
      "status",
      "priority",
      "description"
    ]);

    if (isStep1Valid) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  return (
    <div className="space-y-6">
      <WizardProgress steps={WIZARD_STEPS} currentStep={currentStep} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
              <h3 className="text-base font-semibold text-orange-500 dark:text-orange-400 mb-5">
                General Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="promotionName">Promotion Name <span className="text-error-500">*</span></Label>
                  <Input
                    id="promotionName"
                    type="text"
                    error={!!errors.promotionName}
                    hint={errors.promotionName?.message}
                    placeholder="Enter promotion name..."
                    {...register("promotionName")}
                  />
                </div>

                <div>
                  <Label htmlFor="promotionType">Promotion Type <span className="text-error-500">*</span></Label>
                  <Select
                    id="promotionType"
                    options={PROMOTION_TYPE_OPTIONS}
                    value={watch("promotionType")}
                    onChange={(e) => setValue("promotionType", e.target.value)}
                    error={!!errors.promotionType}
                    hint={errors.promotionType?.message}
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">Start Date <span className="text-error-500">*</span></Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    error={!!errors.startDate}
                    hint={errors.startDate?.message}
                    {...register("startDate")}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date <span className="text-error-500">*</span></Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    error={!!errors.endDate}
                    hint={errors.endDate?.message}
                    {...register("endDate")}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status <span className="text-error-500">*</span></Label>
                  <Select
                    id="status"
                    options={PROMOTION_STATUS_OPTIONS}
                    value={watch("status")}
                    onChange={(e) => setValue("status", e.target.value)}
                    error={!!errors.status}
                    hint={errors.status?.message}
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    error={!!errors.priority}
                    hint={errors.priority?.message}
                    {...register("priority")}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <TextArea
                    id="description"
                    rows={3}
                    {...register("description")}
                  />
                </div>
              </div>
            </div>

            {/* In Edit mode, show current products in readonly mode at the bottom of Step 1 */}
            {initialData && (
              <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
                <ProductPromotionTable
                  form={form}
                  fieldArray={fieldArray}
                  readonly={true}
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/promotions")}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="outline" 
                disabled={isSubmitting}
                className="border-brand-500 text-brand-500 hover:bg-brand-50"
              >
                {isSubmitting ? "Saving..." : "Save & Finish"}
              </Button>
              <Button type="button" variant="primary" onClick={handleNextStep}>
                Next: Select Products
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
              <ProductCatalogSection
                onConfirm={handleSyncProducts}
                selectedProductIds={fields.map((f) => f.productId)}
              />
            </div>

            <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
              <ProductPromotionTable
                form={form}
                fieldArray={fieldArray}
                readonly={false}
              />
            </div>

            <div className="flex justify-between items-center">
              <Button type="button" variant="outline" onClick={handlePrevStep}>
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className={twMerge(isSubmitting && "opacity-50 cursor-not-allowed")}
              >
                {isSubmitting ? "Saving..." : "Save Promotion"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
