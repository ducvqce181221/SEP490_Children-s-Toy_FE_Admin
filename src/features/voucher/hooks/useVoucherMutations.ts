import { useState } from "react";
import { VoucherFormData } from "../types/voucher";
import { voucherApi } from "../services/voucher-api";
import toast from "react-hot-toast";
import { getVoucherMutationErrorMessage } from "../utils/voucher-errors";

export const useVoucherMutations = (onSuccess?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createVoucher = async (data: VoucherFormData) => {
    setIsSubmitting(true);
    try {
      await voucherApi.createVoucher(data);
      toast.success("Voucher created successfully");
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(getVoucherMutationErrorMessage(error, "Failed to create voucher"));
      if (process.env.NODE_ENV === "development") {
        console.error("[useVoucherMutations.createVoucher]", error);
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateVoucher = async (id: number, data: Partial<VoucherFormData & { isDeleted?: boolean, reason?: string | null }>) => {
    setIsSubmitting(true);
    try {
      await voucherApi.updateVoucher(id, data);
      toast.success("Voucher updated successfully");
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(getVoucherMutationErrorMessage(error, "Update failed"));
      if (process.env.NODE_ENV === "development") {
        console.error("[useVoucherMutations.updateVoucher]", error);
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const approveVoucher = async (id: number) => {
    setIsSubmitting(true);
    try {
      await voucherApi.updateVoucher(id, { status: "Scheduled" });
      toast.success("Voucher approved successfully");
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(getVoucherMutationErrorMessage(error, "Approval failed"));
      if (process.env.NODE_ENV === "development") {
        console.error("[useVoucherMutations.approveVoucher]", error);
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const rejectVoucher = async (id: number, reason: string) => {
    setIsSubmitting(true);
    try {
      await voucherApi.updateVoucher(id, { status: "Rejected", reason });
      toast.success("Voucher rejected successfully");
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(getVoucherMutationErrorMessage(error, "Rejection failed"));
      if (process.env.NODE_ENV === "development") {
        console.error("[useVoucherMutations.rejectVoucher]", error);
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteVoucher = async (id: number) => {
    setIsSubmitting(true);
    try {
      await voucherApi.updateVoucher(id, { isDeleted: true });
      toast.success("Voucher deleted successfully");
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(getVoucherMutationErrorMessage(error, "Deletion failed"));
      if (process.env.NODE_ENV === "development") {
        console.error("[useVoucherMutations.deleteVoucher]", error);
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createVoucher, updateVoucher, deleteVoucher, approveVoucher, rejectVoucher, isSubmitting };
};

