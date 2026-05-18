import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
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
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Confirm Order</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          The order will be moved to <strong>Confirmed</strong> and you will be assigned as the person in charge.
        </p>
      </div>

      <div className="mb-6">
        <Label htmlFor="confirm-note">Note (Optional)</Label>
        <TextArea
          id="confirm-note"
          className="mt-2"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Enter note (if any)..."
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Close
        </Button>
        <Button variant="primary" onClick={() => onConfirm(note)} disabled={isSubmitting}>
          {isSubmitting ? "Processing..." : "Confirm Order"}
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
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Start Preparation</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          The order will be moved to <strong>Processing</strong> and you will be assigned as the person in charge.
        </p>
      </div>

      <div className="mb-6">
        <Label htmlFor="process-note">Note (Optional)</Label>
        <TextArea
          id="process-note"
          className="mt-2"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Enter note (if any)..."
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Close
        </Button>
        <Button variant="primary" onClick={() => onProcess(note)} disabled={isSubmitting}>
          {isSubmitting ? "Processing..." : "Start Preparation"}
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
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Create Waybill</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          The order will be moved to <strong>Shipped</strong>. If the shipping API fails, the entire action will be rolled back.
        </p>
      </div>

      <form onSubmit={handleSubmit((data) => onShip(data))} className="space-y-4">
        <div>
          <Label htmlFor="provider">Carrier</Label>
          <select
            id="provider"
            {...register("provider")}
            className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          >
            <option value="GHN">Giao Hàng Nhanh (GHN)</option>
            {/* Add more carriers if needed */}
          </select>
          {errors.provider && (
            <p className="mt-1 text-sm text-error-500">{errors.provider.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="serviceType">Service Type (Optional)</Label>
          <Input
            id="serviceType"
            {...register("serviceType")}
            placeholder="Service code (leave empty for default)"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="ship-note">Note (Optional)</Label>
          <TextArea
            id="ship-note"
            className="mt-2"
            {...register("note")}
            rows={3}
            placeholder="Example: Inspectable, no try-on..."
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Waybill"}
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
          Cancel Order
        </h2>
        <p className="mt-2 text-sm text-error-500 dark:text-error-400">
          Are you sure you want to cancel this order? This action cannot be undone.
        </p>
      </div>

      <form onSubmit={handleSubmit((data) => onCancel(data))}>
        <div className="mb-6">
          <Label htmlFor="cancel-reason">Reason for Cancellation (Required)</Label>
          <TextArea
            id="cancel-reason"
            className="mt-2"
            {...register("reason")}
            rows={3}
            placeholder="Enter reason for cancellation..."
            error={!!errors.reason}
            hint={errors.reason?.message}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Close
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
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
          Reassign Order
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Admin assigns a staff member to handle this order.
        </p>
      </div>

      <form onSubmit={handleSubmit((data: any) => onAssign(data as AssignOrderFormData))} className="space-y-4">
        <div>
          <Label htmlFor="staff-search">Search Staff (Name, Phone...)</Label>
          <Input
            id="staff-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type to search staff..."
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="targetAccountId">Select Staff {isLoadingStaffs && "(Loading...)"}</Label>
          <select
            id="targetAccountId"
            {...register("targetAccountId")}
            className={`mt-2 h-11 w-full rounded-lg border ${
              errors.targetAccountId ? "border-error-500" : "border-gray-300 dark:border-gray-700"
            } bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`}
          >
            <option value="0" disabled>-- Please select a staff member --</option>
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
          <Label htmlFor="assign-note">Note (Optional)</Label>
          <TextArea
            id="assign-note"
            className="mt-2"
            {...register("note")}
            rows={3}
            placeholder="Example: High priority..."
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Assigning..." : "Confirm Assignment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
