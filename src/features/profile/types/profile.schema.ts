import { z } from "zod";

export const profileInfoSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .refine((value) => value === "" || /^0\d{9}$/.test(value), {
      message: "Phone number must start with 0 and contain exactly 10 digits.",
    }),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .max(255, "New password must not exceed 255 characters.")
      .regex(/[A-Z]/, "New password must contain at least one uppercase letter.")
      .regex(/[a-z]/, "New password must contain at least one lowercase letter.")
      .regex(/[0-9]/, "New password must contain at least one number.")
      .regex(/[^a-zA-Z0-9]/, "New password must contain at least one special character."),
    confirmNewPassword: z.string().min(1, "Confirm new password is required."),
  })
  .refine((value) => value.newPassword === value.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "Confirm new password does not match.",
  });

export type ProfileInfoFormValues = z.infer<typeof profileInfoSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
