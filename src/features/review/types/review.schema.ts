import { z } from "zod";

export const UpdateReviewStatusSchema = z.object({
  moderationStatus: z.enum(["Approved", "Pending", "Rejected", "ManualReview"]).optional().nullable(),
  reason: z.string().optional().nullable(),
  isDeleted: z.boolean().optional(),
});

export type UpdateReviewStatusData = z.infer<typeof UpdateReviewStatusSchema>;

export const ReviewReplySchema = z.object({
  content: z
    .string()
    .min(1, "Content cannot be empty")
    .max(1000, "Content cannot exceed 1000 characters"),
});

export type ReviewReplyData = z.infer<typeof ReviewReplySchema>;
