import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import {
  CancelOrderFormData,
  cancelOrderSchema,
  ShipOrderFormData,
  shipOrderSchema,
  AssignOrderFormData,
  assignOrderSchema,
} from "../types/order.schema";
import { accountApi } from "@/features/account/services/account-api";
import { AccountListItem } from "@/features/account/types/account";
import { ORDER_STATUS, ROLE_NAME } from "../types/order";
import { useAuthContext } from "@/context/AuthContext";

// ── Shared Modal Props ──────────────────────────────────────────────────────
interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
}

// ── Confirm Modal ───────────────────────────────────────────────────────────
interface ConfirmModalProps extends ActionModalProps {
  onConfirm: (note?: string) => void;
}

export const OrderConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  isSubmitting,
  onConfirm,
}) => {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (isOpen) setNote("");
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-5 lg:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Xác nhận đơn hàng</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Đơn sẽ chuyển sang <strong>Đã xác nhận</strong> và bạn sẽ được gán là người phụ trách.
        </p>
      </div>

      <div className="mb-6">
        <Label htmlFor="confirm-note">Ghi chú (không bắt buộc)</Label>
        <textarea
          id="confirm-note"
          className="mt-2 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nhập ghi chú (nếu có)..."
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Đóng
        </Button>
        <Button variant="primary" onClick={() => onConfirm(note)} disabled={isSubmitting}>
          {isSubmitting ? "Đang xử lý..." : "Xác nhận đơn"}
        </Button>
      </div>
    </Modal>
  );
};

// ── Process Modal ───────────────────────────────────────────────────────────
interface ProcessModalProps extends ActionModalProps {
  onProcess: (note?: string) => void;
}

export const OrderProcessModal: React.FC<ProcessModalProps> = ({
  isOpen,
  onClose,
  isSubmitting,
  onProcess,
}) => {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (isOpen) setNote("");
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-5 lg:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Bắt đầu chuẩn bị hàng</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Đơn sẽ chuyển sang <strong>Đang chuẩn bị</strong> và bạn sẽ được gán là người phụ trách.
        </p>
      </div>

      <div className="mb-6">
        <Label htmlFor="process-note">Ghi chú (không bắt buộc)</Label>
        <textarea
          id="process-note"
          className="mt-2 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nhập ghi chú (nếu có)..."
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Đóng
        </Button>
        <Button variant="primary" onClick={() => onProcess(note)} disabled={isSubmitting}>
          {isSubmitting ? "Đang xử lý..." : "Bắt đầu chuẩn bị"}
        </Button>
      </div>
    </Modal>
  );
};

// ── Ship Modal ──────────────────────────────────────────────────────────────
interface ShipModalProps extends ActionModalProps {
  onShip: (data: ShipOrderFormData) => void;
}

