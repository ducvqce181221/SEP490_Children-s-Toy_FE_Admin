"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import {
  SuperCategoryFormData,
  SuperCategoryFormSchema,
} from "../types/super-category.schema";
import {
  SuperCategoryListItem,
  SuperCategoryMutationResult,
} from "../types/super-category";

interface SuperCategoryFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  superCategory: SuperCategoryListItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (
    data: SuperCategoryFormData,
    id: number | null,
  ) => Promise<SuperCategoryMutationResult>;
}

const SuperCategoryFormModal: React.FC<SuperCategoryFormModalProps> = ({
  isOpen,
  mode,
  superCategory,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<SuperCategoryFormData>({
    resolver: zodResolver(SuperCategoryFormSchema),
    defaultValues: {
      superCategoryName: "",
      status: "Active",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && superCategory) {
        reset({
          superCategoryName: superCategory.superCategoryName,
          status: superCategory.status,
        });
      } else {
        reset({
          superCategoryName: "",
          status: "Active",
        });
      }
    }
  }, [isOpen, mode, superCategory, reset]);

  const handleFormSubmit = async (data: SuperCategoryFormData) => {
    const id = mode === "edit" ? superCategory?.superCategoryId ?? null : null;
    const result = await onSubmit(data, id);

    if (!result.success && result.validationErrors) {
      Object.entries(result.validationErrors).forEach(([field, messages]) => {
        const fieldName =
          field.toLowerCase() === "supercategoryname"
            ? "superCategoryName"
            : field.toLowerCase() === "status"
            ? "status"
            : field;
        setError(fieldName as keyof SuperCategoryFormData, {
          type: "server",
          message: messages[0],
        });
      });
    }
  };

  const isEditMode = mode === "edit";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[500px] p-6 sm:p-10"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          {mode === "create" ? "Add Super Category" : "Update Super Category"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {mode === "create"
            ? "Enter information for the new super category."
            : "Edit super category information."}
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="mb-6 space-y-4">
          <div>
            <Label>
              Super Category Name <span className="text-error-500">*</span>
            </Label>
            <Input
              type="text"
              {...register("superCategoryName")}
              placeholder="Enter super category name"
              disabled={isSubmitting}
              error={!!errors.superCategoryName}
              hint={errors.superCategoryName?.message}
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

export default SuperCategoryFormModal;
