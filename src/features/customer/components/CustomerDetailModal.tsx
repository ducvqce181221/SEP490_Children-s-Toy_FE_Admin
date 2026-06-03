"use client";

import { AxiosError } from "axios";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { customerApi } from "../services/customer-api";
import { ApiErrorResponse, CustomerDetail } from "../types/customer";

interface CustomerDetailModalProps {
  customerId: number | null;
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

const formatDateOnly = (dateValue: string | null) => {
  if (!dateValue) {
    return "--";
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-GB", { dateStyle: "short" }).format(parsedDate);
};

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customerId,
  isOpen,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);

  useEffect(() => {
    if (!isOpen || !customerId) {
      return;
    }

    let isCancelled = false;

    const fetchCustomerDetail = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await customerApi.getCustomerById(customerId);
        if (!isCancelled) {
          setCustomerDetail(response);
        }
      } catch (error) {
        if (!isCancelled) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
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

    fetchCustomerDetail();

    return () => {
      isCancelled = true;
    };
  }, [customerId, isOpen]);

  const avatarText =
    customerDetail?.accountName && customerDetail.accountName.length > 0
      ? customerDetail.accountName[0].toUpperCase()
      : "?";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[760px] p-5 lg:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          Customer Detail
        </h2>
      </div>

      {isLoading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading customer details...
        </p>
      )}

      {!isLoading && error && (
        <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
          {error}
        </p>
      )}

      {!isLoading && !error && customerDetail && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Profile Image
            </label>
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-base font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                {customerDetail.imageUrl ? (
                  <Image
                    src={customerDetail.imageUrl}
                    alt={customerDetail.accountName}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  avatarText
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {customerDetail.imageUrl ? "Customer image loaded" : "No image available"}
              </p>
            </div>
          </div>

          {customerDetail.isSuspiciousDeliveryAbuse && (
            <div className="sm:col-span-2 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
              <p className="font-semibold">COD delivery abuse risk detected</p>
              <p className="mt-1">
                {customerDetail.suspiciousDeliveryFailOrderCount} unpaid COD orders reached 3 GHN delivery failures.
                {customerDetail.lastSuspiciousGHNFailCode
                  ? ` Last GHN code: ${customerDetail.lastSuspiciousGHNFailCode}.`
                  : ""}
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Account ID
            </label>
            <input className={inputClassName} value={customerDetail.accountId} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Role
            </label>
            <input className={inputClassName} value={customerDetail.roleName} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Customer Name
            </label>
            <input className={inputClassName} value={customerDetail.accountName} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input className={inputClassName} value={customerDetail.email} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone Number
            </label>
            <input className={inputClassName} value={customerDetail.phoneNumber ?? "--"} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              DOB
            </label>
            <input className={inputClassName} value={formatDateOnly(customerDetail.dob)} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sex
            </label>
            <input className={inputClassName} value={customerDetail.sexName ?? "--"} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <input
              className={inputClassName}
              value={customerDetail.isActive ? "Active" : "Inactive"}
              readOnly
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Created At
            </label>
            <input
              className={inputClassName}
              value={formatDateTime(customerDetail.createdAt)}
              readOnly
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Updated At
            </label>
            <input
              className={inputClassName}
              value={formatDateTime(customerDetail.updatedAt)}
              readOnly
            />
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-end">
        <Button variant="primary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default CustomerDetailModal;
