import { z } from "zod";

export const UpdateReviewStatusSchema = z.object({
  moderationStatus: z.enum(["Approved", "Pending", "Rejected", "ManualReview"]).nullable().optional(),
  reason: z.string().nullable().optional(),
  isDeleted: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.moderationStatus === "Rejected" && (!data.reason || data.reason.trim() === "")) {
      return false;
    }
    return true;
  },
  {
    message: "Reason is required when status is Rejected.",
    path: ["reason"],
  }
).refine(
  (data) => {
    if (data.reason && data.reason.length > 500) {
      return false;
    }
    return true;
  },
  {
    message: "Reason must not exceed 500 characters.",
    path: ["reason"],
  }
);

export type UpdateReviewStatusData = z.infer<typeof UpdateReviewStatusSchema>;

export const ReviewReplySchema = z.object({
  content: z
    .string()
    .min(1, "Content cannot be empty")
    .max(1000, "Content cannot exceed 1000 characters"),
});

export type ReviewReplyData = z.infer<typeof ReviewReplySchema>;
