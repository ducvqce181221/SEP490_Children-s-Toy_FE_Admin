import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import { Voucher, VoucherFormData } from "../types/voucher";
import { VoucherFormSchema } from "../types/voucher.schema";

interface VoucherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: VoucherFormData) => void;
  initialData?: Voucher | null;
  isSubmitting?: boolean;
}

const getInitialFormData = (initialData?: Voucher | null): VoucherFormData => {
  if (initialData) {
    return {
      voucherCode: initialData.voucherCode,
      voucherName: initialData.voucherName,
      voucherDescription: initialData.voucherDescription,
      discountType: initialData.discountType,
      discountValue: initialData.discountValue,
      maxDiscountCap: initialData.maxDiscountCap,
      discountTarget: initialData.discountTarget,
      minOrderAmount: initialData.minOrderAmount,
      totalQuantity: initialData.totalQuantity,
      maxUsagePerUser: initialData.maxUsagePerUser,
      startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : "",
      endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : "",
      status: initialData.status,
    };
  }

  return {
    voucherCode: "",
    voucherName: "",
    voucherDescription: "",
    discountType: "PERCENTAGE",
    discountValue: 0,
    maxDiscountCap: null,
    discountTarget: "ORDER",
    minOrderAmount: null,
    totalQuantity: null,
    maxUsagePerUser: null,
    startDate: "",
    endDate: "",
    status: "Active",
  };
};

export const VoucherFormModal: React.FC<VoucherFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData,
  isSubmitting = false
}) => {
  const isEditMode = !!initialData;
  const [formData, setFormData] = useState<VoucherFormData>(() => getInitialFormData(initialData));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert string empty values back to null for numbers before validating
    const cleanedData = {
      ...formData,
      discountValue: Number(formData.discountValue),
      maxDiscountCap: formData.maxDiscountCap ? Number(formData.maxDiscountCap) : null,
      minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : null,
      totalQuantity: formData.totalQuantity ? Number(formData.totalQuantity) : null,
      maxUsagePerUser: formData.maxUsagePerUser ? Number(formData.maxUsagePerUser) : null,
    };

    const result = VoucherFormSchema.safeParse(cleanedData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSave?.(cleanedData as VoucherFormData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[800px] p-5 lg:p-10">
      <div className="flex flex-col gap-2 mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          {isEditMode ? "Edit Voucher" : "Add New Voucher"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isEditMode ? "Update the voucher information." : "Fill in the details to create a new voucher."}
        </p>
      </div>

      <form className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto pr-2" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label>Voucher Code <span className="text-error-500">*</span></Label>
            <Input 
              type="text" 
              placeholder="e.g. SUMMER2026" 
              defaultValue={formData.voucherCode}
              onChange={(e) => setFormData({...formData, voucherCode: e.target.value.toUpperCase()})}
              error={!!errors.voucherCode}
              hint={errors.voucherCode}
            />
          </div>
          <div>
            <Label>Voucher Name <span className="text-error-500">*</span></Label>
            <Input 
              type="text" 
              placeholder="e.g. Summer Sale Discount" 
              defaultValue={formData.voucherName}
              onChange={(e) => setFormData({...formData, voucherName: e.target.value})}
              error={!!errors.voucherName}
              hint={errors.voucherName}
            />
          </div>
        </div>

        <div>
          <Label>Description</Label>
          <TextArea 
            placeholder="Enter description here..." 
            value={formData.voucherDescription}
            onChange={(val) => setFormData({...formData, voucherDescription: val})}
            error={!!errors.voucherDescription}
            hint={errors.voucherDescription}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label>Discount Type</Label>
            {isOpen && (
              <Select
                options={[
                  { value: "PERCENTAGE", label: "Percentage (%)" },
                  { value: "FIXED_AMOUNT", label: "Fixed Amount (VND)" },
                ]}
                onChange={(v) => setFormData({...formData, discountType: v})}
                defaultValue={formData.discountType}
              />
            )}
          </div>
          <div>
            <Label>Discount Value <span className="text-error-500">*</span></Label>
            <Input 
              type="number" 
              placeholder="Value" 
              defaultValue={formData.discountValue}
              onChange={(e) => setFormData({...formData, discountValue: Number(e.target.value)})}
              error={!!errors.discountValue}
              hint={errors.discountValue}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label>Max Discount Cap (VND)</Label>
            <Input 
              type="number" 
              placeholder="Limit discount up to..." 
              defaultValue={formData.maxDiscountCap ?? ""}
              onChange={(e) => setFormData({...formData, maxDiscountCap: e.target.value ? Number(e.target.value) : null})}
              error={!!errors.maxDiscountCap}
              hint={errors.maxDiscountCap}
            />
          </div>
          <div>
            <Label>Min Order Amount (VND)</Label>
            <Input 
              type="number" 
              placeholder="Minimum cart value" 
              defaultValue={formData.minOrderAmount ?? ""}
              onChange={(e) => setFormData({...formData, minOrderAmount: e.target.value ? Number(e.target.value) : null})}
              error={!!errors.minOrderAmount}
              hint={errors.minOrderAmount}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label>Discount Target</Label>
            {isOpen && (
              <Select
                options={[
                  { value: "ORDER", label: "Entire Order" },
                  { value: "SHIPPING", label: "Shipping Fee" },
                  { value: "PRODUCT", label: "Specific Products" },
                ]}
                onChange={(v) => setFormData({...formData, discountTarget: v})}
                defaultValue={formData.discountTarget}
              />
            )}
          </div>
          <div>
            <Label>Status</Label>
            {isOpen && (
              <Select
                options={[
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                  { value: "Scheduled", label: "Scheduled" },
                ]}
                onChange={(v) => setFormData({...formData, status: v})}
                defaultValue={formData.status}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label>Total Quantity limit</Label>
            <Input 
              type="number" 
              placeholder="Leave blank for unlimited" 
              defaultValue={formData.totalQuantity ?? ""}
              onChange={(e) => setFormData({...formData, totalQuantity: e.target.value ? Number(e.target.value) : null})}
              error={!!errors.totalQuantity}
              hint={errors.totalQuantity}
            />
          </div>
          <div>
            <Label>Max Usage Per User</Label>
            <Input 
              type="number" 
              placeholder="e.g. 1" 
              defaultValue={formData.maxUsagePerUser ?? ""}
              onChange={(e) => setFormData({...formData, maxUsagePerUser: e.target.value ? Number(e.target.value) : null})}
              error={!!errors.maxUsagePerUser}
              hint={errors.maxUsagePerUser}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label>Start Date <span className="text-error-500">*</span></Label>
            <Input 
              type="datetime-local" 
              defaultValue={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              error={!!errors.startDate}
              hint={errors.startDate}
            />
          </div>
          <div>
            <Label>End Date <span className="text-error-500">*</span></Label>
            <Input 
              type="datetime-local" 
              defaultValue={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              error={!!errors.endDate}
              hint={errors.endDate}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.05]">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : (isEditMode ? "Save Changes" : "Save Voucher")}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
