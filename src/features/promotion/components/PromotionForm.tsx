"use client";

import { useEffect, useId, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import type Quill from "quill";
import { zodResolver } from "@hookform/resolvers/zod";
import { promotionFormSchema, type PromotionFormData } from "../types/promotion.schema";
import { PROMOTION_TYPE_OPTIONS, PROMOTION_TYPE_CONFIG } from "../types/promotion";
import type { Promotion } from "../types/promotion";
import { formatUTCtoLocal, formatLocalToUTC, formatDisplayDate } from "@/utils/date-utils";
import { usePromotionMutations } from "../hooks/usePromotionMutations";
import { ProductPromotionTable } from "./ProductPromotionTable";
import { PromotionTimeSlotsSection } from "./PromotionTimeSlotsSection";
import { PromotionProductSlotsSection } from "./PromotionProductSlotsSection";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";
import { twMerge } from "tailwind-merge";

interface PromotionFormProps {
  initialData?: Promotion | null;
  readonly?: boolean;
}

const PROMOTION_STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Scheduled", label: "Scheduled" },
  { value: "Inactive", label: "Inactive" },
  { value: "Expired", label: "Expired" },
];

export function PromotionForm({ initialData, readonly = false }: PromotionFormProps) {
  const router = useRouter();

  const { createPromotion, updatePromotion, isSubmitting } = usePromotionMutations(() => {
    router.push("/admin/promotions");
  });

  const form = useForm<PromotionFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(promotionFormSchema) as any,
    defaultValues: {
      promotionName: "",
      promotionType: "Discount",
      description: "",
      startDate: formatUTCtoLocal(new Date().toISOString()),
      originalStartDate: formatUTCtoLocal(new Date().toISOString()),
      endDate: formatUTCtoLocal(new Date(Date.now() + 86400000).toISOString()),
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
    formState: { errors },
    control,
  } = form;

  const fieldArray = useFieldArray({
    control,
    name: "productPromotions",
  });

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
      quill.enable(!readonly);
    };
    void initializeDescriptionEditor();
    return () => {
      cancelled = true;
    };
  }, [toolbarId, readonly, setDescriptionEditorContent, setValue, toDescriptionFormValue]);

  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!readonly && !isSubmitting);
    }
  }, [readonly, isSubmitting]);

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

  // Removed handleAddProducts since this form is now only used for View Details

  const onSubmit = async (data: PromotionFormData) => {
    const formattedData = {
      ...data,
      startDate: formatLocalToUTC(data.startDate),
      endDate: formatLocalToUTC(data.endDate),
      productPromotions: data.productPromotions.map(({ ...rest }) => rest),
      promotionTimeSlots: PROMOTION_TYPE_CONFIG[data.promotionType]?.hasTimeSlots
        ? data.promotionTimeSlots.map((ts) => ({
            startAt: formatLocalToUTC(ts.startAt),   // local → UTC ISO string
            endAt: formatLocalToUTC(ts.endAt),       // local → UTC ISO string
            status: ts.status,
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

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General Info Section */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
          <h3 className="text-base font-semibold text-orange-500 dark:text-orange-400 mb-5">
            General Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Promotion Name */}
            <div>
              <Label htmlFor="promotionName">Promotion Name <span className="text-error-500">*</span></Label>
              <Input
                id="promotionName"
                type="text"
                error={!!errors.promotionName}
                hint={errors.promotionName?.message}
                disabled={readonly}
                {...register("promotionName")}
              />
            </div>

            {/* Promotion Type */}
            <div>
              <Label htmlFor="promotionType">Promotion Type <span className="text-error-500">*</span></Label>
              <Select
                id="promotionType"
                options={PROMOTION_TYPE_OPTIONS}
                value={watch("promotionType")}
                onChange={(e) => setValue("promotionType", e.target.value)}
                error={!!errors.promotionType}
                hint={errors.promotionType?.message}
                disabled={readonly}
              />
            </div>

            {/* Start Date */}
            <div>
              <Label htmlFor="startDate">Start Date <span className="text-error-500">*</span></Label>
              {readonly ? (
                <div className="h-11 px-4 flex items-center bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-white/90">
                  {formatDisplayDate(initialData?.startDate)}
                </div>
              ) : (
                <Input
                  id="startDate"
                  type="datetime-local"
                  error={!!errors.startDate}
                  hint={errors.startDate?.message}
                  {...register("startDate")}
                />
              )}
            </div>

            {/* End Date */}
            <div>
              <Label htmlFor="endDate">End Date <span className="text-error-500">*</span></Label>
              {readonly ? (
                <div className="h-11 px-4 flex items-center bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-white/90">
                  {formatDisplayDate(initialData?.endDate)}
                </div>
              ) : (
                <Input
                  id="endDate"
                  type="datetime-local"
                  error={!!errors.endDate}
                  hint={errors.endDate?.message}
                  {...register("endDate")}
                />
              )}
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status <span className="text-error-500">*</span></Label>
              <Select
                id="status"
                options={PROMOTION_STATUS_OPTIONS}
                value={watch("status")}
                onChange={(e) => setValue("status", e.target.value)}
                error={!!errors.status}
                hint={errors.status?.message}
                disabled={readonly}
              />
            </div>

            {/* Priority */}
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                error={!!errors.priority}
                hint={errors.priority?.message}
                disabled={readonly}
                {...register("priority")}
              />
            </div>

            {/* Description */}
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
            </div>
          </div>
        </div>

        {PROMOTION_TYPE_CONFIG[watch("promotionType")]?.hasTimeSlots && (
          <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
            <PromotionTimeSlotsSection form={form} readonly={readonly} />
          </div>
        )}

        {/* Products Section */}
        {PROMOTION_TYPE_CONFIG[watch("promotionType")]?.hasTimeSlots ? (
          <PromotionProductSlotsSection form={form} readonly={readonly} />
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
            <ProductPromotionTable
              form={form}
              fieldArray={fieldArray}
              readonly={readonly}
            />
          </div>
        )}

        {/* Actions */}
        {!readonly && (
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
              variant="primary"
              disabled={isSubmitting}
              className={twMerge(isSubmitting && "opacity-50 cursor-not-allowed")}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </form>
    </>
  );
}
