"use client";

import React, { memo } from "react";
import Image from "next/image";
import { EyeIcon, PencilIcon } from "@/icons/index";
import Badge from "@/components/ui/badge/Badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { AccountListItem } from "../types/account";

interface AccountRowProps {
  account: AccountListItem;
  rowNumber: number;
  onOpenDetail: (accountId: number) => void;
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

const AccountRowComponent: React.FC<AccountRowProps> = ({
  account,
  rowNumber,
  onOpenDetail,
}) => {
  const avatarText =
    account.accountName.length > 0 ? account.accountName[0].toUpperCase() : "?";

  return (
    <TableRow>
      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {rowNumber}
      </TableCell>

      <TableCell className="px-5 py-4 text-start sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-sm font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            {account.imageUrl ? (
              <Image
                src={account.imageUrl}
                alt={account.accountName}
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
              {account.accountName}
            </p>
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              {account.email}
            </p>
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              {account.phoneNumber ?? "No phone number"}
            </p>
          </div>
        </div>
      </TableCell>

      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {account.roleName}
      </TableCell>

      <TableCell className="px-5 py-4 text-start">
        <Badge size="sm" color={account.isActive ? "success" : "warning"}>
          {account.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>

      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {formatDateTime(account.createdAt)}
      </TableCell>

      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {formatDateTime(account.updatedAt)}
      </TableCell>

      <TableCell className="px-5 py-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onOpenDetail(account.accountId)}
            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
            aria-label={`View account details for ${account.accountName}`}
          >
            <EyeIcon />
          </button>
          <button
            type="button"
            onClick={() => onOpenDetail(account.accountId)}
            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
            aria-label={`Edit account ${account.accountName}`}
          >
            <PencilIcon />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export const AccountRow = memo(AccountRowComponent);
