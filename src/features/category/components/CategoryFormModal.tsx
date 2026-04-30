import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import {
  CategoryFormData,
  CategoryFormSchema,
} from "../types/category.schema";
import {
  CategoryListItem,
  CategoryMutationResult,
} from "../types/category";
import { superCategoryApi } from "@/features/super-category/services/super-category-api";
import { SuperCategoryListItem } from "@/features/super-category/types/super-category";

interface CategoryFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  category: CategoryListItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (
    data: CategoryFormData,
    id: number | null,
  ) => Promise<CategoryMutationResult>;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  mode,
  category,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const [superCategories, setSuperCategories] = useState<SuperCategoryListItem[]>([]);
  const [isLoadingSuperCategories, setIsLoadingSuperCategories] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: {
      categoryName: "",
      superCategoryId: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && category) {
        reset({
          categoryName: category.categoryName,
          superCategoryId: category.superCategoryId,
        });
      } else {
        reset({
          categoryName: "",
          superCategoryId: 0,
        });
      }
    }
  }, [isOpen, mode, category, reset]);

  useEffect(() => {
    if (isOpen) {
      const fetchSuperCategories = async () => {
        setIsLoadingSuperCategories(true);
        try {
          // Fetch all super categories (up to 100 as per API limit)
          const res = await superCategoryApi.getSuperCategories({
            pageNumber: 1,
            pageSize: 100,
          });
          setSuperCategories(res.items);
        } catch (error) {
          console.error("Failed to load super categories", error);
        } finally {
          setIsLoadingSuperCategories(false);
        }
      };

      fetchSuperCategories();
    }
  }, [isOpen]);

  const handleFormSubmit = async (data: CategoryFormData) => {
    const id = mode === "edit" ? category?.categoryId ?? null : null;
    const result = await onSubmit(data, id);

    if (!result.success && result.validationErrors) {
      Object.entries(result.validationErrors).forEach(([field, messages]) => {
        const fieldName =
          field.toLowerCase() === "categoryname"
            ? "categoryName"
            : field.toLowerCase() === "supercategoryid"
            ? "superCategoryId"
            : field;
        setError(fieldName as keyof CategoryFormData, {
          type: "server",
          message: messages[0],
        });
      });
    }
  };

  const superCategoryOptions = [
    { value: 0, label: "Chọn danh mục lớn..." },
    ...superCategories.map((sc) => ({
      value: sc.superCategoryId,
      label: sc.superCategoryName,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[500px] p-6 sm:p-10"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          {mode === "create" ? "Thêm danh mục" : "Cập nhật danh mục"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {mode === "create"
            ? "Nhập thông tin cho danh mục mới."
            : "Chỉnh sửa thông tin danh mục."}
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="mb-6 space-y-4">
          <div>
            <Label>
              Danh mục lớn <span className="text-error-500">*</span>
            </Label>
            <Select
              {...register("superCategoryId", { valueAsNumber: true })}
              options={superCategoryOptions}
              disabled={isSubmitting || isLoadingSuperCategories}
            />
            {errors.superCategoryId && (
              <p className="mt-1.5 text-sm text-error-500">
                {errors.superCategoryId.message}
              </p>
            )}
          </div>

          <div>
            <Label>
              Tên danh mục <span className="text-error-500">*</span>
            </Label>
            <Input
              type="text"
              {...register("categoryName")}
              placeholder="Nhập tên danh mục"
              disabled={isSubmitting}
              error={!!errors.categoryName}
              hint={errors.categoryName?.message}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {mode === "create" ? "Thêm mới" : "Cập nhật"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryFormModal;
