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
    "RefundDamage",
    "RefundReturnShipmentCreated",
    "RefundReturningToCustomer",
    "RefundReturnedToCustomer",
    "RefundReturnToCustomerFailed",
  ]),
  rejectReason: z.string().optional(),
  adminNote: z.string().optional(),
  inspectionPassed: z.boolean().optional(),
  inspectionNote: z.string().optional(),
  // Approve step: bên chịu phí ship hoàn trả
  returnShippingFeeBy: z.enum(["Store", "Customer"]).optional(),
  returnShippingFeeNote: z.string().optional(),
  // InspectionPending (Merchandise đề xuất) / Complete (Staff xác nhận)
  damageResponsibility: z.enum(["Customer", "Carrier"]).optional(),
}).superRefine((data, ctx) => {
  if (data.status === "RefundRejected" && (!data.rejectReason || !data.rejectReason.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please enter rejection reason",
      path: ["rejectReason"],
    });
  }
});

export type UpdateRefundStatusData = z.infer<typeof UpdateRefundStatusSchema>;
