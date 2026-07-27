import React, { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { ShiftTemplate } from "../types/shift";
import { UpdateWorkScheduleResult, WorkSchedule } from "../types/schedule";
import Button from "@/components/ui/button/Button";
import { accountApi } from "@/features/account/services/account-api";
import { AccountListItem } from "@/features/account/types/account";
import { scheduleApi } from "../services/schedule-api";
import toast from "react-hot-toast";
import StaffPicker from "./StaffPicker";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/date-picker";
import { CalenderIcon, TimeIcon, ChevronLeftIcon, UserCircleIcon } from "@/icons";

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
    return data?.message ?? data?.errorMessage ?? "Operation failed";
  }
  return "Operation failed";
}

function buildEditFormState(edit: WorkSchedule) {
  return {
    shiftId: edit.shiftTemplateId,
    date: edit.workDate.split("T")[0],
    staffId: edit.roleId === 3 ? edit.accountId : 0,
    merchId: edit.roleId === 4 ? edit.accountId : 0,
    maxLoadOverride: edit.maxLoad,
  };
}

interface WorkScheduleFormProps {
  onBack: () => void;
  onSubmitted: () => void;
  shifts: ShiftTemplate[];
  initialDate: string;
  editData?: WorkSchedule | null;
  /** Schedules for the current list date ?" used to skip already-assigned staff. */
  existingSchedules?: WorkSchedule[];
}