export const OrderShipModal: React.FC<ShipModalProps> = ({
  isOpen,
  onClose,
  isSubmitting,
  onShip,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShipOrderFormData>({
    resolver: zodResolver(shipOrderSchema),
    defaultValues: {
      provider: "GHN", // mặc định Giao Hàng Nhanh
    },
  });

  useEffect(() => {
    if (isOpen) reset({ provider: "GHN", serviceType: "", note: "" });
  }, [isOpen, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-5 lg:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Tạo vận đơn</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Đơn sẽ chuyển sang <strong>Đã giao vận</strong>. Nếu API vận chuyển lỗi, toàn bộ thao tác sẽ được hoàn tác (rollback).
        </p>
      </div>

      <form onSubmit={handleSubmit((data) => onShip(data))} className="space-y-4">
        <div>
          <Label htmlFor="provider">Đơn vị vận chuyển</Label>
          <select
            id="provider"
            {...register("provider")}
            className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          >
            <option value="GHN">Giao Hàng Nhanh (GHN)</option>
            {/* Nếu có thêm GHTK thì thêm vào đây */}
          </select>
          {errors.provider && (
            <p className="mt-1 text-sm text-error-500">{errors.provider.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="serviceType">Gói cước (Service Type) - Không bắt buộc</Label>
          <Input
            id="serviceType"
            {...register("serviceType")}
            placeholder="Mã gói cước (nếu để trống sẽ dùng mặc định)"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="ship-note">Ghi chú (không bắt buộc)</Label>
          <textarea
            id="ship-note"
            {...register("note")}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            rows={3}
            placeholder="Ví dụ: Cho xem hàng, không thử..."
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Đang tạo đơn..." : "Tạo đơn Ship"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ── Cancel Modal ────────────────────────────────────────────────────────────
interface CancelModalProps extends ActionModalProps {
  onCancel: (data: CancelOrderFormData) => void;
}

export const OrderCancelModal: React.FC<CancelModalProps> = ({
  isOpen,
  onClose,
  isSubmitting,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CancelOrderFormData>({
    resolver: zodResolver(cancelOrderSchema),
  });

  useEffect(() => {
    if (isOpen) reset({ reason: "" });
  }, [isOpen, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-5 lg:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          Hủy đơn hàng
        </h2>
        <p className="mt-2 text-sm text-error-500 dark:text-error-400">
          Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.
        </p>
      </div>

      <form onSubmit={handleSubmit((data) => onCancel(data))}>
        <div className="mb-6">
          <Label htmlFor="cancel-reason">Lý do hủy (bắt buộc)</Label>
          <textarea
            id="cancel-reason"
            {...register("reason")}
            className={`mt-2 w-full rounded-lg border ${
              errors.reason ? "border-error-500" : "border-gray-300 dark:border-gray-700"
            } bg-transparent px-4 py-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90`}
            rows={3}
            placeholder="Nhập lý do hủy đơn..."
          />
          {errors.reason && (
            <p className="mt-1 text-sm text-error-500">{errors.reason.message}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Đóng
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Đang hủy..." : "Xác nhận hủy"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ── Assign Modal ────────────────────────────────────────────────────────────
interface AssignModalProps extends ActionModalProps {
  onAssign: (data: AssignOrderFormData) => void;
  currentStatusName: string; // Truyền vào để biết nên load Staff hay Merchandise
}

export const OrderAssignModal: React.FC<AssignModalProps> = ({
  isOpen,
  onClose,
  isSubmitting,
  onAssign,
  currentStatusName,
}) => {
  const [staffs, setStaffs] = useState<AccountListItem[]>([]);
  const [isLoadingStaffs, setIsLoadingStaffs] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignOrderFormData>({
    resolver: zodResolver(assignOrderSchema) as any,
  });

  useEffect(() => {
    if (isOpen) {
      reset({ targetAccountId: 0, note: "" });
      setSearchTerm("");
    }
  }, [isOpen, reset]);

  useEffect(() => {
    if (!isOpen) return;
    
    // RoleId theo DB: Staff = 3, Merchandise = 4
    // Pending → Staff nhận đơn; Confirmed/Processing/Shipped → Merchandise nhận
    let targetRoleId = 3; // Default: Staff
    if (
      currentStatusName === ORDER_STATUS.CONFIRMED ||
      currentStatusName === ORDER_STATUS.PROCESSING ||
      currentStatusName === ORDER_STATUS.SHIPPED
    ) {
      targetRoleId = 4; // Merchandise
    }

    const fetchStaffs = async () => {
      setIsLoadingStaffs(true);
      try {
        const res = await accountApi.getAccounts({
          pageNumber: 1,
          pageSize: 50,
          roleId: targetRoleId,
          searchTerm: searchTerm.length >= 2 ? searchTerm : undefined,
        });
        setStaffs(res.items);
      } catch (err) {
        console.error("Failed to load staffs", err);
      } finally {
        setIsLoadingStaffs(false);
      }
    };

    const debounceId = setTimeout(fetchStaffs, 300);
    return () => clearTimeout(debounceId);
  }, [isOpen, searchTerm, currentStatusName]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-5 lg:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          Phân công lại (Assign)
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Admin chỉ định nhân viên xử lý đơn hàng này.
        </p>
      </div>

      <form onSubmit={handleSubmit((data: any) => onAssign(data as AssignOrderFormData))} className="space-y-4">
        <div>
          <Label htmlFor="staff-search">Tìm nhân viên (tên, sđt...)</Label>
          <Input
            id="staff-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Gõ để tìm kiếm nhân viên..."
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="targetAccountId">Chọn nhân viên {isLoadingStaffs && "(Đang tải...)"}</Label>
          <select
            id="targetAccountId"
            {...register("targetAccountId")}
            className={`mt-2 h-11 w-full rounded-lg border ${
              errors.targetAccountId ? "border-error-500" : "border-gray-300 dark:border-gray-700"
            } bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`}
          >
            <option value="0" disabled>-- Vui lòng chọn nhân viên --</option>
            {staffs.map((staff) => (
              <option key={staff.accountId} value={staff.accountId}>
                {staff.accountName} - {staff.email}
              </option>
            ))}
          </select>
          {errors.targetAccountId && (
            <p className="mt-1 text-sm text-error-500">{errors.targetAccountId.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="assign-note">Ghi chú (không bắt buộc)</Label>
          <textarea
            id="assign-note"
            {...register("note")}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            rows={3}
            placeholder="Ví dụ: Ưu tiên xử lý gấp..."
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Đang phân công..." : "Xác nhận phân công"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
