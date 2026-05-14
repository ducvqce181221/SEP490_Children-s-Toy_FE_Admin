"use client";

import React, { useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useWorkSchedules } from "@/features/schedule/hooks/useWorkSchedules";
import { useShifts } from "@/features/schedule/hooks/useShifts";
import WorkScheduleTable from "@/features/schedule/components/WorkScheduleTable";
import WorkScheduleForm from "@/features/schedule/components/WorkScheduleForm";
import { scheduleApi } from "@/features/schedule/services/schedule-api";
import { WorkSchedule } from "@/features/schedule/types/schedule";
import toast from "react-hot-toast";
import { ConfirmModal } from "@/components/ui/modal/ConfirmModal";
import StaffLoadChart from "@/features/schedule/components/StaffLoadChart";
import { CalenderIcon, PieChartIcon } from "@/icons";

type Tab = "schedule" | "overview";

export default function SchedulesPage() {
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [activeTab, setActiveTab] = useState<Tab>("schedule");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);

  const { schedules, isLoading, refetch, updateQuery } = useWorkSchedules({
    workDate: dateFilter,
  });
  const { shifts } = useShifts();

  const [markAbsentId, setMarkAbsentId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null);

  const handleDateChange = React.useCallback(
    ([date]: Date[]) => {
      if (date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const newDate = `${y}-${m}-${d}`;
        setDateFilter(newDate);
        updateQuery({ workDate: newDate });
      }
    },
    [updateQuery]
  );

  const handleTodayClick = () => {
    const today = new Date().toISOString().split("T")[0];
    setDateFilter(today);
    updateQuery({ workDate: today });
    refetch();
  };

  const handleMarkAbsent = async () => {
    if (!markAbsentId) return;
    try {
      await scheduleApi.markAbsentWorkSchedule(markAbsentId);
      toast.success("Staff marked as absent");
      refetch();
    } catch {
      toast.error("Failed to mark staff as absent");
    } finally {
      setMarkAbsentId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await scheduleApi.deleteWorkSchedule(deleteId);
      toast.success("Assignment removed successfully");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete assignment");
    } finally {
      setDeleteId(null);
    }
  };

  const handleEditClick = (schedule: WorkSchedule) => {
    setEditingSchedule(schedule);
    setViewMode("edit");
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "schedule",
      label: "Daily Schedule",
      icon: <CalenderIcon className="w-4.6 h-4.6" />,
    },
    {
      id: "overview",
      label: "Load Overview",
      icon: <PieChartIcon className="w-4.6 h-4.6" />,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      {viewMode === "list" ? (
        <>
          <PageBreadcrumb pageTitle="Work Schedules" />

          {/* ── Tab bar ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm w-fit dark:border-white/[0.07] dark:bg-white/[0.03]">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/[0.05]"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.id === "overview" && schedules.length > 0 && (
                    <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                      isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {schedules.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Tab content ─────────────────────────────────────────── */}
          {activeTab === "schedule" && (
            <WorkScheduleTable
              schedules={schedules}
              isLoading={isLoading}
              onMarkAbsent={setMarkAbsentId}
              onEdit={handleEditClick}
              onDelete={setDeleteId}
              dateFilter={dateFilter}
              onDateChange={handleDateChange}
              onTodayClick={handleTodayClick}
              onAssignClick={() => {
                setEditingSchedule(null);
                setViewMode("create");
              }}
            />
          )}

          {activeTab === "overview" && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
              {/* Overview header */}
              <div className="px-6 py-5 border-b border-gray-100 dark:border-white/[0.05]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Staff Load Overview
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      Workload distribution across all assigned staff for the selected date.
                    </p>
                  </div>
                  {/* Summary stats */}
                  <div className="hidden sm:flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-black text-gray-900 dark:text-white">
                        {schedules.length}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Assigned
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-brand-500">
                        {schedules.reduce((s, x) => s + x.currentLoad, 0)}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Total Orders
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-gray-900 dark:text-white">
                        {schedules.reduce((s, x) => s + x.maxLoad, 0)}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Max Capacity
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {!isLoading && schedules.length > 0 ? (
                  <StaffLoadChart
                    data={schedules.map((s) => ({
                      staffName: s.accountName,
                      load: s.currentLoad,
                      max: s.maxLoad,
                    }))}
                  />
                ) : isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    <span className="text-sm text-gray-500">Loading data...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800 mb-4">
                      <PieChartIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-base font-bold text-gray-700 dark:text-gray-300">No data to display</p>
                    <p className="text-sm text-gray-500 mt-1">Assign staff to shifts to see the workload chart.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <PageBreadcrumb pageTitle={viewMode === "edit" ? "Edit Assignment" : "Assign New Shift"} />
          <WorkScheduleForm
            shifts={shifts}
            initialDate={dateFilter}
            editData={editingSchedule}
            onBack={() => setViewMode("list")}
            onSubmitted={() => {
              setViewMode("list");
              refetch();
            }}
          />
        </>
      )}

      {/* Mark Absent Modal */}
      <ConfirmModal
        isOpen={!!markAbsentId}
        onClose={() => setMarkAbsentId(null)}
        onConfirm={handleMarkAbsent}
        title="Mark Staff as Absent"
        message="Are you sure you want to mark this staff as absent for this shift? Their assigned orders may need to be reassigned."
        isDestructive
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove Assignment"
        message="Are you sure you want to completely remove this assignment? This will delete the record from the schedule."
        isDestructive
      />
    </div>
  );
}
