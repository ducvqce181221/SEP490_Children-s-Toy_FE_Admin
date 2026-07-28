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
  ConfirmOrderFormData,
  confirmOrderSchema,
  ProcessOrderFormData,
  processOrderSchema,
} from "../types/order.schema";
import { scheduleApi } from "@/features/schedule/services/schedule-api";
import { WorkSchedule } from "@/features/schedule/types/schedule";
import { ORDER_STATUS, ROLE_NAME } from "../types/order";
import { todayVnDateString } from "@/utils/date-utils";
import { useAuthContext } from "@/context/AuthContext";

// ── Shared Modal Props ──────────────────────────────────────────────────────
interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
}

// ── Confirm Modal ───────────────────────────────────────────────────────────
interface ConfirmModalProps extends ActionModalProps {
  onConfirm: (data: ConfirmOrderFormData) => void;
}

export const OrderConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  isSubmitting,
  onConfirm,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ConfirmOrderFormData>({
    resolver: zodResolver(confirmOrderSchema),
    defaultValues: { note: "" },
  });

  const noteValue = watch("note") || "";

  useEffect(() => {
    if (isOpen) reset({ note: "" });
  }, [isOpen, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-5 lg:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Confirm Order</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          The order will be moved to <strong>Confirmed</strong> and you will be assigned as the person in charge.
        </p>
      </div>

      <form onSubmit={handleSubmit((data) => onConfirm(data))}>
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <Label htmlFor="confirm-note">Note (Optional)</Label>
            <span className={`text-xs font-medium ${noteValue.length > 400 ? "text-error-500 font-bold" : "text-gray-400 dark:text-gray-500"}`}>
              {noteValue.length}/400
            </span>
          </div>
          <TextArea
            id="confirm-note"
            className="mt-2"
            maxLength={400}
            {...register("note")}
            rows={3}
            placeholder="Enter note (if any)..."
            error={!!errors.note}
            hint={errors.note?.message}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Close
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Confirm Order"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ── Process Modal ───────────────────────────────────────────────────────────
interface ProcessModalProps extends ActionModalProps {
  onProcess: (data: ProcessOrderFormData) => void;
}

export const OrderProcessModal: React.FC<ProcessModalProps> = ({
  isOpen,
  onClose,
  isSubmitting,
  onProcess,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProcessOrderFormData>({
    resolver: zodResolver(processOrderSchema),
    defaultValues: { note: "" },
  });

  const noteValue = watch("note") || "";

  useEffect(() => {
    if (isOpen) reset({ note: "" });
  }, [isOpen, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-5 lg:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Start Preparation</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          The order will be moved to <strong>Processing</strong> and you will be assigned as the person in charge.
        </p>
      </div>

      <form onSubmit={handleSubmit((data) => onProcess(data))}>
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <Label htmlFor="process-note">Note (Optional)</Label>
            <span className={`text-xs font-medium ${noteValue.length > 400 ? "text-error-500 font-bold" : "text-gray-400 dark:text-gray-500"}`}>
              {noteValue.length}/400
            </span>
          </div>
          <TextArea
            id="process-note"
            className="mt-2"
            maxLength={400}
            {...register("note")}
            rows={3}
            placeholder="Enter note (if any)..."
            error={!!errors.note}
            hint={errors.note?.message}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Close
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Start Preparation"}
          </Button>
        </div>
      </form>
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
    watch,
    formState: { errors },
  } = useForm<ShipOrderFormData>({
    resolver: zodResolver(shipOrderSchema),
    defaultValues: {
      provider: "GHN", // mặc định Giao Hàng Nhanh
    },
  });

  const noteValue = watch("note") || "";

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
          <Label>Carrier</Label>
          <div className="mt-2 flex h-11 w-full items-center rounded-lg border border-gray-300 bg-gray-50 px-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
            GHN (Giao Hang Nhanh)
          </div>
          <input type="hidden" {...register("provider")} />
        </div>

        <div>
          <div className="flex justify-between items-center">
            <Label htmlFor="ship-note">Note (Optional)</Label>
            <span className={`text-xs font-medium ${noteValue.length > 400 ? "text-error-500 font-bold" : "text-gray-400 dark:text-gray-500"}`}>
              {noteValue.length}/400
            </span>
          </div>
          <TextArea
            id="ship-note"
            className="mt-2"
            maxLength={400}
            {...register("note")}
            rows={3}
            placeholder="Example: Inspectable, no try-on..."
            error={!!errors.note}
            hint={errors.note?.message}
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
    watch,
    formState: { errors },
  } = useForm<CancelOrderFormData>({
    resolver: zodResolver(cancelOrderSchema),
    defaultValues: { reason: "" },
  });

  const reasonValue = watch("reason") || "";

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
          <div className="flex justify-between items-center">
            <Label htmlFor="cancel-reason">Reason for Cancellation (Required)</Label>
            <span className={`text-xs font-medium ${reasonValue.length > 400 ? "text-error-500 font-bold" : "text-gray-400 dark:text-gray-500"}`}>
              {reasonValue.length}/400
            </span>
          </div>
          <TextArea
            id="cancel-reason"
            className="mt-2"
            maxLength={400}
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
  currentStatusName?: string; // Truyền vào để biết nên load Staff hay Merchandise
  targetRoleId?: number;
  title?: string;
  description?: string;
}

export const OrderAssignModal: React.FC<AssignModalProps> = ({
  isOpen,
  onClose,
  isSubmitting,
  onAssign,
  currentStatusName,
  targetRoleId: targetRoleIdProp,
  title,
  description,
}) => {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [targetRoleId, setTargetRoleId] = useState(3);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AssignOrderFormData>({
    resolver: zodResolver(assignOrderSchema) as any,
    defaultValues: { targetScheduleId: 0, roleId: 3, note: "" },
  });

  const noteValue = watch("note") || "";

  useEffect(() => {
    if (isOpen) {
      reset({ targetScheduleId: 0, roleId: 3, note: "" });
    }
  }, [isOpen, reset]);

  useEffect(() => {
    if (!isOpen) return;

    let roleId = targetRoleIdProp !== undefined ? targetRoleIdProp : 3;
    if (targetRoleIdProp === undefined && currentStatusName) {
      if (
        currentStatusName === ORDER_STATUS.CONFIRMED ||
        currentStatusName === ORDER_STATUS.PROCESSING ||
        currentStatusName === ORDER_STATUS.DELIVERY_FAILED
      ) {
        roleId = 4;
      } else if (
        currentStatusName === ORDER_STATUS.SHIPPED ||
        currentStatusName === ORDER_STATUS.DELIVERING ||
        currentStatusName === ORDER_STATUS.DELIVERED
      ) {
        roleId = 4;
      }
    }

    setTargetRoleId(roleId);
    setValue("roleId", roleId);

    const fetchSchedules = async () => {
      setIsLoadingSchedules(true);
      try {
        const res = await scheduleApi.getWorkSchedules({
          workDate: todayVnDateString(),
          status: "OnDuty",
          roleId,
        });
        setSchedules(res);
      } catch (err) {
        console.error("Failed to load schedules", err);
      } finally {
        setIsLoadingSchedules(false);
      }
    };

    fetchSchedules();
  }, [isOpen, currentStatusName, targetRoleIdProp, setValue]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-5 lg:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          {title || "Reassign Order"}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {description || `Admin reassigns the ${targetRoleId === 3 ? "Staff" : "Merchandise"} slot using an on-duty schedule.`}
        </p>
      </div>

      <form onSubmit={handleSubmit((data: any) => onAssign(data as AssignOrderFormData))} className="space-y-4">
        <input type="hidden" {...register("roleId")} />

        <div>
          <Label htmlFor="targetScheduleId">
            Select {targetRoleId === 3 ? "Staff" : "Merchandise"} schedule{" "}
            {isLoadingSchedules && "(Loading...)"}
          </Label>
          <select
            id="targetScheduleId"
            {...register("targetScheduleId")}
            className={`mt-2 h-11 w-full rounded-lg border ${errors.targetScheduleId ? "border-error-500" : "border-gray-300 dark:border-gray-700"
              } bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`}
          >
            {schedules.length === 0 ? (
              <option value="0" disabled>-- No on-duty schedules --</option>
            ) : (
              <>
                <option value="0" disabled>-- Select schedule --</option>
                {schedules.map((schedule) => (
                  <option key={schedule.scheduleId} value={schedule.scheduleId}>
                    {schedule.accountName} (Shift: {schedule.shiftName}, Load: {schedule.currentLoad}/{schedule.maxLoad})
                  </option>
                ))}
              </>
            )}
          </select>
          {errors.targetScheduleId && (
            <p className="mt-1 text-sm text-error-500">{errors.targetScheduleId.message}</p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center">
            <Label htmlFor="assign-note">Note (Optional)</Label>
            <span className={`text-xs font-medium ${noteValue.length > 400 ? "text-error-500 font-bold" : "text-gray-400 dark:text-gray-500"}`}>
              {noteValue.length}/400
            </span>
          </div>
          <TextArea
            id="assign-note"
            className="mt-2"
            maxLength={400}
            {...register("note")}
            rows={3}
            placeholder="Example: High priority..."
            error={!!errors.note}
            hint={errors.note?.message}
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
