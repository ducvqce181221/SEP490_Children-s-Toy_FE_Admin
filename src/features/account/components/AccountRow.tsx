"use client";
import React, { memo, useRef } from "react";
import Image from "next/image";
import { TableCell, TableRow } from "../../../components/ui/table";
import Badge from "../../../components/ui/badge/Badge";
import { PencilIcon, TrashBinIcon } from "@/icons/index";
import { Popover } from "../../../components/ui/popover/Popover";
import Button from "../../../components/ui/button/Button";
import { Account } from "../types/account";

interface AccountRowProps {
  account: Account;
  isDeleting: boolean;
  onEdit: () => void;
  onDeleteClick: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
}

const AccountRowComponent: React.FC<AccountRowProps> = ({
  account,
  isDeleting,
  onEdit,
  onDeleteClick,
  onDeleteCancel,
  onDeleteConfirm,
}) => {
  // Ref trỏ đến delete button — Popover dùng để tính vị trí
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <TableRow>
      <TableCell className="px-5 py-3 sm:px-6 text-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-100">
            <Image
              width={40}
              height={40}
              src={account.user.image}
              alt={account.user.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {account.user.name}
            </span>
            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
              {account.user.email}
            </span>
          </div>
        </div>
      </TableCell>

      <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        {account.role}
      </TableCell>

      <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        <Badge
          size="sm"
          color={
            account.status === "Active"
              ? "success"
              : account.status === "Pending"
                ? "warning"
                : "error"
          }
        >
          {account.status}
        </Badge>
      </TableCell>

      <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        {account.joinDate}
      </TableCell>

      <TableCell className="px-5 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
        <div className="flex items-center justify-center gap-2">
          {/* Edit button */}
          <button
            onClick={onEdit}
            className="text-gray-500 p-2 rounded-lg border border-gray-300 hover:border-brand-400 hover:text-brand-500 transition-colors"
          >
            <PencilIcon className="w-5 h-5" />
          </button>

          {/* Delete button + Popover */}
          <button
            ref={deleteButtonRef}
            onClick={onDeleteClick}
            className="text-gray-500 p-2 rounded-lg border border-gray-300 hover:border-error-400 hover:text-error-500 transition-colors"
          >
            <TrashBinIcon className="w-5 h-5" />
          </button>

          <Popover
            isOpen={isDeleting}
            onClose={onDeleteCancel}
            triggerRef={deleteButtonRef}
            position="left"
            className="p-4 w-[280px]"
          >
            <div className="text-left">
              <h4 className="font-semibold text-gray-800 dark:text-white/90 mb-1">
                Delete Account
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 whitespace-normal">
                Are you sure you want to delete <b>{account.user.name}</b>?
              </p>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={onDeleteCancel}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-error-500 hover:bg-error-600 border-error-500"
                  onClick={onDeleteConfirm}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Popover>
        </div>
      </TableCell>
    </TableRow>
  );
};

export const AccountRow = memo(AccountRowComponent);