const inputClassName =
  "h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition-all focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const WorkScheduleForm: React.FC<WorkScheduleFormProps> = ({
  onBack,
  onSubmitted,
  shifts,
  initialDate,
  editData = null,
  existingSchedules = [],
}) => {
  const isEdit = !!editData;

  const [staffList, setStaffList] = useState<AccountListItem[]>([]);
  const [merchList, setMerchList] = useState<AccountListItem[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  const editInitial = editData ? buildEditFormState(editData) : null;

  const [selectedStaffId, setSelectedStaffId] = useState(editInitial?.staffId ?? 0);
  const [selectedMerchId, setSelectedMerchId] = useState(editInitial?.merchId ?? 0);
  const [selectedShiftId, setSelectedShiftId] = useState(editInitial?.shiftId ?? 0);
  const [selectedDate, setSelectedDate] = useState(editInitial?.date ?? initialDate);
  const [maxLoadOverride, setMaxLoadOverride] = useState<number | string>(
    editInitial?.maxLoadOverride ?? ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferResult, setTransferResult] = useState<UpdateWorkScheduleResult | null>(null);
  const [showTransferredList, setShowTransferredList] = useState(false);
  const [syncedEditScheduleId, setSyncedEditScheduleId] = useState<number | null>(
    editData?.scheduleId ?? null
  );

  if (editData && editData.scheduleId !== syncedEditScheduleId) {
    const next = buildEditFormState(editData);
    setSyncedEditScheduleId(editData.scheduleId);
    setSelectedShiftId(next.shiftId);
    setSelectedDate(next.date);
    setSelectedStaffId(next.staffId);
    setSelectedMerchId(next.merchId);
    setMaxLoadOverride(next.maxLoadOverride ?? "");
    setTransferResult(null);
    setShowTransferredList(false);
  }

  const [errors, setErrors] = useState<{
    staffId?: string;
    merchId?: string;
    shiftId?: string;
    date?: string;
    general?: string;
  }>({});

  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoadingAccounts(true);
      try {
        const [staffRes, merchRes] = await Promise.all([
          accountApi.getAccounts({ pageNumber: 1, pageSize: 100, roleId: 3 }),
          accountApi.getAccounts({ pageNumber: 1, pageSize: 100, roleId: 4 }),
        ]);
        setStaffList(staffRes.items);
        setMerchList(merchRes.items);
      } catch {
        toast.error("Failed to load accounts");
      } finally {
        setIsLoadingAccounts(false);
      }
    };
    fetchAccounts();
  }, []);

  // When date or shift changes in Create mode, reset pickers to avoid stale selections
  const prevShiftRef = React.useRef(selectedShiftId);
  const prevDateRef = React.useRef(selectedDate);
  useEffect(() => {
    if (!isEdit) {
      if (prevShiftRef.current !== selectedShiftId || prevDateRef.current !== selectedDate) {
        setSelectedStaffId(0);
        setSelectedMerchId(0);
        setErrors({});
      }
    }
    prevShiftRef.current = selectedShiftId;
    prevDateRef.current = selectedDate;
  }, [selectedShiftId, selectedDate, isEdit]);

  /**
   * People who are actively scheduled on the selected shift/date.
   * Used to (a) display a "Currently Assigned" badge and (b) filter pickers.
   */
  const assignedOnShift = useMemo(() => {
    if (!selectedShiftId || !selectedDate || isEdit) return [];
    const dateKey = selectedDate.split("T")[0];
    return existingSchedules.filter(
      (s) =>
        s.shiftTemplateId === selectedShiftId &&
        s.workDate.split("T")[0] === dateKey &&
        s.status !== "Absent" &&
        s.status !== "Cancelled"
    );
  }, [existingSchedules, selectedShiftId, selectedDate, isEdit]);

  const assignedStaffIds = useMemo(() => new Set(assignedOnShift.filter((s) => s.roleId === 3).map((s) => s.accountId)), [assignedOnShift]);
  const assignedMerchIds = useMemo(() => new Set(assignedOnShift.filter((s) => s.roleId === 4).map((s) => s.accountId)), [assignedOnShift]);

  // Available staff = full list minus those already assigned on this shift/date
  const availableStaff = useMemo(
    () => staffList.filter((a) => !assignedStaffIds.has(a.accountId)),
    [staffList, assignedStaffIds]
  );
  const availableMerch = useMemo(
    () => merchList.filter((a) => !assignedMerchIds.has(a.accountId)),
    [merchList, assignedMerchIds]
  );

  const validate = () => {
    const newErrors: typeof errors = {};

    if (isEdit) {
      if (editData?.roleId === 3 && !selectedStaffId) newErrors.staffId = "Please select a Staff member";
      if (editData?.roleId === 4 && !selectedMerchId) newErrors.merchId = "Please select a Merchandiser";
    } else {
      if (!selectedStaffId && !selectedMerchId) {
        newErrors.general = "Please select at least one Staff or Merchandiser to assign.";
      }
    }

    if (!selectedShiftId) {
      newErrors.shiftId = "Please select a shift";
    } else if (selectedShiftId && selectedDate) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      const todayStr = `${y}-${m}-${d}`;

      if (selectedDate === todayStr) {
        const shift = shifts.find((s) => s.shiftTemplateId === selectedShiftId);
        if (shift) {
          const [eh, em] = shift.endTime.split(":").map(Number);
          const nowMins = now.getHours() * 60 + now.getMinutes();
          const shiftEndMins = eh * 60 + em;
          if (shiftEndMins <= nowMins) {
            newErrors.shiftId = "This shift has already ended today.";
          }
        }
      }
    }

    if (!selectedDate) newErrors.date = "Please select a work date";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTransferResult(null);
    setShowTransferredList(false);

    try {
      if (isEdit && editData) {
        const accountId = editData.roleId === 3 ? selectedStaffId : selectedMerchId;
        const accountChanged = accountId !== editData.accountId;

        const result = await scheduleApi.updateWorkSchedule(editData.scheduleId, {
          accountId,
          shiftTemplateId: selectedShiftId,
          workDate: selectedDate,
          maxLoadOverride: maxLoadOverride ? Number(maxLoadOverride) : undefined,
        });

        const oldName =
          editData.accountName ||
          result.transferredOrders[0]?.oldAccountId?.toString() ||
          String(editData.accountId);
        const newName =
          (editData.roleId === 3
            ? staffList.find((a) => a.accountId === accountId)?.accountName
            : merchList.find((a) => a.accountId === accountId)?.accountName) ??
          String(accountId);

        if (accountChanged && result.transferredCount > 0) {
          setTransferResult(result);
          toast.success(`Transferred ${result.transferredCount} order(s) (${oldName} → ${newName})`);
        } else if (accountChanged) {
          toast.success(`Staff updated (${oldName} → ${newName}). No orders to transfer.`);
          onSubmitted();
        } else {
          toast.success("Assignment updated successfully!");
          onSubmitted();
        }
      } else {
        const payload = {
          shiftTemplateId: selectedShiftId,
          workDate: selectedDate,
          maxLoadOverride: maxLoadOverride ? Number(maxLoadOverride) : undefined,
        };

        const creates: { label: "Staff" | "Merchandiser"; accountId: number }[] = [];
        if (selectedStaffId) {
          creates.push({ label: "Staff", accountId: selectedStaffId });
        }
        if (selectedMerchId) {
          creates.push({ label: "Merchandiser", accountId: selectedMerchId });
        }

        if (creates.length === 0) {
          toast.error("Please select at least one Staff or Merchandiser.");
          return;
        }

        for (const { label, accountId } of creates) {
          try {
            await scheduleApi.createWorkSchedule({ accountId, ...payload });
          } catch (roleErr: unknown) {
            const status =
              roleErr instanceof AxiosError ? roleErr.response?.status : undefined;
            if (status === 409) {
              toast.error(
                `${label} is already assigned to this shift on the selected date.`
              );
            } else {
              toast.error(`${label}: ${getApiErrorMessage(roleErr)}`);
            }
            throw roleErr;
          }
        }

        const roleSummary =
          creates.length === 2
            ? "Staff and Merchandiser"
            : creates[0].label;
        toast.success(`${roleSummary} assigned successfully!`);
        onSubmitted();
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeShifts = shifts.filter((s) => s.isActive);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors mb-4 group"
          >
            <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Schedule
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
            {isEdit ? "Edit Assignment" : "New Assignment"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isEdit
              ? `Updating assignment for ${editData.accountName}.`
              : "Configure shift and personnel details for operational fulfillment."}
          </p>
        </div>
      </div>

      {transferResult && transferResult.transferredCount > 0 && (
        <div className="mb-8 rounded-3xl border border-brand-200 bg-brand-50/50 p-6 dark:border-brand-900 dark:bg-brand-500/10">
          <p className="text-sm font-bold text-gray-800 dark:text-white">
            Transferred {transferResult.transferredCount} order(s) to the new assignee on this shift.
          </p>
          {transferResult.autoAssignReassignedCount > 0 || transferResult.autoAssignQueuedCount > 0 ? (
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Auto-assign fallback: {transferResult.autoAssignReassignedCount} reassigned,{" "}
              {transferResult.autoAssignQueuedCount} queued.
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setShowTransferredList((v) => !v)}
            className="mt-3 text-sm font-bold text-brand-600 hover:text-brand-700"
          >
            {showTransferredList ? "Hide list" : "View transferred orders"}
          </button>
          {showTransferredList && (
            <ul className="mt-4 max-h-48 overflow-y-auto space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {transferResult.transferredOrders.map((o) => (
                <li key={o.orderId} className="rounded-xl bg-white/80 px-3 py-2 dark:bg-gray-900/50">
                  <span className="font-bold">{o.orderCode}</span>
                  <span className="text-gray-500"> — {o.statusName}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              onClick={() => {
                setTransferResult(null);
                onSubmitted();
              }}
              className="rounded-2xl px-8 h-11 text-sm font-bold"
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {!transferResult && (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Config */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-6">
                <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
                  Shift Settings
                </h3>

                <div>
                  <label className="mb-2 block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Shift Template <span className="text-error-500">*</span>
                  </label>
                  <Select
                    value={selectedShiftId ? String(selectedShiftId) : ""}
                    onChange={(e) => setSelectedShiftId(Number(e.target.value) || 0)}
                    options={activeShifts.map((shift) => ({
                      value: String(shift.shiftTemplateId),
                      label: shift.shiftName,
                    }))}
                    placeholder="-- Choose Shift --"
                    error={!!errors.shiftId}
                  />
                  {errors.shiftId && <p className="mt-2 text-xs text-error-500 font-bold">{errors.shiftId}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black text-gray-400 uppercase tracking-widest">
                    Assignment Date <span className="text-error-500">*</span>
                  </label>
                  <DatePicker
                    id="assignment-date"
                    defaultDate={selectedDate ? new Date(`${selectedDate}T12:00:00`) : undefined}
                    minDate={(() => {
                      const now = new Date();
                      const y = now.getFullYear();
                      const m = String(now.getMonth() + 1).padStart(2, "0");
                      const d = String(now.getDate()).padStart(2, "0");
                      return `${y}-${m}-${d}`;
                    })()}
                    dateFormat="d/m/Y"
                    placeholder="Select Date"
                    onChange={([date]) => {
                      if (date) {
                        const y = date.getFullYear();
                        const m = String(date.getMonth() + 1).padStart(2, "0");
                        const d = String(date.getDate()).padStart(2, "0");
                        setSelectedDate(`${y}-${m}-${d}`);
                      }
                    }}
                  />
                  {errors.date && <p className="mt-2 text-xs text-error-500 font-bold">{errors.date}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black text-gray-400 uppercase tracking-widest">
                    Max Orders Limit (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    placeholder="e.g. 10 (Leave blank for default)"
                    value={maxLoadOverride}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMaxLoadOverride(val === "" ? "" : parseInt(val) || 0);
                    }}
                    className={inputClassName}
                  />
                  <p className="mt-1.5 text-[10px] text-gray-400 font-medium">
                    Overrides the default orders limit from the shift template.
                  </p>
                </div>
              </div>

              {/* Policy info box */}
              <div className="rounded-xl border border-brand-100 bg-brand-50 p-5 dark:border-brand-900/30 dark:bg-brand-500/5">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400">
                    <CalenderIcon className="h-6 w-6 fill-current" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-brand-800 dark:text-brand-300">Assignment Policy</p>
                    <p className="text-xs text-brand-700/80 dark:text-brand-400/80 mt-1.5 leading-relaxed">
                      {isEdit
                        ? "You are modifying a specific assignment. Ensure the new staff member is available for this shift."
                        : assignedOnShift.length > 0
                          ? `This shift has ${assignedOnShift.length} active assignment(s). You can add more staff or merchandisers as needed.`
                          : "Select one or more Staff and/or Merchandisers to assign to this shift."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Currently assigned on this shift */}
              {!isEdit && assignedOnShift.length > 0 && selectedShiftId > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] space-y-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <UserCircleIcon className="w-6 h-6" />
                    Currently On This Shift
                  </h4>
                  <ul className="space-y-2">
                    {assignedOnShift.map((s) => (
                      <li key={s.scheduleId} className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${s.roleId === 3 ? "bg-brand-500" : "bg-warning-500"}`}>
                          {s.accountName?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{s.accountName}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-wide ${s.roleId === 3 ? "text-brand-500" : "text-warning-500"}`}>
                            {s.roleId === 3 ? "Staff" : "Merchandiser"}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${s.status === "OnDuty" ? "bg-success-50 text-success-700" : "bg-blue-50 text-blue-700"}`}>
                          {s.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right Column: Personnel */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-6 rounded-full bg-brand-500"></div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {isEdit ? "Update Personnel" : "Personnel Selection"}
                  </h3>
                </div>

                {errors.general && (
                  <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-900/50 dark:bg-error-500/10 dark:text-error-300">
                    {errors.general}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Staff picker — always visible in create mode, only for role=3 in edit */}
                  {(!isEdit || editData?.roleId === 3) && (
                    <StaffPicker
                      label={isEdit ? "Change Staff Member" : "Sales Staff (Role 3)"}
                      accounts={isEdit ? staffList : availableStaff}
                      selectedId={selectedStaffId}
                      onSelect={setSelectedStaffId}
                      isLoading={isLoadingAccounts}
                      error={errors.staffId}
                      accentColor="brand"
                    />
                  )}

                  {/* Merch picker — always visible in create mode, only for role=4 in edit */}
                  {(!isEdit || editData?.roleId === 4) && (
                    <StaffPicker
                      label={isEdit ? "Change Merchandiser" : "Shop Merchandiser (Role 4)"}
                      accounts={isEdit ? merchList : availableMerch}
                      selectedId={selectedMerchId}
                      onSelect={setSelectedMerchId}
                      isLoading={isLoadingAccounts}
                      error={errors.merchId}
                      accentColor="warning"
                    />
                  )}

                  {isEdit && (
                    <div className="flex items-center justify-center p-6 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 text-center font-medium">
                        The other role is locked for this edit.<br />To change both, use the individual edit buttons on each card.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button
                  variant="outline"
                  onClick={onBack}
                  disabled={isSubmitting}
                  className="rounded-lg px-6 h-10 text-sm font-medium border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isLoadingAccounts}
                  className="rounded-lg px-8 h-10 text-sm font-medium shadow-sm"
                >
                  {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Complete Assignment"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default WorkScheduleForm;
