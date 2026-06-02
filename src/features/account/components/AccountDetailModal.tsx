"use client";

import { AxiosError } from "axios";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { accountApi } from "../services/account-api";
import type { UpdateAccountPasswordResult } from "../hooks/useAccountMutations";
import { updateAccountInfoSchema } from "../types/account.schema";
import {
  AccountDetail,
  ApiErrorResponse,
  UpdateAccountInfoRequest,
  UpdateAccountInfoResult,
} from "../types/account";

interface AccountDetailModalProps {
  accountId: number | null;
  isOpen: boolean;
  mode: "detail" | "edit";
  isSavingInfo?: boolean;
  isSavingPassword?: boolean;
  onUpdateInfo?: (
    accountId: number,
    payload: UpdateAccountInfoRequest,
  ) => Promise<UpdateAccountInfoResult>;
  onUpdatePassword?: (
    accountId: number,
    payload: { newPassword: string; confirmNewPassword: string },
  ) => Promise<UpdateAccountPasswordResult>;
  onClose: () => void;
}

const inputClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white/90";

const formatDateTime = (dateValue: string | null) => {
  if (!dateValue) {
    return "--";
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsedDate);
};

const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  accountId,
  isOpen,
  mode,
  isSavingInfo = false,
  isSavingPassword = false,
  onUpdateInfo,
  onUpdatePassword,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountDetail, setAccountDetail] = useState<AccountDetail | null>(null);
  const [statusValue, setStatusValue] = useState<"active" | "inactive">("active");
  const [accountName, setAccountName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    accountName?: string;
    phoneNumber?: string;
  }>({});
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  useEffect(() => {
    if (!isOpen || !accountId) {
      return;
    }

    let isCancelled = false;

    const fetchAccountDetail = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await accountApi.getAccountById(accountId);

        if (!isCancelled) {
          setAccountDetail(response);
          setStatusValue(response.isActive ? "active" : "inactive");
          setAccountName(response.accountName);
          setPhoneNumber(response.phoneNumber ?? "");
          setFieldErrors({});
          setNewPassword("");
          setConfirmNewPassword("");
          setPasswordError(null);
          setShowNewPassword(false);
          setShowConfirmNewPassword(false);
        }
      } catch (error) {
        if (!isCancelled) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          setError(
            axiosError.response?.data?.message ??
              "Unable to load account details.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchAccountDetail();

    return () => {
      isCancelled = true;
    };
  }, [accountId, isOpen]);

  const avatarText =
    accountDetail?.accountName && accountDetail.accountName.length > 0
      ? accountDetail.accountName[0].toUpperCase()
      : "?";

  const handleSave = async () => {
    if (!accountDetail) {
      return;
    }

    const nextIsActive = statusValue === "active";
    const normalizedAccountName = accountName.trim();
    const normalizedPhoneNumber = phoneNumber.trim();
    const hasAccountUpdate =
      normalizedAccountName !== accountDetail.accountName ||
      nextIsActive !== accountDetail.isActive ||
      normalizedPhoneNumber !== (accountDetail.phoneNumber ?? "");
    const hasPasswordInput =
      newPassword.trim().length > 0 || confirmNewPassword.trim().length > 0;

    setFieldErrors({});
    setPasswordError(null);

    if (hasAccountUpdate) {
      const validationResult = updateAccountInfoSchema.safeParse({
        accountName,
        phoneNumber,
      });

      if (!validationResult.success) {
        const nextFieldErrors: { accountName?: string; phoneNumber?: string } = {};
        for (const issue of validationResult.error.issues) {
          const fieldName = issue.path[0];
          if (fieldName === "accountName" || fieldName === "phoneNumber") {
            nextFieldErrors[fieldName] = issue.message;
          }
        }
        setFieldErrors(nextFieldErrors);
        return;
      }
    }

    if (hasPasswordInput) {
      if (newPassword.trim().length === 0 || confirmNewPassword.trim().length === 0) {
        setPasswordError("Please enter both new password fields.");
        return;
      }

      if (newPassword !== confirmNewPassword) {
        setPasswordError("Confirm new password does not match new password.");
        return;
      }

      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(newPassword)) {
        setPasswordError(
          "New password must contain at least one uppercase letter, one lowercase letter, and one digit.",
        );
        return;
      }
    }

    if (!hasAccountUpdate && !hasPasswordInput) {
      onClose();
      return;
    }

    if (hasAccountUpdate && onUpdateInfo) {
      const infoResult = await onUpdateInfo(accountDetail.accountId, {
        accountName: normalizedAccountName,
        phoneNumber: normalizedPhoneNumber === "" ? null : normalizedPhoneNumber,
        isActive: nextIsActive,
      });

      if (!infoResult.success) {
        if (infoResult.validationErrors) {
          setFieldErrors({
            accountName: infoResult.validationErrors.AccountName?.[0],
            phoneNumber: infoResult.validationErrors.PhoneNumber?.[0],
          });
        }
        return;
      }

      if (infoResult.data) {
        setAccountDetail(infoResult.data);
        setAccountName(infoResult.data.accountName);
        setPhoneNumber(infoResult.data.phoneNumber ?? "");
      }
    }

    if (hasPasswordInput && onUpdatePassword) {
      const passwordResult = await onUpdatePassword(accountDetail.accountId, {
        newPassword: newPassword.trim(),
        confirmNewPassword: confirmNewPassword.trim(),
      });
      if (!passwordResult.success) {
        setPasswordError(
          passwordResult.validationErrors?.NewPassword?.[0] ??
            passwordResult.validationErrors?.ConfirmNewPassword?.[0] ??
            passwordResult.message,
        );
        return;
      }
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[760px] p-5 lg:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          {mode === "edit" ? "Edit Account" : "Account Detail"}
        </h2>
      </div>

      {isLoading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading account details...
        </p>
      )}

      {!isLoading && error && (
        <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
          {error}
        </p>
      )}

      {!isLoading && !error && accountDetail && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Profile Image
            </label>
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-base font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                {accountDetail.imageUrl ? (
                  <Image
                    src={accountDetail.imageUrl}
                    alt={accountDetail.accountName}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  avatarText
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {accountDetail.imageUrl ? "User image loaded" : "No image available"}
              </p>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Account ID
            </label>
            <input className={inputClassName} value={accountDetail.accountId} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Employee Code
            </label>
            <input
              className={inputClassName}
              value={accountDetail.employeeCode ?? "--"}
              readOnly
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Account Name
            </label>
            <input
              className={inputClassName}
              value={mode === "edit" ? accountName : accountDetail.accountName}
              onChange={(event) => setAccountName(event.target.value)}
              readOnly={mode !== "edit"}
            />
            {mode === "edit" && fieldErrors.accountName && (
              <p className="mt-1 text-sm text-error-600">{fieldErrors.accountName}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Role
            </label>
            <input className={inputClassName} value={accountDetail.roleName} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input className={inputClassName} value={accountDetail.email} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone Number
            </label>
            <input
              className={inputClassName}
              value={mode === "edit" ? phoneNumber : accountDetail.phoneNumber ?? "--"}
              onChange={(event) => setPhoneNumber(event.target.value)}
              readOnly={mode !== "edit"}
            />
            {mode === "edit" && fieldErrors.phoneNumber && (
              <p className="mt-1 text-sm text-error-600">{fieldErrors.phoneNumber}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Created At
            </label>
            <input
              className={inputClassName}
              value={formatDateTime(accountDetail.createdAt)}
              readOnly
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Updated At
            </label>
            <input
              className={inputClassName}
              value={formatDateTime(accountDetail.updatedAt)}
              readOnly
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            {mode === "edit" ? (
              <select
                className={inputClassName}
                value={statusValue}
                onChange={(event) =>
                  setStatusValue(event.target.value as "active" | "inactive")
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            ) : (
              <input
                className={inputClassName}
                value={accountDetail.isActive ? "Active" : "Inactive"}
                readOnly
              />
            )}
          </div>
          {mode === "edit" && (
            <>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className={`${inputClassName} pr-11`}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Leave empty to keep current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white/90"
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  >
                    {showNewPassword ? (
                      <EyeIcon className="fill-current" />
                    ) : (
                      <EyeCloseIcon className="fill-current" />
                    )}
                  </button>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    className={`${inputClassName} pr-11`}
                    value={confirmNewPassword}
                    onChange={(event) => setConfirmNewPassword(event.target.value)}
                    placeholder="Re-enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white/90"
                    aria-label={
                      showConfirmNewPassword
                        ? "Hide confirm new password"
                        : "Show confirm new password"
                    }
                  >
                    {showConfirmNewPassword ? (
                      <EyeIcon className="fill-current" />
                    ) : (
                      <EyeCloseIcon className="fill-current" />
                    )}
                  </button>
                </div>
              </div>
              {passwordError && (
                <div className="sm:col-span-2 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
                  {passwordError}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="mt-6 flex items-center justify-end gap-3">
        {mode === "edit" && (
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={
              isLoading ||
              !accountDetail ||
              isSavingInfo ||
              isSavingPassword
            }
          >
            {isSavingInfo || isSavingPassword ? "Saving..." : "Save"}
          </Button>
        )}
        <Button variant="primary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default AccountDetailModal;
