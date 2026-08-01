import { z } from "zod";

// Allowed product statuses
const ALLOWED_STATUSES = ["Active", "Inactive", "OutOfStock", "Discontinued", "ComingSoon"] as const;
const EMPTY_RICH_TEXT_VALUE = "<p><br></p>";
const MIN_DESCRIPTION_TEXT_LENGTH = 10;
export const MAX_DESCRIPTION_LENGTH = 1500;
const MAX_IMAGE_URL_LENGTH = 500;

const normalizeUrl = (value: string) => value.trim();

export const normalizeDescriptionHtml = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed === EMPTY_RICH_TEXT_VALUE) {
    return "";
  }

  return trimmed;
};

export const getDescriptionTextLength = (value: unknown): number => {
  const normalized = normalizeDescriptionHtml(value);
  if (normalized.length === 0) {
    return 0;
  }

  return normalized.replace(/<[^>]*>/g, "").replace(/\u00a0/g, " ").trim().length;
};

const getDescriptionStorageLength = (value: unknown): number => {
  return normalizeDescriptionHtml(value).length;
};

export const ProductFormSchema = z
  .object({
    productName: z
      .string()
      .min(1, "Product name is required")
      .min(3, "Product name must be at least 3 characters")
      .max(255, "Product name cannot exceed 255 characters")
      .refine((val) => val.trim().length >= 3, {
        message: "Product name must be at least 3 characters",
      }),
    categoryId: z
      .number()
      .int("Category must be a valid number")
      .refine((val) => val > 0, {
        message: "Please select a category",
      }),
    brandId: z
      .number()
      .int("Brand must be a valid number")
      .refine((val) => val > 0, {
        message: "Please select a brand",
      })
      .nullable()
      .refine((val) => val !== null, {
        message: "Brand is required",
      }),
    priceRangeId: z
      .number()
      .int("Price range must be a valid number")
      .refine((val) => val > 0, {
        message: "Price range ID must be greater than 0",
      })
      .nullable()
      .optional(),
    price: z
      .number()
      .refine((val) => val > 0, {
        message: "Price must be greater than 0",
      })
      .refine((val) => val <= 100_000_000, {
        message: "Price must not exceed 100,000,000 VND",
      }),
    quantity: z
      .number()
      .int("Quantity must be a whole number")
      .gt(0, "Quantity is required and must be greater than 0")
      .lte(1_000_000, "Quantity must not exceed 1,000,000"),
    productStatus: z
      .string()
      .min(1, "Product status is required")
      .refine((val) => ALLOWED_STATUSES.includes(val as (typeof ALLOWED_STATUSES)[number]), {
        message: "Product status is invalid",
      }),
    launchDate: z
      .string()
      .nullable()
      .refine((val) => val !== null && val !== "", {
        message: "Launch date is required",
      }),
    stockThreshold: z
      .number()
      .int("Stock threshold must be a whole number")
      .gte(0, "Stock threshold cannot be negative")
      .lte(10_000, "Stock threshold must not exceed 10,000")
      .default(10),
    lowStockNotificationEnabled: z.boolean().default(true),
    description: z
      .string()
      .refine(
        (val) => {
          if (!normalizeDescriptionHtml(val)) return true;
          return getDescriptionTextLength(val) >= MIN_DESCRIPTION_TEXT_LENGTH;
        },
        {
          message: "Description must be at least 10 characters",
        }
      )
      .refine(
        (val) => {
          if (!normalizeDescriptionHtml(val)) return true;
          return getDescriptionStorageLength(val) <= MAX_DESCRIPTION_LENGTH;
        },
        {
          message: "Description must not exceed 1500 characters",
        }
      )
      .nullable()
      .optional()
      .or(z.literal(""))
      .transform((val) => {
        const normalized = normalizeDescriptionHtml(val);
        return normalized.length === 0 ? null : normalized;
      }),
    materialId: z
      .number()
      .int("Material must be a valid number")
      .refine((val) => val > 0, {
        message: "Please select a material",
      })
      .nullable()
      .refine((val) => val !== null, {
        message: "Material is required",
      }),
    ageId: z
      .number()
      .int("Age must be a valid number")
      .refine((val) => val > 0, {
        message: "Please select an age range",
      })
      .nullable()
      .refine((val) => val !== null, {
        message: "Age range is required",
      }),
    sexId: z
      .number()
      .int("Gender must be a valid number")
      .refine((val) => val > 0, {
        message: "Please select a sex",
      })
      .nullable()
      .refine((val) => val !== null, {
        message: "Sex is required",
      }),
    originId: z
      .number()
      .int("Origin must be a valid number")
      .refine((val) => val > 0, {
        message: "Please select an origin",
      })
      .nullable()
      .refine((val) => val !== null, {
        message: "Origin is required",
      }),
    weightGram: z
      .number()
      .int("Weight must be a whole number")
      .gt(0, "Weight (gram) must be greater than 0"),
    lengthCm: z
      .number()
      .int("Length must be a whole number")
      .gt(0, "Length (cm) must be greater than 0")
      .lte(150, "Length (cm) must not exceed 150 cm"),
    widthCm: z
      .number()
      .int("Width must be a whole number")
      .gt(0, "Width (cm) must be greater than 0")
      .lte(150, "Width (cm) must not exceed 150 cm"),
    heightCm: z
      .number()
      .int("Height must be a whole number")
      .gt(0, "Height (cm) must be greater than 0")
      .lte(150, "Height (cm) must not exceed 150 cm"),
    mainImageUrl: z
      .string()
      .refine(
        (val) => {
          if (!val || val.trim() === "") return true; // Allow empty for edit mode
          return normalizeUrl(val).length <= MAX_IMAGE_URL_LENGTH;
        },
        {
          message: "Main image URL must not exceed 500 characters",
        }
      )
      .refine(
        (val) => {
          if (!val || val.trim() === "") return true; // Allow empty for edit mode
          try {
            new URL(normalizeUrl(val));
            return true;
          } catch {
            return false;
          }
        },
        {
          message: "Main image URL is not valid",
        }
      )
      .nullable()
      .optional()
      .or(z.literal(""))
      .transform((val) => {
        if (typeof val !== "string") {
          return null;
        }

        const normalized = normalizeUrl(val);
        return normalized === "" ? null : normalized;
      }),
    additionalImageUrls: z
      .array(
        z
          .string()
          .refine((val) => normalizeUrl(val).length <= MAX_IMAGE_URL_LENGTH, {
            message: "Additional image URL must not exceed 500 characters",
          })
          .refine(
            (val) => {
              try {
                new URL(normalizeUrl(val));
                return true;
              } catch {
                return false;
              }
            },
            {
              message: "Additional image URL is not valid",
            }
          )
      )
      .default([])
      .transform((urls) => urls.map(normalizeUrl))
      .refine(
        (urls) => new Set(urls.map(normalizeUrl)).size === urls.length,
        {
          message: "Additional images must be unique",
        }
      ),
  })
  .refine(
    (data) => {
      // If status is ComingSoon, launchDate is required
      if (data.productStatus === "ComingSoon") {
        return data.launchDate !== null && data.launchDate !== undefined && data.launchDate !== "";
      }
      return true;
    },
    {
      message: "Launch date is required for coming soon products",
      path: ["launchDate"],
    }
  )
  .refine(
    (data) => {
      // If status is ComingSoon and launchDate is provided, it must be STRICTLY in the future.
      // "Coming Soon" implies not yet launched — today's date means it's launching now.
      // Append "T00:00:00" so JS parses as LOCAL midnight, not UTC midnight.
      if (data.productStatus === "ComingSoon" && data.launchDate) {
        const datePart = data.launchDate.slice(0, 10);
        const launchDate = new Date(datePart + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return launchDate > today;
      }
      return true;
    },
    {
      message: "Launch date must be a future date for 'Coming Soon' products. Today's date is not allowed.",
      path: ["launchDate"],
    }
  )
  .refine(
    (data) => {
      // If launchDate is in the future, status must be ComingSoon.
      // NOTE: append "T00:00:00" so JS parses as LOCAL midnight, not UTC midnight.
      // Without this, "2026-08-01" is parsed as UTC midnight which is "in the future"
      // for users in UTC+7 zones (they see it as past midnight on Aug 1 already).
      if (data.launchDate && data.productStatus !== "ComingSoon") {
        const datePart = data.launchDate.slice(0, 10);
        const launchDate = new Date(datePart + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return launchDate <= today;
      }
      return true;
    },
    {
      message: "Cannot set status to Active before the launch date. The product has not launched yet.",
      path: ["productStatus"],
    }
  )
  .refine(
    (data) => {
      // Cannot set OutOfStock when Quantity > 0
      return !(data.productStatus === "OutOfStock" && data.quantity > 0);
    },
    {
      message: "Cannot set status to 'Out of Stock' when the product still has available quantity.",
      path: ["productStatus"],
    }
  );

export type ProductFormData = z.infer<typeof ProductFormSchema>;
