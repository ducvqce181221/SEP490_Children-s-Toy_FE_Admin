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
      status: "Active",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && category) {
        reset({
          categoryName: category.categoryName,
          superCategoryId: category.superCategoryId,
          status: category.status,
        });
      } else {
        reset({
          categoryName: "",
          superCategoryId: 0,
          status: "Active",
        });
      }
    }
  }, [isOpen, mode, category, reset]);

  useEffect(() => {
    if (isOpen) {
      const fetchSuperCategories = async () => {
        setIsLoadingSuperCategories(true);
        try {
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
            : field.toLowerCase() === "status"
            ? "status"
            : field;
        setError(fieldName as keyof CategoryFormData, {
          type: "server",
          message: messages[0],
        });
      });
    }
  };

  const superCategoryOptions = [
    { value: "0", label: "Select super category..." },
    ...superCategories.map((sc) => ({
      value: String(sc.superCategoryId),
      label: sc.superCategoryName,
    })),
  ];

  const isEditMode = mode === "edit";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[500px] p-6 sm:p-10"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          {mode === "create" ? "Add Category" : "Update Category"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {mode === "create"
            ? "Enter information for the new category."
            : "Edit category information."}
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="mb-6 space-y-4">
          <div>
            <Label>
              Super Category <span className="text-error-500">*</span>
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
              Category Name <span className="text-error-500">*</span>
            </Label>
            <Input
              type="text"
              {...register("categoryName")}
              placeholder="Enter category name"
              disabled={isSubmitting}
              error={!!errors.categoryName}
              hint={errors.categoryName?.message}
            />
          </div>

          {isEditMode && (
            <div>
              <Label>
                Status <span className="text-error-500">*</span>
              </Label>
              <select
                {...register("status")}
                disabled={isSubmitting}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              {errors.status && (
                <p className="mt-1.5 text-sm text-error-500">
                  {errors.status.message}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {mode === "create" ? "Add" : "Update"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryFormModal;
