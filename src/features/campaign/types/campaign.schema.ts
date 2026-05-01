import { z } from "zod";

export const CampaignFormSchema = z
  .object({
    campaignName: z
      .string()
      .min(3, "Campaign name must be at least 3 characters.")
      .max(255, "Campaign name must not exceed 255 characters."),

    templateCode: z
      .string()
      .max(50, "Template code must not exceed 50 characters.")
      .regex(
        /^[A-Za-z0-9_]+$/,
        "Template code can only contain letters, numbers, and underscores."
      )
      .optional()
      .nullable()
      .or(z.literal("")),

    referenceType: z
      .string()
      .optional()
      .nullable()
      .or(z.literal("")),

    referenceId: z
      .union([z.string(), z.number()])
      .optional()
      .nullable()
      .transform((val) => (val === "" || val == null ? null : Number(val)))
      .refine((val) => val === null || (!isNaN(val) && val > 0), {
        message: "Reference ID must be a positive number.",
      }),

    titleOverride: z
      .string()
      .max(255, "Title override must not exceed 255 characters.")
      .optional()
      .nullable(),

    messageOverride: z
      .string()
      .max(500, "Message must not exceed 500 characters.")
      .optional()
      .nullable(),

    sourceType: z.enum(["ADMIN", "SYSTEM"] as const),

    targetType: z.enum(["ALL", "SEGMENT", "ROLE", "INDIVIDUAL"] as const),

    scheduledAt: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (!val) return true;
          return new Date(val) > new Date();
        },
        { message: "Scheduled time must not be in the past." }
      ),

    eventKey: z
      .string()
      .max(100, "Event key must not exceed 100 characters.")
      .optional()
      .nullable(),

    imageUrl: z
      .string()
      .max(500, "Image URL must not exceed 500 characters.")
      .refine(
        (val) => !val || val === "" || /^https?:\/\/.+/.test(val),
        { message: "Image URL must be a valid URL." }
      )
      .optional()
      .nullable()
      .or(z.literal("")),

    actionType: z
      .string()
      .max(20, "Action type must not exceed 20 characters.")
      .optional()
      .nullable(),

    actionTarget: z
      .string()
      .max(500, "Action target must not exceed 500 characters.")
      .optional()
      .nullable(),

    createdByAccountId: z.number().int().positive(),

    targets: z
      .array(
        z.object({
          targetType: z.enum(["ACCOUNT_ID", "ROLE", "SEGMENT"] as const),
          targetValue: z
            .string()
            .min(1, "Target value is required.")
            .max(200, "Target value must not exceed 200 characters."),
        })
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    // When TargetType = SEGMENT: at least 1 target required
    if (data.targetType === "SEGMENT" && (!data.targets || data.targets.length === 0)) {
      ctx.addIssue({
        code: "custom",
        message: "At least one target is required when Target Type is SEGMENT.",
        path: ["targets"],
      });
    }
    // When TargetType = ALL: targets must be empty
    if (data.targetType === "ALL" && data.targets && data.targets.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: "Targets must be empty when Target Type is ALL.",
        path: ["targets"],
      });
    }
  });

// Use the inferred type as the form data type — keeps schema and type in sync
export type CampaignFormData = z.infer<typeof CampaignFormSchema>;
