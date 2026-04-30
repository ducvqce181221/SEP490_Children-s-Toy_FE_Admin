import { useState } from "react";
import { VoucherFormData } from "../types/voucher";
import { voucherApi } from "../services/voucher-api";
import toast from "react-hot-toast";

export const useVoucherMutations = (onSuccess?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createVoucher = async (data: VoucherFormData) => {
    setIsSubmitting(true);
    try {
      await voucherApi.createVoucher(data);
      toast.success("Tạo voucher thành công");
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tạo voucher thất bại");
      if (process.env.NODE_ENV === "development") {
        console.error("[useVoucherMutations.createVoucher]", error);
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateVoucher = async (id: number, data: VoucherFormData) => {
    setIsSubmitting(true);
    try {
      await voucherApi.updateVoucher(id, data);
      toast.success("Cập nhật voucher thành công");
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cập nhật thất bại");
      if (process.env.NODE_ENV === "development") {
        console.error("[useVoucherMutations.updateVoucher]", error);
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
      toast.success("Xoá voucher thành công");
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xoá thất bại");
      if (process.env.NODE_ENV === "development") {
        console.error("[useVoucherMutations.deleteVoucher]", error);
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { createVoucher, updateVoucher, deleteVoucher, isSubmitting };
};
