"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { customerApi } from "../services/customer-api";
import {
  ApiErrorResponse,
  UpdateCustomerRequest,
  UpdateCustomerResult,
} from "../types/customer";
import {
  updateCustomerSchema,
  UpdateCustomerFormValues,
} from "../types/customer.schema";

interface CustomerEditModalProps {
  customerId: number | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onSubmit: (
    customerId: number,
    payload: UpdateCustomerRequest,
  ) => Promise<UpdateCustomerResult>;
  onClose: () => void;
}

const selectClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const CustomerEditModal: React.FC<CustomerEditModalProps> = ({
  customerId,
  isOpen,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError: setFormError,
    formState: { errors },
  } = useForm<UpdateCustomerFormValues>({
    resolver: zodResolver(updateCustomerSchema),
    defaultValues: { isActive: "active" },
  });

  useEffect(() => {
    if (!isOpen || !customerId) {
      return;
    }

    let isCancelled = false;

    const fetchStatus = async () => {
      setIsLoading(true);
      setError(null);
      setIsReady(false);

      try {
        const detail = await customerApi.getCustomerById(customerId);
        if (!isCancelled) {
          reset({
            isActive: detail.isActive ? "active" : "inactive",
          });
          setIsReady(true);
        }
      } catch (err) {
        if (!isCancelled) {
          const axiosError = err as AxiosError<ApiErrorResponse>;
          setError(
            axiosError.response?.data?.message ??
              "Unable to load customer details.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchStatus();

    return () => {
      isCancelled = true;
    };
  }, [customerId, isOpen, reset]);

  const handleFormSubmit = async (values: UpdateCustomerFormValues) => {
    if (!customerId) {
      return;
    }

    const payload: UpdateCustomerRequest = {
      isActive: values.isActive === "active",
    };

    const result = await onSubmit(customerId, payload);
    if (!result.success) {
      if (result.validationErrors) {
        const statusMessages =
          result.validationErrors.IsActive ?? result.validationErrors.isActive;
        if (statusMessages?.length) {
          setFormError("isActive", {
            type: "server",
            message: statusMessages[0],
          });
          return;
        }
      }

      setError(result.message);
      return;
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-5 lg:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          Edit Customer
        </h2>
      </div>

      {isLoading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading customer details...
        </p>
      )}

      {!isLoading && error && (
        <p className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
          {error}
        </p>
      )}

      {isOpen &&
        customerId &&
        !isLoading &&
        isReady && (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(handleFormSubmit)}>
          <div>
            <label
              htmlFor="customer-status"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Status
            </label>
            <select id="customer-status" className={selectClassName} {...register("isActive")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {errors.isActive?.message && (
              <p className="mt-1 text-sm text-error-600">{errors.isActive.message}</p>
            )}
          </div>

          <div className="mt-3 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default CustomerEditModal;
