import { z } from "zod";
import { getMinimumFutureTime } from "@/utils/date-utils";

// ─── productPromotionSchema — dùng cho DISCOUNT ───────────────────────────────
export const productPromotionSchema = z.object({
  productId: z.number(),
  productName: z.string().optional(),
  originalPrice: z.number().optional(),
  stock: z.number().optional(),
  salePrice: z.preprocess(
    (val) => (val === "" || val === undefined || (typeof val === "number" && isNaN(val)) ? null : val),
    z.number().min(0, "Sale price must be at least 0")
  ),
  discountPercent: z.preprocess(
    (val) => (val === "" || val === undefined || (typeof val === "number" && isNaN(val)) ? null : val),
    z.number()
      .min(1, "Discount must be at least 1%")
      .max(99, "Discount must be at most 99%")
      .nullable()
  ),
  saleQuantity: z.preprocess(
    (val) => (val === "" || val === undefined || (typeof val === "number" && isNaN(val)) ? null : val),
    z.number().min(1, "Quantity must be greater than 0").nullable()
  ),
}).refine(data => {
  if (data.originalPrice !== undefined) {
    return data.salePrice <= data.originalPrice;
  }
  return true;
}, {
  message: "Sale price must be less than or equal to original price",
  path: ["salePrice"]
}).refine(data => {
  if (data.saleQuantity !== null && data.saleQuantity !== undefined && data.stock !== undefined) {
    return data.saleQuantity <= data.stock;
  }
  return true;
}, {
  message: "Quantity cannot exceed available quantity",
  path: ["saleQuantity"]
});

// ─── promotionProductSlotSchema — dùng cho FLASH_SALE (per-slot product) ─────
export const promotionProductSlotSchema = z.object({
  productId: z.number().min(1, "Product is required"),
  productName: z.string().optional(),
  originalPrice: z.number().optional(),
  stock: z.number().optional(),
  salePrice: z.preprocess(
    (val) => (val === "" || val === undefined || (typeof val === "number" && isNaN(val)) ? null : val),
    z.number().min(0, "Sale price must be at least 0")
  ),
  discountPercent: z.preprocess(
    (val) => (val === "" || val === undefined || (typeof val === "number" && isNaN(val)) ? null : val),
    z.number()
      .min(1, "Discount must be at least 1%")
      .max(99, "Discount must be at most 99%")
      .nullable()
  ),
  // SaleQuantity bắt buộc với FLASH_SALE (khác với DISCOUNT là nullable)
  saleQuantity: z.preprocess(
    (val) => (val === "" || val === undefined || (typeof val === "number" && isNaN(val)) ? null : val),
    z.number().min(1, "Quantity must be at least 1")
  ),
}).refine(data => {
  if (data.originalPrice !== undefined) {
    return data.salePrice <= data.originalPrice;
  }
  return true;
}, {
  message: "Sale price must be less than or equal to original price",
  path: ["salePrice"]
}).refine(data => {
  if (data.stock !== undefined) {
    return data.saleQuantity <= data.stock;
  }
  return true;
}, {
  message: "Quantity cannot exceed available stock",
  path: ["saleQuantity"]
});

// ─── promotionTimeSlotSchema — StartAt / EndAt (datetime-local input) ─────────
// FE lưu dạng "datetime-local" (YYYY-MM-DDTHH:mm) → convert → UTC khi submit
export const promotionTimeSlotSchema = z.object({
  /** Giá trị từ <input type="datetime-local">, format: "YYYY-MM-DDTHH:mm" */
  startAt: z.string().min(1, "Start date/time is required"),
  /** Giá trị từ <input type="datetime-local">, format: "YYYY-MM-DDTHH:mm" */
  endAt: z.string().min(1, "End date/time is required"),
  status: z.string().min(1, "Status is required"),
  originalStartAt: z.string().optional(),
  isNewSlot: z.boolean().optional(),
  promotionProductSlots: z.array(promotionProductSlotSchema).default([]),
}).refine(data => {
  if (!data.startAt || !data.endAt) return true;
  // 10 minutes = 10 * 60 * 1000 = 600000ms. We use 9 minutes (540000ms) to allow for second truncation.
  return new Date(data.endAt).getTime() > new Date(data.startAt).getTime() + 9 * 60000;
}, {
  message: "End time must be at least 10 minutes after start time",
  path: ["endAt"]
});

