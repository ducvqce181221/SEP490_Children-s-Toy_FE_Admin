"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { brandFormSchema, BrandFormValues } from "../types/brand.schema";
import { BrandFormRequest, BrandListItem, BrandMutationResult } from "../types/brand";

interface BrandFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  brand: BrandListItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (
    payload: BrandFormRequest,
    brandId: number | null,
  ) => Promise<BrandMutationResult>;
}

const defaultValues: BrandFormValues = {
  brandName: "",
  status: "Active",
};

const inputClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

const getFieldNameFromServer = (
  fieldName: string,
): keyof BrandFormValues | null => {
  const normalized = fieldName.toLowerCase();

  if (normalized === "brandname") {
    return "brandName";
  }

  if (normalized === "status") {
    return "status";
  }

  return null;
};

const BrandFormModal: React.FC<BrandFormModalProps> = ({
  isOpen,
  mode,
  brand,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const isEditMode = mode === "edit";

  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        brandName: brand?.brandName ?? "",
        status: brand?.status ?? "Active",
      });
    }
  }, [brand, isOpen, reset]);

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const handleFormSubmit = async (values: BrandFormValues) => {
    setFormError(null);

    const payload: BrandFormRequest = {
      brandName: values.brandName.trim(),
      ...(isEditMode ? { status: values.status } : {}),
    };

    const result = await onSubmit(payload, brand?.brandId ?? null);

    if (!result.success) {
      if (result.validationErrors) {
        Object.entries(result.validationErrors).forEach(([field, messages]) => {
          const mappedField = getFieldNameFromServer(field);
          if (mappedField && messages.length > 0) {
            setError(mappedField, {
              type: "server",
              message: messages[0],
            });
          }
        });
        return;
      }

      setFormError(result.message);
      return;
    }

    reset(defaultValues);
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[640px] p-5 lg:p-8">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          {isEditMode ? "Edit Brand" : "Add New Brand"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isEditMode
            ? "Update brand name and status."
            : "Provide brand name information to create a new brand."}
        </p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit(handleFormSubmit)}>
        <div>
          <label
            htmlFor="brand-name"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Brand Name
          </label>
          <input
            id="brand-name"
            type="text"
            className={inputClassName}
            placeholder="Enter brand name"
            {...register("brandName")}
          />
          {errors.brandName?.message && (
            <p className="mt-1 text-sm text-error-600">{errors.brandName.message}</p>
          )}
        </div>

        {isEditMode && (
          <div>
            <label
              htmlFor="brand-status"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Status
            </label>
            <select id="brand-status" className={inputClassName} {...register("status")}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            {errors.status?.message && (
              <p className="mt-1 text-sm text-error-600">{errors.status.message}</p>
            )}
          </div>
        )}

        {formError && (
          <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
            {formError}
          </p>
        )}

        <div className="mt-3 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
                ? "Update Brand"
                : "Create Brand"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default BrandFormModal;
