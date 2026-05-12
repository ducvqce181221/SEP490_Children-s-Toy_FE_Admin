import { z } from "zod";

export const UpdateRefundStatusSchema = z.object({
  status: z.enum(["Approved", "Rejected", "Completed"]),
  rejectReason: z.string().optional(),
}).refine(data => {
  if (data.status === "Rejected" && (!data.rejectReason || data.rejectReason.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Vui lòng nhập lý do từ chối",
  path: ["rejectReason"],
});

export type UpdateRefundStatusData = z.infer<typeof UpdateRefundStatusSchema>;
