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
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && superCategory) {
        reset({
          superCategoryName: superCategory.superCategoryName,
        });
      } else {
        reset({
          superCategoryName: "",
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
            : field;
        setError(fieldName as keyof SuperCategoryFormData, {
          type: "server",
          message: messages[0],
        });
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[500px] p-6 sm:p-10"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          {mode === "create" ? "Thêm danh mục lớn" : "Cập nhật danh mục lớn"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {mode === "create"
            ? "Nhập thông tin cho danh mục lớn mới."
            : "Chỉnh sửa thông tin danh mục lớn."}
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="mb-6 space-y-4">
          <div>
            <Label>
              Tên danh mục lớn <span className="text-error-500">*</span>
            </Label>
            <Input
              type="text"
              {...register("superCategoryName")}
              placeholder="Nhập tên danh mục lớn"
              disabled={isSubmitting}
              error={!!errors.superCategoryName}
              hint={errors.superCategoryName?.message}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
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

export default SuperCategoryFormModal;
