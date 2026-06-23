"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import { AdminWithdrawalDetail, WithdrawalStatus } from "../types/withdrawal";
import { formatCurrency } from "@/utils/format-utils";
import { formatDisplayDate } from "@/utils/date-utils";

interface WithdrawalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: AdminWithdrawalDetail | null;
  isLoading: boolean;
  error: string | null;
}

const WithdrawalDetailModal: React.FC<WithdrawalDetailModalProps> = ({
  isOpen,
  onClose,
  detail,
  isLoading,
  error,
}) => {
  if (!isOpen) return null;

  const renderStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge color="warning" variant="light">PENDING</Badge>;
      case "PROCESSING":
        return <Badge color="info" variant="light">PROCESSING</Badge>;
      case "SUCCESS":
        return <Badge color="success" variant="light">SUCCESS</Badge>;
      case "FAILED":
        return <Badge color="error" variant="light">FAILED</Badge>;
      case "CANCELLED":
        return <Badge color="light" variant="light">CANCELLED</Badge>;
      default:
        return <Badge color="primary" variant="light">{status}</Badge>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-h-[90vh] w-full max-w-3xl overflow-hidden p-0"
    >
      <div className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-white/[0.05] dark:bg-gray-900 flex items-center justify-between shrink-0 z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Withdrawal Request Details
            </h2>
            {detail && (
              <p className="mt-0.5 text-xs font-mono text-gray-500 dark:text-gray-400">
                Ref ID: {detail.referenceId}
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-grow overflow-y-auto p-6 bg-white dark:bg-gray-900">
          {isLoading && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
              <div className="size-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading withdrawal details...
              </p>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex min-h-[300px] flex-col items-center justify-center p-6 text-center">
              <p className="text-sm text-error-600 font-medium">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-gray-100 px-4 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Go Back
              </button>
            </div>
          )}

          {!isLoading && !error && !detail && (
            <div className="flex min-h-[300px] items-center justify-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Withdrawal details not found.
              </p>
            </div>
          )}

          {!isLoading && !error && detail && (
            <div className="space-y-6">
              {/* Amount & Status Banner */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50/60 p-5 dark:border-gray-800 dark:bg-white/[0.02]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Withdrawal Amount
                  </p>
                  <p className="mt-1 text-2xl font-black text-brand-500">
                    {formatCurrency(detail.amount)}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-start sm:items-end">
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Status</span>
                  <div>{renderStatusBadge(detail.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Details */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    Customer Information
                  </h3>
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800 space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Name</span>
                      <span className="font-medium text-gray-800 dark:text-white/90">{detail.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Email</span>
                      <span className="font-medium text-gray-800 dark:text-white/90 break-all">{detail.customerEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Phone</span>
                      <span className="font-medium text-gray-800 dark:text-white/90">{detail.customerPhone ?? "--"}</span>
                    </div>
                  </div>
                </div>

                {/* Beneficiary Bank Details */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    Beneficiary Account
                  </h3>
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800 space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Bank Name</span>
                      <span className="font-medium text-gray-800 dark:text-white/90 text-right">{detail.toBankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Account Number</span>
                      <span className="font-mono font-medium text-gray-800 dark:text-white/90">{detail.toAccountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Account Name</span>
                      <span className="font-medium text-gray-800 dark:text-white/90">{detail.toAccountName}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction audit logs / meta */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                  Transaction Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800 text-sm">
                  <div className="space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Created At</span>
                      <span className="font-medium text-gray-800 dark:text-white/90">{formatDisplayDate(detail.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Processing At</span>
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {detail.processingAt ? formatDisplayDate(detail.processingAt) : "--"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Finished At</span>
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {detail.completedAt ? formatDisplayDate(detail.completedAt) :
                          detail.cancelledAt ? formatDisplayDate(detail.cancelledAt) : "--"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2.5 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-800 pt-2.5 sm:pt-0 sm:pl-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">PayOS Payout ID</span>
                      <span className="font-mono font-medium text-gray-800 dark:text-white/90 break-all max-w-[150px] text-right">
                        {detail.payosPayoutId ?? "--"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">PayOS Trans ID</span>
                      <span className="font-mono font-medium text-gray-800 dark:text-white/90 break-all max-w-[150px] text-right">
                        {detail.payosTransactionId ?? "--"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Retry Count</span>
                      <span className="font-medium text-gray-800 dark:text-white/90">{detail.retryCount}</span>
                    </div>
                  </div>
                </div>

                {detail.failReason && (
                  <div className="rounded-xl border border-error-100 bg-error-50/50 p-4 dark:border-error-500/20 dark:bg-error-500/5 text-sm">
                    <span className="font-semibold text-error-800 dark:text-error-400 block mb-1">Failure Reason:</span>
                    <p className="text-error-700 dark:text-error-300 font-medium">{detail.failReason}</p>
                  </div>
                )}
              </div>

              {/* Audit History Timeline */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                  Status Transition Timeline
                </h3>

                {detail.statusHistory && detail.statusHistory.length > 0 ? (
                  <div className="flow-root pl-2">
                    <ul className="-mb-8">
                      {detail.statusHistory.map((step, stepIdx) => (
                        <li key={step.historyId}>
                          <div className="relative pb-8">
                            {stepIdx !== detail.statusHistory.length - 1 ? (
                              <span
                                className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-800"
                                aria-hidden="true"
                              />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white dark:ring-gray-900 text-xs font-semibold ${step.toStatus === "SUCCESS" ? "bg-success-100 text-success-800 dark:bg-success-500/20 dark:text-success-400" :
                                    step.toStatus === "FAILED" ? "bg-error-100 text-error-800 dark:bg-error-500/20 dark:text-error-400" :
                                      step.toStatus === "CANCELLED" ? "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/70" :
                                        step.toStatus === "PROCESSING" ? "bg-blue-light-100 text-blue-light-800 dark:bg-blue-light-500/20 dark:text-blue-light-400" :
                                          "bg-warning-100 text-warning-800 dark:bg-warning-500/20 dark:text-warning-400"
                                  }`}>
                                  {stepIdx + 1}
                                </span>
                              </div>
                              <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                <div>
                                  <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                                    State changed to <span className="underline font-bold text-gray-900 dark:text-white">{step.toStatus}</span>
                                  </p>
                                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                    Source: <span className="font-mono bg-gray-100 dark:bg-white/5 px-1 py-0.5 rounded text-gray-700 dark:text-gray-300">{step.source}</span>
                                    {step.fromStatus && (
                                      <> (from <span className="font-semibold">{step.fromStatus}</span>)</>
                                    )}
                                  </p>
                                  {step.note && (
                                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.01] p-2.5 rounded-lg border border-gray-100 dark:border-gray-800/50 italic">
                                      &quot;{step.note}&quot;
                                    </p>
                                  )}
                                </div>
                                <div className="whitespace-nowrap text-right text-xs text-gray-500 dark:text-gray-400">
                                  <time>{formatDisplayDate(step.createdAt)}</time>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">No transition history recorded.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-200 bg-white px-6 py-4 dark:border-white/[0.05] dark:bg-gray-900 shrink-0 z-10">
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 px-5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default WithdrawalDetailModal;
