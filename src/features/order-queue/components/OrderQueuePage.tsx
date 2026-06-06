"use client";

import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";
import { scheduleApi } from "@/features/schedule/services/schedule-api";
import { WorkSchedule } from "@/features/schedule/types/schedule";
import { todayVnDateString } from "@/utils/date-utils";
import { orderQueueApi, OrderQueueItem } from "../services/order-queue-api";

// ─── Human-readable labels for queue skip reasons ───────────────────────────
const QUEUE_REASON_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  NO_STAFF_ON_DUTY:  { label: "No staff on duty today",       color: "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-300",    icon: "👤" },
  ALL_STAFF_FULL:    { label: "All staff at full capacity",   color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", icon: "🔒" },
  NO_MERCH_ON_DUTY:  { label: "No merchandise on duty today", color: "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-300",    icon: "📦" },
  ALL_MERCH_FULL:    { label: "All merchandise staff full",   color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", icon: "🔒" },
  BOTH_FULL:         { label: "No available shift to assign", color: "bg-gray-100   text-gray-600   dark:bg-gray-800      dark:text-gray-400",    icon: "⏳" },
};

function ReasonBadge({ reason }: { reason: string }) {
  const meta = QUEUE_REASON_LABELS[reason];
  if (!meta) {
    return <span className="text-xs text-gray-500">{reason}</span>;
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${meta.color}`}>
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  );
}

export default function OrderQueuePage() {
  const [items, setItems] = useState<OrderQueueItem[]>([]);
  const [staffSchedules, setStaffSchedules] = useState<WorkSchedule[]>([]);
  const [merchSchedules, setMerchSchedules] = useState<WorkSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [selection, setSelection] = useState<Record<number, { staff: number; merch: number }>>({});

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = todayVnDateString();
      const [queue, staff, merch] = await Promise.all([
        orderQueueApi.getQueue(),
        scheduleApi.getWorkSchedules({ workDate: today, status: "OnDuty", roleId: 3 }),
        scheduleApi.getWorkSchedules({ workDate: today, status: "OnDuty", roleId: 4 }),
      ]);
      setItems(queue);
      setStaffSchedules(staff);
      setMerchSchedules(merch);
    } catch {
      toast.error("Could not load order queue");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAssign = async (queueId: number) => {
    const picked = selection[queueId];
    if (!picked?.staff || !picked?.merch) {
      toast.error("Select both Staff and Merchandise schedules");
      return;
    }

    setAssigningId(queueId);
    try {
      await orderQueueApi.assignQueue(queueId, {
        staffScheduleId: picked.staff,
        merchScheduleId: picked.merch,
      });
      toast.success("Order assigned from queue");
      await load();
    } catch {
      toast.error("Assign failed");
    } finally {
      setAssigningId(null);
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-gray-500">Loading queue...</div>;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Order Queue</h2>
        <Button variant="outline" onClick={() => void load()}>Refresh</Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No pending queue entries.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left dark:border-gray-700">
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2">Queued</th>
                <th className="px-3 py-2">Staff schedule</th>
                <th className="px-3 py-2">Merch schedule</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.queueId} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-3 py-3 font-medium">#{item.orderCode}</td>
                  <td className="px-3 py-3"><ReasonBadge reason={item.reason} /></td>
                  <td className="px-3 py-3">{new Date(item.queuedAt).toLocaleString("vi-VN")}</td>
                  <td className="px-3 py-3">
                    <select
                      className="h-10 w-full min-w-[180px] rounded-lg border border-gray-300 px-2 dark:border-gray-700 dark:bg-gray-900"
                      value={selection[item.queueId]?.staff ?? 0}
                      onChange={(e) =>
                        setSelection((prev) => ({
                          ...prev,
                          [item.queueId]: {
                            staff: Number(e.target.value),
                            merch: prev[item.queueId]?.merch ?? 0,
                          },
                        }))
                      }
                    >
                      <option value={0}>Select staff</option>
                      {staffSchedules.map((s) => (
                        <option key={s.scheduleId} value={s.scheduleId}>
                          {s.accountName} ({s.currentLoad}/{s.maxLoad})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      className="h-10 w-full min-w-[180px] rounded-lg border border-gray-300 px-2 dark:border-gray-700 dark:bg-gray-900"
                      value={selection[item.queueId]?.merch ?? 0}
                      onChange={(e) =>
                        setSelection((prev) => ({
                          ...prev,
                          [item.queueId]: {
                            staff: prev[item.queueId]?.staff ?? 0,
                            merch: Number(e.target.value),
                          },
                        }))
                      }
                    >
                      <option value={0}>Select merch</option>
                      {merchSchedules.map((s) => (
                        <option key={s.scheduleId} value={s.scheduleId}>
                          {s.accountName} ({s.currentLoad}/{s.maxLoad})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <Button
                      variant="primary"
                      disabled={assigningId === item.queueId}
                      onClick={() => void handleAssign(item.queueId)}
                    >
                      {assigningId === item.queueId ? "Assigning..." : "Assign"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
