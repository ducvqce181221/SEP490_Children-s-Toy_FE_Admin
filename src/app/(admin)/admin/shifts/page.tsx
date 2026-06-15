"use client";

import React, { useState } from "react";
import { AxiosError } from "axios";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useShifts } from "@/features/schedule/hooks/useShifts";
import ShiftTable from "@/features/schedule/components/ShiftTable";
import ShiftFormModal from "@/features/schedule/components/ShiftFormModal";
import { scheduleApi } from "@/features/schedule/services/schedule-api";
import toast from "react-hot-toast";
import { ShiftTemplate, ShiftTemplateFormData } from "@/features/schedule/types/shift";
import { buildCreatePayload, buildUpdatePayload } from "@/features/schedule/utils/shift-payload";
import { ConfirmModal } from "@/components/ui/modal/ConfirmModal";
import { useAuthContext } from "@/context/AuthContext";

function getApiErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as {
      message?: string;
      errorMessage?: string;
      errors?: Record<string, string[]>;
    } | undefined;
    if (data?.errors) {
      const first = Object.values(data.errors).flat().find(Boolean);
      if (first) return first;
    }
    const raw = data?.errorMessage ?? data?.message ?? "";
    if (raw.includes("overlaps")) return "Shift time overlaps with another active shift template.";
    if (raw.includes("Scheduled or On Duty")) return "Cannot modify shift while work schedules are Scheduled or On Duty.";
    if (raw.includes("already exists")) return "Shift name already exists.";
    if (raw.includes("End time must be later")) return "End time must be later than start time.";
    if (raw) return raw;
    return "Operation failed";
  }
  return "Operation failed";
}

export default function ShiftsPage() {
  const { account } = useAuthContext();
  const isAdmin = account?.roleName === "Admin";

  const { shifts, isLoading, refetch } = useShifts({ includeInactive: true });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<ShiftTemplate | null>(null);

  const handleOpenCreate = () => {
    setEditingShift(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (shift: ShiftTemplate) => {
    setEditingShift(shift);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: ShiftTemplateFormData) => {
    setIsSubmitting(true);
    try {
      if (editingShift) {
        const timeLocked = (editingShift.activeScheduleCount ?? 0) > 0;
        const payload = buildUpdatePayload(data, editingShift, { timeLocked });

        if (!payload) {
          toast("No changes to save.");
          setIsModalOpen(false);
          return;
        }

        await scheduleApi.updateShiftTemplate(editingShift.shiftTemplateId, payload);
        toast.success("Shift updated successfully");
      } else {
        await scheduleApi.createShiftTemplate(buildCreatePayload(data));
        toast.success("Shift created successfully");
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await scheduleApi.deactivateShiftTemplate(deactivateTarget.shiftTemplateId);
      toast.success("Shift deactivated successfully");
      refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeactivateTarget(null);
    }
  };

  const handleReactivate = async (shift: ShiftTemplate) => {
    try {
      await scheduleApi.updateShiftTemplate(shift.shiftTemplateId, { isActive: true });
      toast.success("Shift reactivated successfully");
      refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const deactivateMessage = deactivateTarget?.activeScheduleCount
    ? `This template has ${deactivateTarget.activeScheduleCount} active work schedule(s). Deactivation is blocked until those shifts are completed or cancelled.`
    : "Are you sure you want to deactivate this shift template? It will no longer be available for new assignments.";

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageBreadcrumb pageTitle="Shift Management" />

      <ShiftTable
        shifts={shifts}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onDeactivate={(shift) => setDeactivateTarget(shift)}
        onReactivate={handleReactivate}
        onAddClick={handleOpenCreate}
        isAdmin={isAdmin}
      />

      <ShiftFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingShift}
        isSubmitting={isSubmitting}
      />

      <ConfirmModal
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={
          deactivateTarget?.activeScheduleCount
            ? () => setDeactivateTarget(null)
            : handleDeactivate
        }
        title="Deactivate Shift Template"
        message={deactivateMessage}
        isDestructive={!deactivateTarget?.activeScheduleCount}
        confirmText={deactivateTarget?.activeScheduleCount ? "OK" : "Deactivate"}
        cancelText={deactivateTarget?.activeScheduleCount ? "Close" : "Cancel"}
      />
    </div>
  );
}
