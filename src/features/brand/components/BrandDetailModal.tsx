"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { BrandListItem } from "../types/brand";

interface BrandDetailModalProps {
  isOpen: boolean;
  brand: BrandListItem | null;
  onClose: () => void;
}

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const statusClassNameByValue: Record<BrandListItem["status"], string> = {
  Active:
    "border border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-300",
  Inactive:
    "border border-error-200 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300",
};

const BrandDetailModal: React.FC<BrandDetailModalProps> = ({ isOpen, brand, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-0">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4 dark:border-white/[0.05] dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Brand Details</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Overview of selected brand information.</p>
      </div>

      <div className="p-6">
        {brand ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Brand Name</p>
              <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{brand.brandName}</p>
            </div>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">ID</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{brand.brandId}</dd>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClassNameByValue[brand.status]}`}>
                    {brand.status}
                  </span>
                </dd>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Created At</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{formatDateTime(brand.createdAt)}</dd>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Last Updated</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{formatDateTime(brand.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-gray-500">Brand not found</p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 flex justify-end border-t border-gray-200 bg-white px-6 py-4 dark:border-white/[0.05] dark:bg-gray-900">
        <button
          onClick={onClose}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default BrandDetailModal;
