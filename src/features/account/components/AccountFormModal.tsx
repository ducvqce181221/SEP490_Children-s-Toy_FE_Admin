"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import {
  createAccountSchema,
  CreateAccountFormValues,
} from "../types/account.schema";
import { CreateAccountRequest, CreateAccountResult } from "../types/account";

interface AccountFormModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAccountRequest) => Promise<CreateAccountResult>;
}

const defaultValues: CreateAccountFormValues = {
  accountName: "",
  phoneNumber: "",
  email: "",
  roleId: "3",
  password: "",
  confirmPassword: "",
};

const inputClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

const getFieldNameFromServer = (
  fieldName: string,
): keyof CreateAccountFormValues | null => {
  const normalized = fieldName.toLowerCase();

  if (normalized === "accountname") {
    return "accountName";
  }

  if (normalized === "phonenumber") {
    return "phoneNumber";
  }

  if (normalized === "email") {
    return "email";
  }

  if (normalized === "roleid") {
    return "roleId";
  }

  if (normalized === "password") {
    return "password";
  }

  return null;
};

const AccountFormModal: React.FC<AccountFormModalProps> = ({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountSchema),
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues);
    }
  }, [isOpen, reset]);

  const handleClose = () => {
    setFormError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const handleFormSubmit = async (values: CreateAccountFormValues) => {
    setFormError(null);

    const payload: CreateAccountRequest = {
      roleId: Number(values.roleId),
      accountName: values.accountName.trim(),
      phoneNumber: values.phoneNumber.trim() === "" ? null : values.phoneNumber.trim(),
      email: values.email.trim(),
      password: values.password,
    };

    const result = await onSubmit(payload);
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
          Add New Account
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Backend currently supports creating Staff and Merchandiser accounts.
        </p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit(handleFormSubmit)}>
        <div>
          <label
            htmlFor="account-name"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Account Name
          </label>
          <input
            id="account-name"
            type="text"
            className={inputClassName}
            placeholder="Enter account name"
            {...register("accountName")}
          />
          {errors.accountName?.message && (
            <p className="mt-1 text-sm text-error-600">{errors.accountName.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="account-phone-number"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Phone Number
          </label>
          <input
            id="account-phone-number"
            type="text"
            className={inputClassName}
            placeholder="Example: 0901234567"
            {...register("phoneNumber")}
          />
          {errors.phoneNumber?.message && (
            <p className="mt-1 text-sm text-error-600">{errors.phoneNumber.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="account-email"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email
          </label>
          <input
            id="account-email"
            type="email"
            className={inputClassName}
            placeholder="name@company.com"
            {...register("email")}
          />
          {errors.email?.message && (
            <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="account-role-id"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Role
          </label>
          <select id="account-role-id" className={inputClassName} {...register("roleId")}>
            <option value="3">Staff</option>
            <option value="4">Merchandiser</option>
          </select>
          {errors.roleId?.message && (
            <p className="mt-1 text-sm text-error-600">{errors.roleId.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="account-password"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="account-password"
              type={showPassword ? "text" : "password"}
              className={`${inputClassName} pr-11`}
              placeholder="At least 8 characters"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white/90"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeIcon className="fill-current" />
              ) : (
                <EyeCloseIcon className="fill-current" />
              )}
            </button>
          </div>
          {errors.password?.message && (
            <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="account-confirm-password"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="account-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              className={`${inputClassName} pr-11`}
              placeholder="Re-enter password"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white/90"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? (
                <EyeIcon className="fill-current" />
              ) : (
                <EyeCloseIcon className="fill-current" />
              )}
            </button>
          </div>
          {errors.confirmPassword?.message && (
            <p className="mt-1 text-sm text-error-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

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
            {isSubmitting ? "Creating..." : "Create Account"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AccountFormModal;
