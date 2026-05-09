import { z } from "zod";

export const UpdateReviewStatusSchema = z.object({
  moderationStatus: z.enum(["Approved", "Pending", "Rejected", "ManualReview"]),
  reason: z.string().optional(),
});

export type UpdateReviewStatusData = z.infer<typeof UpdateReviewStatusSchema>;

export const ReviewReplySchema = z.object({
  content: z
    .string()
    .min(1, "Nội dung không được để trống")
    .max(1000, "Nội dung không được vượt quá 1000 ký tự"),
});

export type ReviewReplyData = z.infer<typeof ReviewReplySchema>;