// ─── promotionFormSchema — full form ──────────────────────────────────────────
export const promotionFormSchema = z
  .object({
    promotionName: z.string().min(1, "Promotion name is required").max(100, "Maximum 100 characters"),
    promotionType: z.string().min(1, "Promotion type is required"),
    description: z.string().nullable(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    status: z.string().min(1, "Status is required"),
    originalStartDate: z.string().optional(),
    priority: z.preprocess((v) => Number(v), z.number().min(0, "Priority must be at least 0")),
    /** Sản phẩm DISCOUNT (không phân theo slot) */
    productPromotions: z.array(productPromotionSchema).default([]),
    /** Khung giờ FLASH_SALE (mỗi slot chứa danh sách sản phẩm riêng) */
    promotionTimeSlots: z.array(promotionTimeSlotSchema).default([]),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      return end > start;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  )
  .superRefine((data, ctx) => {
    // Thời điểm bắt buộc (áp dụng +9 phút thay vì +10 để bù trừ cho phần giây bị cắt của input form)
    const minimumFutureTime = getMinimumFutureTime();

    // 1. StartDate past validation
    const currentStatus = data.status || "Scheduled";
    if (new Date(data.startDate).getTime() < minimumFutureTime && currentStatus === "Scheduled") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date must be at least 10 minutes from now",
        path: ["startDate"],
      });
    }

    // 2. Status must be Scheduled when before StartDate
    if (new Date(data.startDate).getTime() > Date.now() && currentStatus !== "Scheduled") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Status must be Scheduled before start date",
        path: ["status"],
      });
    }

    if (data.promotionType !== "FLASH_SALE" || !data.startDate || !data.endDate) return;
    const promStart = new Date(data.startDate).getTime();
    const promEnd = new Date(data.endDate).getTime();

    data.promotionTimeSlots.forEach((slot, index) => {
      const slotStart = new Date(slot.startAt).getTime();
      const slotEnd = new Date(slot.endAt).getTime();

      if (slotStart < promStart || slotStart > promEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start time must be within promotion dates",
          path: ["promotionTimeSlots", index, "startAt"],
        });
      }

      if (slotEnd < promStart || slotEnd > promEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End time must be within promotion dates",
          path: ["promotionTimeSlots", index, "endAt"],
        });
      }

      // 3. TimeSlot past validation
      if (slotStart < minimumFutureTime && slot.status === "Scheduled") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start time must be at least 10 minutes from now",
          path: ["promotionTimeSlots", index, "startAt"],
        });
      }

      // 4. TimeSlot Status must be Scheduled when before StartAt
      if (slotStart > Date.now() && slot.status !== "Scheduled") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Status must be Scheduled before start time",
          path: ["promotionTimeSlots", index, "status"],
        });
      }

      // 5. If Promotion Scheduled -> TimeSlots Scheduled
      if (currentStatus === "Scheduled" && slot.status !== "Scheduled") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Must be Scheduled when promotion is Scheduled",
          path: ["promotionTimeSlots", index, "status"],
        });
      }
    });

    // 6. Check for overlapping slots
    for (let i = 0; i < data.promotionTimeSlots.length; i++) {
      for (let j = i + 1; j < data.promotionTimeSlots.length; j++) {
        const slotA = data.promotionTimeSlots[i];
        const slotB = data.promotionTimeSlots[j];

        if (slotA.status === "Expired" || slotB.status === "Expired") continue;

        const startA = new Date(slotA.startAt).getTime();
        const endA = new Date(slotA.endAt).getTime();
        const startB = new Date(slotB.startAt).getTime();
        const endB = new Date(slotB.endAt).getTime();

        if (startA < endB && startB < endA) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Time slots cannot overlap with each other",
            path: ["promotionTimeSlots", j, "startAt"],
          });
        }
      }
    }
  });

export type PromotionProductSlotFormData = z.infer<typeof promotionProductSlotSchema>;
export type PromotionFormData = z.infer<typeof promotionFormSchema>;
