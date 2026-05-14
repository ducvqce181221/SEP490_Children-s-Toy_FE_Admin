import React, { useEffect, useState } from "react";
import { ShiftTemplate } from "../types/shift";
import { WorkSchedule } from "../types/schedule";
import Button from "@/components/ui/button/Button";
import { accountApi } from "@/features/account/services/account-api";
import { AccountListItem } from "@/features/account/types/account";
import { scheduleApi } from "../services/schedule-api";
import toast from "react-hot-toast";
import StaffPicker from "./StaffPicker";
import { CalenderIcon, TimeIcon, ChevronLeftIcon } from "@/icons";

interface WorkScheduleFormProps {
  onBack: () => void;
  onSubmitted: () => void;
  shifts: ShiftTemplate[];
  initialDate: string;
  editData?: WorkSchedule | null;
}

const inputClassName =
  "h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition-all focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const WorkScheduleForm: React.FC<WorkScheduleFormProps> = ({
  onBack,
  onSubmitted,
  shifts,
  initialDate,
  editData = null,
}) => {
  const isEdit = !!editData;

  const [staffList, setStaffList] = useState<AccountListItem[]>([]);
  const [merchList, setMerchList] = useState<AccountListItem[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  const [selectedStaffId, setSelectedStaffId] = useState(0);
  const [selectedMerchId, setSelectedMerchId] = useState(0);
  const [selectedShiftId, setSelectedShiftId] = useState(0);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState<{
    staffId?: string;
    merchId?: string;
    shiftId?: string;
    date?: string;
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

  // Initialize form if editing
  useEffect(() => {
    if (editData) {
      setSelectedShiftId(editData.shiftTemplateId);
      setSelectedDate(editData.workDate.split("T")[0]);
      if (editData.roleId === 3) {
        setSelectedStaffId(editData.accountId);
      } else if (editData.roleId === 4) {
        setSelectedMerchId(editData.accountId);
      }
    }
  }, [editData]);

  const validate = () => {
    const newErrors: typeof errors = {};
    
    if (isEdit) {
      if (editData?.roleId === 3 && !selectedStaffId) newErrors.staffId = "Please select a Staff member";
      if (editData?.roleId === 4 && !selectedMerchId) newErrors.merchId = "Please select a Merchandiser";
    } else {
      if (!selectedStaffId) newErrors.staffId = "Please select a Staff member";
      if (!selectedMerchId) newErrors.merchId = "Please select a Merchandiser";
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
    
    try {
      if (isEdit && editData) {
        // Handle Update (Single record)
        const accountId = editData.roleId === 3 ? selectedStaffId : selectedMerchId;
        await scheduleApi.updateWorkSchedule(editData.scheduleId, {
          accountId,
          shiftTemplateId: selectedShiftId,
          workDate: selectedDate,
        });
        toast.success("Assignment updated successfully!");
        onSubmitted();
      } else {
        // Handle Create (Current behavior: assign both)
        const payload = {
          shiftTemplateId: selectedShiftId,
          workDate: selectedDate,
        };

        const results = await Promise.allSettled([
          scheduleApi.createWorkSchedule({ accountId: selectedStaffId, ...payload }),
          scheduleApi.createWorkSchedule({ accountId: selectedMerchId, ...payload }),
        ]);

        const [staffResult, merchResult] = results;
        let hasSuccess = false;
        const messages: string[] = [];

        if (staffResult.status === "fulfilled") {
          hasSuccess = true;
        } else {
          const status = (staffResult.reason as { response?: { status?: number } })?.response?.status;
          messages.push(
            status === 409
              ? "Staff is already assigned to this shift on the selected date."
              : "Failed to assign Staff."
          );
        }

        if (merchResult.status === "fulfilled") {
          hasSuccess = true;
        } else {
          const status = (merchResult.reason as { response?: { status?: number } })?.response?.status;
          messages.push(
            status === 409
              ? "Merchandiser is already assigned to this shift on the selected date."
              : "Failed to assign Merchandiser."
          );
        }

        if (messages.length === 0) {
          toast.success("Staff and Merchandiser assigned successfully!");
          onSubmitted();
        } else if (hasSuccess) {
          messages.forEach((m) => toast.error(m));
          toast.success("One assignment succeeded — other may already exist.");
          onSubmitted();
        } else {
          messages.forEach((m) => toast.error(m));
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Operation failed";
      toast.error(msg);
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
                      : "Each operational shift must have exactly one Staff and one Merchandiser assigned to ensure capacity."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Personnel */}
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-1 h-8 rounded-full bg-brand-500"></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isEdit ? "Update Personnel" : "Personnel Selection"}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {(!isEdit || editData?.roleId === 3) && (
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

                {(!isEdit || editData?.roleId === 4) && (
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
    </div>
  );
};

export default WorkScheduleForm;
