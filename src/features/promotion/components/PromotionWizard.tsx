"use client";

import React, { useState, useEffect, useId, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch, type FieldErrors } from "react-hook-form";
import type Quill from "quill";
import { zodResolver } from "@hookform/resolvers/zod";
import { twMerge } from "tailwind-merge";
import toast from "react-hot-toast";

import { promotionFormSchema, type PromotionFormData } from "../types/promotion.schema";
import type { Promotion } from "../types/promotion";
import { PROMOTION_TYPE_OPTIONS, PROMOTION_TYPE_CONFIG, PROMOTION_TYPES } from "../types/promotion";
import { formatUTCtoLocal, formatLocalToUTC, getIdealFutureTime } from "@/utils/date-utils";
import type { ProductListItem } from "@/features/product/types/product";
import { usePromotionMutations } from "../hooks/usePromotionMutations";
import { ProductCatalogSection } from "./ProductCatalogSection";
import { ProductPromotionTable } from "./ProductPromotionTable";
import { PromotionProductSlotsSection } from "./PromotionProductSlotsSection";
import { PromotionTimeSlotsSection } from "./PromotionTimeSlotsSection";
import { WizardProgress } from "@/components/ui/wizard/WizardProgress";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";

interface PromotionWizardProps {
  initialData?: Promotion | null;
}

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
      promotionType: PROMOTION_TYPES.DISCOUNT,
      description: "",
      startDate: formatUTCtoLocal(new Date(getIdealFutureTime()).toISOString()),
      originalStartDate: formatUTCtoLocal(new Date(getIdealFutureTime()).toISOString()),
      endDate: formatUTCtoLocal(new Date(getIdealFutureTime() + 86400000).toISOString()),
      status: "Scheduled",
      priority: 0,
      productPromotions: [],
      promotionTimeSlots: [],
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

  const isNew = !initialData;
  const isGlobalReadOnly = initialData?.status === "Expired";
  const currentStatus = watch("status") || "Scheduled";
  const isActive = currentStatus === "Active";
  const isExpired = currentStatus === "Expired" || isGlobalReadOnly;

  // Check if the promotion has transactions (soldQuantity > 0)
  const hasTransactions = React.useMemo(() => {
    if (!initialData) return false;
    const hasDiscountSales = false;
    const hasFlashSaleSales = initialData.promotionTimeSlots?.some(ts => 
      ts.promotionProductSlots?.some(ps => ps.soldQuantity > 0)
    ) ?? false;
    return hasDiscountSales || hasFlashSaleSales;
  }, [initialData]);

  // Safeguard Locks:
  const isPricingProductsLocked = isExpired || isActive || hasTransactions;
  const isTypeLocked = isExpired || isActive || hasTransactions;
  const isStartDateLocked = isExpired || isActive || hasTransactions;
  const isCosmeticLocked = isExpired;

  // Status Select dropdown options
  const statusOptions = React.useMemo(() => {
    const currentStatusVal = initialData?.status || "Scheduled";
    switch (currentStatusVal) {
      case "Scheduled":
        return [
          { value: "Scheduled", label: "Scheduled" },
          { value: "Active", label: "Active (Start Now)" },
          { value: "Inactive", label: "Inactive (Pause)" },
        ];
      case "Active":
        return [
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive (Pause)" },
        ];
      case "Inactive":
        return [
          { value: "Inactive", label: "Inactive" },
          { value: "Scheduled", label: "Scheduled (Reschedule)" },
          { value: "Active", label: "Active (Resume Now)" },
        ];
      case "Expired":
      default:
        return [{ value: currentStatusVal, label: currentStatusVal }];
    }
  }, [initialData]);

  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const pendingDescriptionRef = useRef("");
  const isApplyingDescriptionRef = useRef(false);
  const toolbarId = `promotion-description-toolbar-${useId().replace(/:/g, "")}`;
  const descriptionValue = useWatch({ control, name: "description" });
  const descriptionTextLength = descriptionValue ? descriptionValue.replace(/<[^>]*>?/gm, "").length : 0;

  const normalizeDescriptionHtml = useCallback((rawValue: unknown) => {
    if (typeof rawValue !== "string") return "";
    const trimmed = rawValue.trim();
    if (trimmed.length === 0 || trimmed === "<p><br></p>") return "";
    return trimmed;
  }, []);

  const toDescriptionFormValue = useCallback(
    (html: string): string | null => {
      const normalizedHtml = normalizeDescriptionHtml(html);
      if (normalizedHtml.length === 0) return null;
      if (typeof window === "undefined") return normalizedHtml;
      const parser = document.createElement("div");
      parser.innerHTML = normalizedHtml;
      const plainText = parser.textContent?.replace(/\u00a0/g, " ").trim() ?? "";
      return plainText.length === 0 ? null : normalizedHtml;
    },
    [normalizeDescriptionHtml],
  );

  const setDescriptionEditorContent = useCallback(
    (html: string) => {
      const normalizedContent = normalizeDescriptionHtml(html);
      if (!quillRef.current) {
        pendingDescriptionRef.current = normalizedContent;
        return;
      }
      isApplyingDescriptionRef.current = true;
      if (normalizedContent.length === 0) {
        quillRef.current.setText("", "api");
      } else {
        const delta = quillRef.current.clipboard.convert({ html: normalizedContent });
        quillRef.current.setContents(delta, "api");
      }
      setValue("description", toDescriptionFormValue(quillRef.current.root.innerHTML), {
        shouldValidate: true,
      });
      queueMicrotask(() => {
        isApplyingDescriptionRef.current = false;
      });
    },
    [normalizeDescriptionHtml, setValue, toDescriptionFormValue],
  );

  useEffect(() => {
    let cancelled = false;
    const initializeDescriptionEditor = async () => {
      if (quillRef.current || !editorRef.current) return;
      const QuillModule = await import("quill");
      if (cancelled || !editorRef.current || quillRef.current) return;
      const Quill = QuillModule.default;
      const quill = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: `#${toolbarId}`,
        },
        placeholder: "Enter promotion description...",
      });
      quill.on("text-change", (_delta, _oldDelta, source) => {
        if (source !== "user" || isApplyingDescriptionRef.current) return;
        setValue("description", toDescriptionFormValue(quill.root.innerHTML), {
          shouldValidate: true,
        });
      });
      quillRef.current = quill;
      setDescriptionEditorContent(pendingDescriptionRef.current);
      quill.enable(!isCosmeticLocked);
    };
    void initializeDescriptionEditor();
    return () => {
      cancelled = true;
    };
  }, [toolbarId, isCosmeticLocked, setDescriptionEditorContent, setValue, toDescriptionFormValue]);

  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!isCosmeticLocked && !isSubmitting);
    }
  }, [isCosmeticLocked, isSubmitting]);

  useEffect(() => {
    if (initialData) {
      reset({
        promotionName: initialData.promotionName,
        promotionType: initialData.promotionType,
        description: initialData.description,
        startDate: formatUTCtoLocal(initialData.startDate),
        originalStartDate: formatUTCtoLocal(initialData.startDate),
        endDate: formatUTCtoLocal(initialData.endDate),
        status: initialData.status,
        priority: initialData.priority,
        productPromotions: initialData.productPromotions.map((p) => ({
          productId: p.productId,
          productName: p.productName,
          originalPrice: p.originalPrice,
          stock: p.stock,
          salePrice: p.salePrice,
          discountPercent: p.discountPercent,
        })),
        // Map startAt/endAt từ UTC (API) → local (datetime-local input)
        promotionTimeSlots: initialData.promotionTimeSlots?.map((ts) => ({
          startAt: formatUTCtoLocal(ts.startAt),
          originalStartAt: formatUTCtoLocal(ts.startAt),
          endAt: formatUTCtoLocal(ts.endAt),
          status: ts.status,
          promotionProductSlots: (ts.promotionProductSlots ?? []).map((ps) => ({
            productId: ps.productId,
            productName: ps.productName,
            originalPrice: ps.originalPrice,
            stock: undefined as number | undefined,
            salePrice: ps.salePrice,
            discountPercent: ps.discountPercent,
            saleQuantity: ps.saleQuantity,
            soldQuantity: ps.soldQuantity,
          })),
        })) ?? [],
      });
      pendingDescriptionRef.current = normalizeDescriptionHtml(initialData.description);
      setDescriptionEditorContent(pendingDescriptionRef.current);
    } else {
      pendingDescriptionRef.current = "";
      setDescriptionEditorContent("");
    }
  }, [initialData, reset, normalizeDescriptionHtml, setDescriptionEditorContent]);

  const handleSyncProducts = (addedProducts: ProductListItem[], removedProductIds: number[]) => {
    if (removedProductIds.length > 0) {
      // We must iterate backwards or use filter to remove fields
      const indicesToRemove = fields
        .map((f, index) => (removedProductIds.includes(f.productId) ? index : -1))
        .filter((index) => index !== -1)
        .reverse(); // Remove from end to avoid index shifting
      
      indicesToRemove.forEach((index) => removeField(index));
    }

    if (addedProducts.length > 0) {
      // Filter out products that are already in the list
      const existingIds = new Set(fields.map(f => f.productId));
      const filteredNewProducts = addedProducts.filter(p => !existingIds.has(p.productId));

      if (filteredNewProducts.length > 0) {
        const newItems = filteredNewProducts.map((p) => ({
          productId: p.productId,
          productName: p.productName,
          originalPrice: p.price,
          stock: p.quantity,
          salePrice: p.price,
          discountPercent: 0,
        }));
        append(newItems);
      }
    }
  };

  const onSubmit = async (data: PromotionFormData) => {
    // Strip productName và originalPrice trước khi submit, convert timestamps sang UTC
    const formattedData = {
      ...data,
      startDate: formatLocalToUTC(data.startDate),
      endDate: formatLocalToUTC(data.endDate),
      status: isNew ? "Scheduled" : data.status,
      productPromotions: data.productPromotions.map(
        ({ productName: _pn, originalPrice: _op, stock: _st, ...rest }) => rest
      ),
      promotionTimeSlots: PROMOTION_TYPE_CONFIG[data.promotionType]?.hasTimeSlots
        ? data.promotionTimeSlots.map((ts) => ({
            startAt: formatLocalToUTC(ts.startAt),   // local → UTC ISO string
            endAt: formatLocalToUTC(ts.endAt),       // local → UTC ISO string
            status: ts.isNewSlot ? "Scheduled" : ts.status,
            promotionProductSlots: ts.promotionProductSlots.map(
              ({ productName: _pn, originalPrice: _op, stock: _st, ...rest }) => rest
            ),
          }))
        : [],
    };

    if (initialData) {
      await updatePromotion(initialData.promotionId, formattedData);
    } else {
      await createPromotion(formattedData);
    }
  };

  const onError = (errors: FieldErrors<PromotionFormData>) => {
    const step1Fields: (keyof PromotionFormData)[] = [
      "promotionName",
      "promotionType",
      "startDate",
      "endDate",
      "status",
      "priority",
      "description"
    ];

    const hasTimeSlotStep1Errors = errors.promotionTimeSlots && (
      (errors.promotionTimeSlots as any).message || 
      (Array.isArray(errors.promotionTimeSlots) && errors.promotionTimeSlots.some((slotError: any) => {
        if (!slotError) return false;
        return slotError.startAt || slotError.endAt || slotError.status;
      }))
    );

    const hasStep1Errors = step1Fields.some(field => field in errors) || !!hasTimeSlotStep1Errors;

    if (hasStep1Errors) {
      setCurrentStep(1);
      toast.error("Please correct the validation errors in the General Information step.");
    } else {
      setCurrentStep(2);
      toast.error("Please correct the validation errors in the Select Products step.");
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
      "description",
      "promotionTimeSlots"
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

      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
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
                    disabled={isCosmeticLocked}
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
                    disabled={isTypeLocked}
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
                    disabled={isStartDateLocked}
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
                    disabled={isCosmeticLocked}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status <span className="text-error-500">*</span></Label>
                  {isNew ? (
                    <div className="h-11 px-4 flex items-center bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-white/90">
                      <input type="hidden" {...register("status")} />
                      <span className="font-medium text-gray-900 dark:text-white">{watch("status") || "Scheduled"}</span>
                    </div>
                  ) : (
                    <Select
                      id="status"
                      options={statusOptions}
                      value={watch("status")}
                      onChange={(e) => setValue("status", e.target.value)}
                      error={!!errors.status}
                      hint={errors.status?.message}
                      disabled={isCosmeticLocked}
                    />
                  )}
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    error={!!errors.priority}
                    hint={errors.priority?.message}
                    {...register("priority")}
                    disabled={isCosmeticLocked}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <div className="overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
                    <div id={toolbarId} className="border-b border-gray-300 p-2 dark:border-gray-700">
                      <span className="ql-formats">
                        <button className="ql-bold" type="button" />
                        <button className="ql-italic" type="button" />
                        <button className="ql-underline" type="button" />
                        <button className="ql-strike" type="button" />
                      </span>
                      <span className="ql-formats">
                        <select className="ql-color" />
                        <select className="ql-background" />
                      </span>
                      <span className="ql-formats">
                        <button className="ql-list" value="ordered" type="button" />
                        <button className="ql-list" value="bullet" type="button" />
                      </span>
                      <span className="ql-formats">
                        <button className="ql-clean" type="button" />
                      </span>
                    </div>
                    <div
                      ref={editorRef}
                      className="min-h-[140px] bg-white text-sm text-gray-800 dark:bg-gray-900 dark:text-white/90"
                    />
                    <div className="border-t border-gray-200 px-3 py-2 text-right text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      {descriptionTextLength}/1000
                    </div>
                  </div>
                  <input type="hidden" {...register("description")} />
                  {errors.description && (
                    <p className="mt-1.5 text-sm text-error-500">{errors.description.message}</p>
                  )}
                </div>
              </div>
            </div>

            {PROMOTION_TYPE_CONFIG[watch("promotionType")]?.hasTimeSlots && (
              <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
                <PromotionTimeSlotsSection form={form} readonly={isPricingProductsLocked} isNew={isNew} hasTransactions={hasTransactions} />
              </div>
            )}

            {/* In Edit mode, show current products/slots in readonly mode at the bottom of Step 1 */}
            {initialData && (
              <>
                {PROMOTION_TYPE_CONFIG[watch("promotionType")]?.hasTimeSlots ? (
                  <PromotionProductSlotsSection form={form} readonly={true} />
                ) : (
                  <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
                    <ProductPromotionTable
                      form={form}
                      fieldArray={fieldArray}
                      readonly={true}
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/promotions")}
              >
                Cancel
              </Button>
              {!isCosmeticLocked && (
                <Button 
                  type="submit" 
                  variant="outline" 
                  disabled={isSubmitting}
                  className="border-brand-500 text-brand-500 hover:bg-brand-50"
                >
                  {isSubmitting ? "Saving..." : "Save & Finish"}
                </Button>
              )}
              <Button type="button" variant="primary" onClick={handleNextStep}>
                Next: Select Products
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            {PROMOTION_TYPE_CONFIG[watch("promotionType")]?.hasTimeSlots ? (
              <PromotionProductSlotsSection form={form} readonly={isPricingProductsLocked} />
            ) : (
              <>
                {!isPricingProductsLocked && (
                  <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
                    <ProductCatalogSection
                      onConfirm={handleSyncProducts}
                      selectedProductIds={fields.map((f) => f.productId)}
                    />
                  </div>
                )}

                <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
                  <ProductPromotionTable
                    form={form}
                    fieldArray={fieldArray}
                    readonly={isPricingProductsLocked}
                  />
                </div>
              </>
            )}

            <div className="flex justify-between items-center pt-6">
              <Button type="button" variant="outline" onClick={handlePrevStep}>
                Back
              </Button>
              {!isCosmeticLocked && (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className={twMerge(isSubmitting && "opacity-50 cursor-not-allowed")}
                >
                  {isSubmitting ? "Saving..." : "Save Promotion"}
                </Button>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
