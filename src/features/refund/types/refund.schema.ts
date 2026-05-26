import { z } from "zod";

export const UpdateRefundStatusSchema = z.object({
  status: z.enum([
    "RefundRequested",
    "RefundApproved",
    "RefundRejected",
    "RefundPickupCreated",
    "RefundShipping",
    "RefundReceived",
    "RefundInspectionPending",
    "RefundCompleted",
    "RefundCancelled",
  ]),
  rejectReason: z.string().optional(),
  shippingOrderCode: z.string().optional(),
  adminNote: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.status === "RefundRejected" && (!data.rejectReason || !data.rejectReason.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please enter rejection reason",
      path: ["rejectReason"],
    });
  }
  if (data.status === "RefundPickupCreated" && data.shippingOrderCode && data.shippingOrderCode.trim()) {
    if (!/^[A-Z0-9]{5,20}$/.test(data.shippingOrderCode.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tracking code must be uppercase alphanumeric (5-20 characters, no spaces/special symbols)",
        path: ["shippingOrderCode"],
      });
    }
  }
});

export type UpdateRefundStatusData = z.infer<typeof UpdateRefundStatusSchema>;
