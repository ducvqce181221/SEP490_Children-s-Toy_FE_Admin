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
import { CalenderIcon, TimeIcon, ChevronLeftIcon } from "@/icons";

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

function isActiveScheduleOnShift(s: WorkSchedule) {
  return s.status !== "Absent" && s.status !== "Cancelled";
}

function getShiftRoleCoverage(
  schedules: WorkSchedule[],
  workDate: string,
  shiftTemplateId: number
) {
  const dateKey = workDate.split("T")[0];
  const onShift = schedules.filter(
    (s) =>
      isActiveScheduleOnShift(s) &&
      s.workDate.split("T")[0] === dateKey &&
      s.shiftTemplateId === shiftTemplateId
  );
  return {
    hasStaff: onShift.some((s) => s.roleId === 3),
    hasMerch: onShift.some((s) => s.roleId === 4),
  };
}

function buildEditFormState(edit: WorkSchedule) {
  return {
    shiftId: edit.shiftTemplateId,
    date: edit.workDate.split("T")[0],
    staffId: edit.roleId === 3 ? edit.accountId : 0,
    merchId: edit.roleId === 4 ? edit.accountId : 0,
  };
}

interface WorkScheduleFormProps {
  onBack: () => void;
  onSubmitted: () => void;
  shifts: ShiftTemplate[];
  initialDate: string;
  editData?: WorkSchedule | null;
  /** Schedules for the current list date — used to skip roles already on a shift when replenishing. */
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
    setTransferResult(null);
    setShowTransferredList(false);
  }

  const [errors, setErrors] = useState<{
    staffId?: string;
    merchId?: string;
    shiftId?: string;
    date?: string;
  }>({});

  const shiftCoverage = useMemo(
    () =>
      !isEdit && selectedShiftId > 0
        ? getShiftRoleCoverage(existingSchedules, selectedDate, selectedShiftId)
        : { hasStaff: false, hasMerch: false },
    [isEdit, existingSchedules, selectedDate, selectedShiftId]
  );

  const needsStaffOnCreate = !isEdit && !shiftCoverage.hasStaff;
  const needsMerchOnCreate = !isEdit && !shiftCoverage.hasMerch;

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

  const validate = () => {
    const newErrors: typeof errors = {};
    
    if (isEdit) {
      if (editData?.roleId === 3 && !selectedStaffId) newErrors.staffId = "Please select a Staff member";
      if (editData?.roleId === 4 && !selectedMerchId) newErrors.merchId = "Please select a Merchandiser";
    } else {
      if (needsStaffOnCreate && !selectedStaffId) {
        newErrors.staffId = "Please select a Staff member";
      }
      if (needsMerchOnCreate && !selectedMerchId) {
        newErrors.merchId = "Please select a Merchandiser";
      }
      if (!needsStaffOnCreate && !needsMerchOnCreate) {
        newErrors.shiftId =
          "This shift already has Staff and Merchandiser. Edit an assignment or mark someone absent first.";
      }
    }
    
    if (!selectedShiftId) newErrors.shiftId = "Please select a shift";
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
        };

        const creates: { label: "Staff" | "Merchandiser"; accountId: number }[] = [];
        if (needsStaffOnCreate && selectedStaffId) {
          creates.push({ label: "Staff", accountId: selectedStaffId });
        }
        if (needsMerchOnCreate && selectedMerchId) {
          creates.push({ label: "Merchandiser", accountId: selectedMerchId });
        }

        if (creates.length === 0) {
          toast.error(
            "This shift already has Staff and Merchandiser for the selected date and shift."
          );
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-500 transition-colors mb-2 group"
          >
            <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Schedule
          </button>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Config */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-4">
                Shift Settings
              </h3>
              
              <div>
                <label className="mb-2 block text-xs font-black text-gray-400 uppercase tracking-widest">
                  Shift Template <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedShiftId}
                    onChange={(e) => setSelectedShiftId(Number(e.target.value))}
                    className={`${inputClassName} appearance-none pr-10`}
                  >
                    <option value="0">-- Choose Shift --</option>
                    {activeShifts.map((shift) => (
                      <option key={shift.shiftTemplateId} value={shift.shiftTemplateId}>
                        {shift.shiftName}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <TimeIcon className="w-5 h-5" />
                  </div>
                </div>
                {errors.shiftId && <p className="mt-2 text-xs text-error-500 font-bold">{errors.shiftId}</p>}
              </div>

              <div>
                <label className="mb-2 block text-xs font-black text-gray-400 uppercase tracking-widest">
                  Assignment Date <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={inputClassName}
                  />
                </div>
                {errors.date && <p className="mt-2 text-xs text-error-500 font-bold">{errors.date}</p>}
              </div>
            </div>

            <div className="rounded-3xl bg-brand-500 p-6 text-white shadow-xl shadow-brand-500/20">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                  <CalenderIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight">Requirement Policy</p>
                  <p className="text-sm text-white/80 mt-2 leading-relaxed font-medium">
                    {isEdit
                      ? "You are modifying a specific assignment. Ensure the new staff member is available for this shift."
                      : shiftCoverage.hasStaff && shiftCoverage.hasMerch
                        ? "This shift is fully staffed. Use Edit on a card or mark absent before changing personnel."
                        : shiftCoverage.hasStaff || shiftCoverage.hasMerch
                          ? "Only the missing role is required — the other person is already on this shift."
                          : "Each operational shift needs one Staff and one Merchandiser."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Personnel */}
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1 h-8 rounded-full bg-brand-500"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isEdit ? "Update Personnel" : "Personnel Selection"}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {(!isEdit || editData?.roleId === 3) &&
                  (isEdit || needsStaffOnCreate) && (
                  <StaffPicker
                    label={isEdit ? "Change Staff Member" : "Available Staff (Role: 3)"}
                    accounts={staffList}
                    selectedId={selectedStaffId}
                    onSelect={setSelectedStaffId}
                    isLoading={isLoadingAccounts}
                    error={errors.staffId}
                    accentColor="brand"
                  />
                )}

                {!isEdit && shiftCoverage.hasStaff && (
                  <div className="flex items-center justify-center p-8 rounded-3xl border-2 border-dashed border-brand-100 bg-brand-50/30 dark:border-brand-900 dark:bg-brand-500/5">
                    <p className="text-xs text-brand-700 dark:text-brand-300 text-center font-semibold">
                      Staff is already assigned on this shift.<br />
                      Select only a Merchandiser to fill the open slot.
                    </p>
                  </div>
                )}

                {(!isEdit || editData?.roleId === 4) &&
                  (isEdit || needsMerchOnCreate) && (
                  <StaffPicker
                    label={isEdit ? "Change Merchandiser" : "Available Merchandiser (Role: 4)"}
                    accounts={merchList}
                    selectedId={selectedMerchId}
                    onSelect={setSelectedMerchId}
                    isLoading={isLoadingAccounts}
                    error={errors.merchId}
                    accentColor="warning"
                  />
                )}

                {!isEdit && shiftCoverage.hasMerch && (
                  <div className="flex items-center justify-center p-8 rounded-3xl border-2 border-dashed border-warning-100 bg-warning-50/30 dark:border-warning-900 dark:bg-warning-500/5">
                    <p className="text-xs text-warning-800 dark:text-warning-300 text-center font-semibold">
                      Merchandiser is already assigned on this shift.<br />
                      Select only Staff to fill the open slot.
                    </p>
                  </div>
                )}
                
                {isEdit && (
                  <div className="flex items-center justify-center p-8 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-400 text-center font-medium">
                      The other role is locked for this edit.<br/>To change both, use the individual edit buttons on each card.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 p-4">
              <Button 
                variant="outline" 
                onClick={onBack} 
                disabled={isSubmitting} 
                className="rounded-2xl px-8 h-12 text-sm font-bold border-gray-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isLoadingAccounts}
                className="rounded-2xl px-12 h-12 text-sm font-bold shadow-xl shadow-brand-500/30"
              >
                {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Complete & Save Assignment"}
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
