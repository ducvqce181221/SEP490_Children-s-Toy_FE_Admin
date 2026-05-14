"use client";

import React, { useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useShifts } from "@/features/schedule/hooks/useShifts";
import ShiftTable from "@/features/schedule/components/ShiftTable";
import ShiftFormModal from "@/features/schedule/components/ShiftFormModal";
import Button from "@/components/ui/button/Button";
import { PlusIcon, CalenderIcon } from "@/icons";
import { scheduleApi } from "@/features/schedule/services/schedule-api";
import toast from "react-hot-toast";
import { ShiftTemplate, ShiftTemplateFormData } from "@/features/schedule/types/shift";
import { ConfirmModal } from "@/components/ui/modal/ConfirmModal";

export default function ShiftsPage() {
  const { shifts, isLoading, refetch } = useShifts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Backend has no DELETE for shift-templates — deactivate via PUT instead
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
        await scheduleApi.updateShiftTemplate(editingShift.shiftTemplateId, data);
        toast.success("Shift updated successfully");
      } else {
        await scheduleApi.createShiftTemplate(data);
        toast.success("Shift created successfully");
      }
      setIsModalOpen(false);
      refetch();
    } catch {
      toast.error("Failed to save shift");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Deactivate = PUT with isActive: false (no DELETE endpoint in backend)
  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await scheduleApi.deactivateShiftTemplate(deactivateTarget.shiftTemplateId, {
        shiftName: deactivateTarget.shiftName,
        startTime: deactivateTarget.startTime,
        endTime: deactivateTarget.endTime,
        maxOrdersPerShift: deactivateTarget.maxOrdersPerShift,
        isActive: false,
      });
      toast.success("Shift deactivated successfully");
      refetch();
    } catch {
      toast.error("Failed to deactivate shift");
    } finally {
      setDeactivateTarget(null);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageBreadcrumb pageTitle="Shift Management" />

      <ShiftTable
        shifts={shifts}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onDeactivate={(shift) => setDeactivateTarget(shift)}
        onAddClick={handleOpenCreate}
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
        onConfirm={handleDeactivate}
        title="Deactivate Shift Template"
        message="Are you sure you want to deactivate this shift template? It will no longer be available for new assignments."
        isDestructive
      />
    </div>
  );
}
