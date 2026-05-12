import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import { VoucherFormData } from "../types/voucher";
import { VoucherFormSchema } from "../types/voucher.schema";
import { voucherApi } from "../services/voucher-api";
import { formatUTCtoLocal, formatLocalToUTC, formatDisplayDate } from "@/utils/date-utils";

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
  const [rawVoucher, setRawVoucher] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<VoucherFormData>({
    resolver: zodResolver(VoucherFormSchema),
    defaultValues,
    mode: "onTouched",
  });

  const startDate = useWatch({ control, name: "startDate" });
  const endDate = useWatch({ control, name: "endDate" });

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
        reset(defaultValues);
      }
    }
  }, [isOpen, voucherId, isEditMode, isDetailMode, reset, onClose]);

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
                disabled={isReadOnly}
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
                disabled={isReadOnly}
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
              readOnly={isReadOnly}
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
                disabled={isReadOnly}
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
                disabled={isReadOnly}
                {...register("discountValue", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label>Max Discount Cap (VND)</Label>
              <Input 
                type="number" 
                placeholder="Limit discount up to..." 
                error={!!errors.maxDiscountCap}
                hint={errors.maxDiscountCap?.message}
                disabled={isReadOnly}
                {...register("maxDiscountCap", { 
                  setValueAs: v => v === "" || v === null || isNaN(v) ? null : parseInt(v) 
                })}
              />
            </div>
            <div>
              <Label>Min Order Amount (VND)</Label>
              <Input 
                type="number" 
                placeholder="Minimum cart value" 
                error={!!errors.minOrderAmount}
                hint={errors.minOrderAmount?.message}
                disabled={isReadOnly}
                {...register("minOrderAmount", { 
                  setValueAs: v => v === "" || v === null || isNaN(v) ? null : parseInt(v) 
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label>Discount Target</Label>
              <Select 
                options={[
                  { value: "ORDER_TOTAL", label: "Entire Order" },
                  { value: "SHIPPING_FEE", label: "Shipping Fee" },
                ]}
                error={!!errors.discountTarget}
                hint={errors.discountTarget?.message}
                disabled={isReadOnly}
                {...register("discountTarget")}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select 
                options={[
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                  { value: "Scheduled", label: "Scheduled" },
                  { value: "Expired", label: "Expired" },
                ]}
                error={!!errors.status}
                hint={errors.status?.message}
                disabled={isReadOnly}
                {...register("status")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label>Total Quantity limit</Label>
              <Input 
                type="number" 
                placeholder="Leave blank for unlimited" 
                error={!!errors.totalQuantity}
                hint={errors.totalQuantity?.message}
                disabled={isReadOnly}
                {...register("totalQuantity", { 
                  setValueAs: v => v === "" || v === null || isNaN(v) ? null : parseInt(v) 
                })}
              />
            </div>
            <div>
              <Label>Max Usage Per User</Label>
              <Input 
                type="number" 
                placeholder="e.g. 1" 
                error={!!errors.maxUsagePerUser}
                hint={errors.maxUsagePerUser?.message}
                disabled={isReadOnly}
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
              {isReadOnly ? (
                <div className="h-11 px-4 flex items-center bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-white/90">
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
