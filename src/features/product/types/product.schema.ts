import { z } from "zod";

// Allowed product statuses
const ALLOWED_STATUSES = ["Active", "Inactive", "OutOfStock", "Discontinued", "ComingSoon"] as const;

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
        message: "Brand ID must be greater than 0",
      })
      .nullable()
      .optional(),
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
      .gte(0, "Quantity cannot be negative")
      .lte(1_000_000, "Quantity must not exceed 1,000,000"),
    productStatus: z
      .string()
      .min(1, "Product status is required")
      .refine((val) => ALLOWED_STATUSES.includes(val as any), {
        message: "Product status is invalid",
      }),
    launchDate: z.string().nullable().optional(),
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
          if (!val || val.trim() === "" || val === "<p><br></p>") return true;
          const textLength = val.replace(/<[^>]*>/g, "").trim().length;
          return textLength >= 10;
        },
        {
          message: "Description must be at least 10 characters",
        }
      )
      .refine(
        (val) => {
          if (!val || val.trim() === "" || val === "<p><br></p>") return true;
          const textLength = val.replace(/<[^>]*>/g, "").trim().length;
          return textLength <= 1500;
        },
        {
          message: "Description must not exceed 1500 characters",
        }
      )
      .nullable()
      .optional()
      .or(z.literal(""))
      .transform((val) => {
        if (!val || val === "" || val === "<p><br></p>") return null;
        return val;
      }),
    materialId: z
      .number()
      .int("Material must be a valid number")
      .refine((val) => val > 0, {
        message: "Material ID must be greater than 0",
      })
      .nullable()
      .optional(),
    ageId: z
      .number()
      .int("Age must be a valid number")
      .refine((val) => val > 0, {
        message: "Age ID must be greater than 0",
      })
      .nullable()
      .optional(),
    sexId: z
      .number()
      .int("Gender must be a valid number")
      .refine((val) => val > 0, {
        message: "Gender ID must be greater than 0",
      })
      .nullable()
      .optional(),
    originId: z
      .number()
      .int("Origin must be a valid number")
      .refine((val) => val > 0, {
        message: "Origin ID must be greater than 0",
      })
      .nullable()
      .optional(),
    mainImageUrl: z
      .string()
      .refine(
        (val) => {
          if (!val || val.trim() === "") return true; // Allow empty for edit mode
          try {
            new URL(val);
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
      .transform((val) => (val === "" ? null : val)),
    additionalImageUrls: z
      .array(
        z.string().refine(
          (val) => {
            try {
              new URL(val);
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
      .default([]),
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
      // If status is ComingSoon and launchDate is provided, it must be today or later
      if (data.productStatus === "ComingSoon" && data.launchDate) {
        const launchDate = new Date(data.launchDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return launchDate >= today;
      }
      return true;
    },
    {
      message: "Launch date must be today or later for coming soon products",
      path: ["launchDate"],
    }
  );

export type ProductFormData = z.infer<typeof ProductFormSchema>;
