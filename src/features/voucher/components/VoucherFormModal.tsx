import React, { useEffect, useState, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import { Voucher, VoucherFormData } from "../types/voucher";
import { getVoucherFormSchema } from "../types/voucher.schema";
import { voucherApi } from "../services/voucher-api";
import { formatUTCtoLocal, formatLocalToUTC, formatDisplayDate, getIdealFutureTime } from "@/utils/date-utils";
import { useAuthContext } from "@/context/AuthContext";

export type VoucherModalMode = "create" | "edit" | "detail";

interface VoucherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: VoucherFormData) => void;
  voucherId?: number | null;
  mode?: VoucherModalMode;
  isSubmitting?: boolean;
}

const defaultValues: VoucherFormData = {
  voucherCode: "",
  voucherName: "",
  voucherDescription: "",
  discountType: "PERCENTAGE",
  discountValue: 0,
  maxDiscountCap: null,
  discountTarget: "ORDER_TOTAL",
  minOrderAmount: null,
  totalQuantity: null,
  maxUsagePerUser: null,
  startDate: "",
  endDate: "",
  status: "Active",
};

export const VoucherFormModal: React.FC<VoucherFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  voucherId,
  mode = "create",
  isSubmitting = false
}) => {
  const isEditMode = mode === "edit";
  const isDetailMode = mode === "detail";
  const isReadOnly = isDetailMode;
  
  const [isLoading, setIsLoading] = useState(false);
  const [rawVoucher, setRawVoucher] = useState<Voucher | null>(null);

  // Helper variables for disabled fields based on Used/Expired states
  const hasBeenUsed = (rawVoucher?.usedQuantity ?? 0) > 0;
  const isExpiredStatus = rawVoucher?.status === "Expired";
  const isExpiredTime = rawVoucher?.endDate ? new Date(rawVoucher.endDate).getTime() <= Date.now() : false;
  const isExpired = isExpiredStatus || isExpiredTime;

  const isCriticalDisabled = isReadOnly || (isEditMode && (hasBeenUsed || isExpired));
  const isNonCriticalLockedForExpired = isReadOnly || (isEditMode && isExpired);
  const isStartDateReadOnly = isReadOnly || (isEditMode && (isExpired || hasBeenUsed));

  const { account } = useAuthContext();
  const roleName = account?.roleName;

  const statusOptions = useMemo(() => {
    const defaultOpts = [
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" },
      { value: "Scheduled", label: "Scheduled" },
      { value: "Expired", label: "Expired" },
      { value: "Pending", label: "Pending" },
      { value: "Rejected", label: "Rejected" },
    ];

    if (!rawVoucher) return defaultOpts;

    const currentStatus = rawVoucher.status;
    const isAdmin = roleName === "Admin";

    if (isDetailMode) {
      return defaultOpts;
    }

    switch (currentStatus) {
      case "Scheduled":
        return isAdmin
          ? [
              { value: "Scheduled", label: "Scheduled" },
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
            ]
          : [
              { value: "Scheduled", label: "Scheduled" },
              { value: "Inactive", label: "Inactive" },
            ];

      case "Active":
        return [
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" },
        ];

      case "Inactive":
        return isAdmin
          ? [
              { value: "Inactive", label: "Inactive" },
              { value: "Active", label: "Active" },
              { value: "Scheduled", label: "Scheduled" },
            ]
          : [
              { value: "Inactive", label: "Inactive" },
              { value: "Pending", label: "Reactivate (Request Approval)" },
            ];

      case "Expired":
        return isAdmin
          ? [
              { value: "Expired", label: "Expired" },
              { value: "Active", label: "Active" },
              { value: "Scheduled", label: "Scheduled" },
            ]
          : [
              { value: "Expired", label: "Expired" },
              { value: "Pending", label: "Reactivate (Request Approval)" },
            ];

      case "Pending":
        return isAdmin
          ? [
              { value: "Pending", label: "Pending (Under Review)" },
              { value: "Scheduled", label: "Approve (Schedule)" },
              { value: "Active", label: "Approve (Start Now)" },
              { value: "Inactive", label: "Inactive" },
              { value: "Rejected", label: "Rejected" },
            ]
          : [
              { value: "Pending", label: "Pending" },
              { value: "Inactive", label: "Inactive" },
            ];

      default:
        return defaultOpts;
    }
  }, [rawVoucher, roleName, isDetailMode]);

  // Không hiển thị Status khi tạo mới hoặc khi edit một voucher đang bị Rejected
  const shouldShowStatus = isDetailMode || (isEditMode && rawVoucher?.status !== "Rejected");

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<VoucherFormData>({
    resolver: zodResolver(getVoucherFormSchema(isEditMode)),
    defaultValues,
    mode: "onTouched",
  });

  const discountType = useWatch({ control, name: "discountType" });
  const discountTarget = useWatch({ control, name: "discountTarget" });

  useEffect(() => {
    if (isOpen) {
      if ((isEditMode || isDetailMode) && voucherId) {
        // Fetch specific voucher data
        const fetchVoucher = async () => {
          setIsLoading(true);
          try {
            const data = await voucherApi.getVoucherById(voucherId);
            setRawVoucher(data);
            reset({
              voucherCode: data.voucherCode,
              voucherName: data.voucherName,
              voucherDescription: data.voucherDescription || "",
              discountType: data.discountType as "FIXED" | "PERCENTAGE",
              discountValue: data.discountValue,
              maxDiscountCap: data.maxDiscountCap,
              discountTarget: data.discountTarget as "ORDER_TOTAL" | "SHIPPING_FEE",
              minOrderAmount: data.minOrderAmount,
              totalQuantity: data.totalQuantity,
              maxUsagePerUser: data.maxUsagePerUser,
              startDate: formatUTCtoLocal(data.startDate),
              endDate: formatUTCtoLocal(data.endDate),
              status: data.status as "Active" | "Inactive" | "Scheduled" | "Expired",
            });
          } catch {
            toast.error("Error loading voucher details");
            onClose();
          } finally {
            setIsLoading(false);
          }
        };
        fetchVoucher();
      } else {
        setRawVoucher(null);
        reset({
          ...defaultValues,
          startDate: formatUTCtoLocal(new Date(getIdealFutureTime()).toISOString()),
          endDate: formatUTCtoLocal(new Date(getIdealFutureTime() + 86400000).toISOString()),
        });
      }
    }
  }, [isOpen, voucherId, isEditMode, isDetailMode, reset, onClose]);

  // Tự động xóa Max Discount Cap khi chọn loại giảm giá là FIXED (trừ khi target là FINAL_PRICE)
  useEffect(() => {
    if (discountType === "FIXED" && discountTarget !== "FINAL_PRICE" && !isReadOnly) {
      setValue("maxDiscountCap", null);
    }
  }, [discountType, discountTarget, setValue, isReadOnly]);

  // Khi chọn discountTarget là FINAL_PRICE thì tự động thiết lập các giá trị mặc định
  useEffect(() => {
    if (discountTarget === "FINAL_PRICE" && !isReadOnly) {
      setValue("discountType", "FIXED");
      setValue("discountValue", 1000);
      setValue("maxUsagePerUser", 1);
    }
  }, [discountTarget, setValue, isReadOnly]);

  const onFormSubmit = (data: VoucherFormData) => {
    if (isReadOnly) return;
    
    // Format dates back to UTC
    const formattedData = {
      ...data,
      startDate: formatLocalToUTC(data.startDate),
      endDate: formatLocalToUTC(data.endDate),
    };
    
    onSave?.(formattedData);
  };

  const title = isDetailMode ? "Voucher Details" : isEditMode ? "Edit Voucher" : "Add New Voucher";
  const description = isDetailMode 
    ? "Viewing voucher detailed information." 
    : isEditMode 
    ? "Update the voucher information." 
    : "Fill in the details to create a new voucher.";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[800px] p-5 lg:p-10">
      <div className="flex flex-col gap-2 mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          {title}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-gray-500">Loading voucher details...</div>
      ) : (
        <form className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto pr-2" onSubmit={handleSubmit(onFormSubmit)}>
          
          {isEditMode && rawVoucher?.status === "Rejected" && rawVoucher?.reason && (
            <div className="bg-error-50 dark:bg-error-500/10 border-l-4 border-error-500 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-error-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-error-800 dark:text-error-400">
                    Voucher Rejected
                  </h3>
                  <div className="mt-2 text-sm text-error-700 dark:text-error-300">
                    <p>Reason: {rawVoucher.reason}</p>
                    <p className="mt-1 italic text-xs">Edit and save to resubmit for approval.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label>
                Voucher Code <span className="text-error-500">*</span>
              </Label>
              <Input 
                type="text" 
                placeholder="e.g. SUMMER2026" 
                error={!!errors.voucherCode}
                hint={errors.voucherCode?.message}
                disabled={isCriticalDisabled}
                {...register("voucherCode", {
                  onChange: (e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }
                })}
              />
            </div>
            <div>
              <Label>
                Voucher Name <span className="text-error-500">*</span>
              </Label>
              <Input 
                type="text" 
                placeholder="e.g. Summer Sale Discount" 
                error={!!errors.voucherName}
                hint={errors.voucherName?.message}
                disabled={isNonCriticalLockedForExpired}
                {...register("voucherName")}
              />
            </div>
          </div>

          <div>
            <Label>
              Description <span className="text-error-500">*</span>
            </Label>
            <TextArea 
              placeholder="Enter description here..." 
              rows={2}
              error={!!errors.voucherDescription}
              hint={errors.voucherDescription?.message}
              readOnly={isNonCriticalLockedForExpired}
              {...register("voucherDescription")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label>Discount Type</Label>
              <Select 
                options={[
                  { value: "PERCENTAGE", label: "Percentage (%)" },
                  { value: "FIXED", label: "Fixed Amount (VND)" },
                ]}
                error={!!errors.discountType}
                hint={errors.discountType?.message}
                disabled={isCriticalDisabled}
                {...register("discountType")}
              />
            </div>
            <div>
              <Label>
                Discount Value <span className="text-error-500">*</span>
              </Label>
              <Input 
                type="number" 
                placeholder="Value" 
                error={!!errors.discountValue}
                hint={errors.discountValue?.message}
                disabled={isCriticalDisabled}
                {...register("discountValue", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label className={(discountType === "FIXED" && discountTarget !== "FINAL_PRICE") ? "opacity-50" : ""}>
                Max Discount Cap (VND) {(discountType === "FIXED" && discountTarget !== "FINAL_PRICE") && <span className="text-xs italic">(Not applicable for Fixed)</span>}
              </Label>
              <Input 
                type="number" 
                placeholder={(discountType === "FIXED" && discountTarget !== "FINAL_PRICE") ? "Not applicable" : "Limit discount up to..."} 
                error={!!errors.maxDiscountCap}
                hint={errors.maxDiscountCap?.message}
                disabled={isCriticalDisabled || (discountType === "FIXED" && discountTarget !== "FINAL_PRICE")}
                {...register("maxDiscountCap", { 
                  setValueAs: v => v === "" || v === null || isNaN(v) ? null : parseInt(v) 
                })}
              />
            </div>
            <div>
              <Label>Min Order Amount (VND) {discountTarget === "FINAL_PRICE" && <span className="text-error-500">*</span>}</Label>
              <Input 
                type="number" 
                placeholder="Minimum cart value" 
                error={!!errors.minOrderAmount}
                hint={errors.minOrderAmount?.message}
                disabled={isCriticalDisabled}
                {...register("minOrderAmount", { 
                  setValueAs: v => v === "" || v === null || isNaN(v) ? null : parseInt(v),
                  onChange: () => trigger("discountValue")
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className={shouldShowStatus ? "" : "sm:col-span-2"}>
              <Label>Discount Target</Label>
              <Select 
                options={[
                  { value: "ORDER_TOTAL", label: "Entire Order" },
                  { value: "SHIPPING_FEE", label: "Shipping Fee" },
                  { value: "FINAL_PRICE", label: "Final Price" },
                ]}
                error={!!errors.discountTarget}
                hint={errors.discountTarget?.message}
                disabled={isCriticalDisabled}
                {...register("discountTarget")}
              />
            </div>
            {shouldShowStatus && (
              <div>
                <Label>Status</Label>
                <Select 
                  options={statusOptions}
                  error={!!errors.status}
                  hint={errors.status?.message}
                  disabled={isReadOnly}
                  {...register("status")}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label>Total Quantity limit {discountTarget === "FINAL_PRICE" && <span className="text-error-500">*</span>}</Label>
              <Input 
                type="number" 
                placeholder={discountTarget === "FINAL_PRICE" ? "e.g. 100" : "Leave blank for unlimited"} 
                error={!!errors.totalQuantity}
                hint={errors.totalQuantity?.message}
                disabled={isNonCriticalLockedForExpired}
                {...register("totalQuantity", { 
                  setValueAs: v => v === "" || v === null || isNaN(v) ? null : parseInt(v) 
                })}
              />
            </div>
            <div>
              <Label>Max Usage Per User {discountTarget === "FINAL_PRICE" && <span className="text-error-500">*</span>}</Label>
              <Input 
                type="number" 
                placeholder="e.g. 1" 
                error={!!errors.maxUsagePerUser}
                hint={errors.maxUsagePerUser?.message}
                disabled={isNonCriticalLockedForExpired}
                {...register("maxUsagePerUser", { 
                  setValueAs: v => v === "" || v === null || isNaN(v) ? null : parseInt(v) 
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label>
                Start Date <span className="text-error-500">*</span>
              </Label>
              {isStartDateReadOnly ? (
                <div className="h-11 px-4 flex items-center bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-white/90 opacity-70">
                  {formatDisplayDate(rawVoucher?.startDate)}
                </div>
              ) : (
                <Input 
                  type="datetime-local" 
                  error={!!errors.startDate}
                  hint={errors.startDate?.message}
                  {...register("startDate")}
                />
              )}
            </div>
            <div>
              <Label>
                End Date <span className="text-error-500">*</span>
              </Label>
              {isReadOnly ? (
                <div className="h-11 px-4 flex items-center bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-white/90">
                  {formatDisplayDate(rawVoucher?.endDate)}
                </div>
              ) : (
                <Input 
                  type="datetime-local" 
                  error={!!errors.endDate}
                  hint={errors.endDate?.message}
                  {...register("endDate")}
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.05]">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              {isReadOnly ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly && (
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : (isEditMode ? "Save Changes" : "Save Voucher")}
              </Button>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
};
