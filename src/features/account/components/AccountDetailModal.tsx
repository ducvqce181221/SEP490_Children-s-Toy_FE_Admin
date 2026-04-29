"use client";

import { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { accountApi } from "../services/account-api";
import { AccountDetail, ApiErrorResponse } from "../types/account";

interface AccountDetailModalProps {
  accountId: number | null;
  isOpen: boolean;
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
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountDetail, setAccountDetail] = useState<AccountDetail | null>(null);

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[760px] p-5 lg:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          Account Detail
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
            <input className={inputClassName} value={accountDetail.accountName} readOnly />
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
              value={accountDetail.phoneNumber ?? "--"}
              readOnly
            />
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
            <input
              className={inputClassName}
              value={accountDetail.isActive ? "Active" : "Inactive"}
              readOnly
            />
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-end gap-3">
        <Button variant="primary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default AccountDetailModal;
