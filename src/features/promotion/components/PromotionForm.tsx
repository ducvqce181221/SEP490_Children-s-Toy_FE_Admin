"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { promotionFormSchema, type PromotionFormData } from "../types/promotion.schema";
import type { Promotion } from "../types/promotion";
import type { ProductListItem } from "@/features/product/types/product";
import { usePromotionMutations } from "../hooks/usePromotionMutations";
import { ProductPickerModal } from "./ProductPickerModal";
import { ProductPromotionTable } from "./ProductPromotionTable";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";
import { twMerge } from "tailwind-merge";

interface PromotionFormProps {
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

export function PromotionForm({ initialData }: PromotionFormProps) {
  const router = useRouter();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

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
    formState: { errors },
    control,
  } = form;

  const fieldArray = useFieldArray({
    control,
    name: "productPromotions",
  });

  const { fields, append, remove } = fieldArray;

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
          salePrice: p.salePrice,
          discountPercent: p.discountPercent,
          saleQuantity: p.saleQuantity,
          isActive: p.isActive,
        })),
      });
    }
  }, [initialData, reset]);

  const handleAddProducts = (products: ProductListItem[]) => {
    const newItems = products.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      salePrice: p.price,
      discountPercent: null as number | null,
      saleQuantity: null as number | null,
      isActive: true,
    }));
    append(newItems);
  };

  const onSubmit = async (data: PromotionFormData) => {
    const formattedData = {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
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
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-5">
            Thông tin chung
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Promotion Name */}
            <div>
              <Label htmlFor="promotionName">Tên chương trình *</Label>
              <Input
                id="promotionName"
                type="text"
                error={!!errors.promotionName}
                hint={errors.promotionName?.message}
                {...register("promotionName")}
              />
            </div>

            {/* Promotion Type */}
            <div>
              <Label htmlFor="promotionType">Loại hình khuyến mãi *</Label>
              <Select
                id="promotionType"
                options={PROMOTION_TYPE_OPTIONS}
                value={watch("promotionType")}
                onChange={(e) => setValue("promotionType", e.target.value)}
                error={!!errors.promotionType}
                hint={errors.promotionType?.message}
              />
            </div>

            {/* Start Date */}
            <div>
              <Label htmlFor="startDate">Ngày bắt đầu *</Label>
              <Input
                id="startDate"
                type="datetime-local"
                error={!!errors.startDate}
                hint={errors.startDate?.message}
                {...register("startDate")}
              />
            </div>

            {/* End Date */}
            <div>
              <Label htmlFor="endDate">Ngày kết thúc *</Label>
              <Input
                id="endDate"
                type="datetime-local"
                error={!!errors.endDate}
                hint={errors.endDate?.message}
                {...register("endDate")}
              />
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Trạng thái *</Label>
              <Select
                id="status"
                options={PROMOTION_STATUS_OPTIONS}
                value={watch("status")}
                onChange={(e) => setValue("status", e.target.value)}
                error={!!errors.status}
                hint={errors.status?.message}
              />
            </div>

            {/* Priority */}
            <div>
              <Label htmlFor="priority">Mức ưu tiên</Label>
              <Input
                id="priority"
                type="number"
                error={!!errors.priority}
                hint={errors.priority?.message}
                {...register("priority")}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <Label htmlFor="description">Mô tả</Label>
              <TextArea
                id="description"
                rows={3}
                {...register("description")}
              />
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
          <ProductPromotionTable
            form={form}
            fieldArray={fieldArray}
            onOpenPicker={() => setIsPickerOpen(true)}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/promotions")}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className={twMerge(isSubmitting && "opacity-50 cursor-not-allowed")}
          >
            {isSubmitting ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </form>

      <ProductPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onAddProducts={handleAddProducts}
        selectedProductIds={fields.map((f) => f.productId)}
      />
    </>
  );
}
