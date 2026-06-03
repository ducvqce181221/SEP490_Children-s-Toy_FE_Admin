"use client";

import React, { memo } from "react";
import Image from "next/image";
import { EyeIcon, LockIcon, PencilIcon } from "@/icons/index";
import Badge from "@/components/ui/badge/Badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { CustomerListItem } from "../types/customer";

interface CustomerRowProps {
  customer: CustomerListItem;
  rowNumber: number;
  onOpenDetail: (accountId: number) => void;
  onOpenEdit: (accountId: number) => void;
  onLockCustomer: (accountId: number) => void;
  isLocking: boolean;
}

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

const CustomerRowComponent: React.FC<CustomerRowProps> = ({
  customer,
  rowNumber,
  onOpenDetail,
  onOpenEdit,
  onLockCustomer,
  isLocking,
}) => {
  const avatarText =
    customer.accountName.length > 0 ? customer.accountName[0].toUpperCase() : "?";

  return (
    <TableRow>
      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {rowNumber}
      </TableCell>

      <TableCell className="px-5 py-4 text-start sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-sm font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            {customer.imageUrl ? (
              <Image
                src={customer.imageUrl}
                alt={customer.accountName}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              avatarText
            )}
          </div>
          <div>
            <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
              {customer.accountName}
            </p>
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              {customer.email}
            </p>
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              {customer.phoneNumber ?? "No phone number"}
            </p>
          </div>
        </div>
      </TableCell>

      <TableCell className="px-5 py-4 text-start">
        <Badge size="sm" color={customer.isActive ? "success" : "warning"}>
          {customer.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>

      <TableCell className="px-5 py-4 text-start">
        {customer.isSuspiciousDeliveryAbuse ? (
          <div className="space-y-1">
            <Badge size="sm" color="error">
              COD abuse risk
            </Badge>
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              {customer.suspiciousDeliveryFailOrderCount} failed COD orders
            </p>
            {customer.lastSuspiciousGHNFailCode && (
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                Last code: {customer.lastSuspiciousGHNFailCode}
              </p>
            )}
          </div>
        ) : (
          <span className="text-theme-sm text-gray-500 dark:text-gray-400">Clear</span>
        )}
      </TableCell>

      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {formatDateTime(customer.createdAt)}
      </TableCell>

      <TableCell className="px-5 py-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onOpenDetail(customer.accountId)}
            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
            aria-label={`View customer details for ${customer.accountName}`}
          >
            <EyeIcon />
          </button>
          <button
            type="button"
            onClick={() => onOpenEdit(customer.accountId)}
            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
            aria-label={`Edit customer ${customer.accountName}`}
          >
            <PencilIcon />
          </button>
          {customer.isActive && customer.isSuspiciousDeliveryAbuse && (
            <button
              type="button"
              onClick={() => onLockCustomer(customer.accountId)}
              disabled={isLocking}
              className="rounded-lg border border-error-300 p-2 text-error-500 transition-colors hover:border-error-500 hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-error-500/40 dark:hover:bg-error-500/10"
              aria-label={`Lock customer ${customer.accountName}`}
              title="Lock customer"
            >
              <LockIcon />
            </button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export const CustomerRow = memo(CustomerRowComponent);
