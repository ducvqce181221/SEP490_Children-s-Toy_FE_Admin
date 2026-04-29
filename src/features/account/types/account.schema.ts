import { z } from "zod";

export const createAccountSchema = z
  .object({
    accountName: z
      .string()
      .trim()
      .min(2, "Account name must be at least 2 characters.")
      .max(99, "Account name must not exceed 99 characters.")
      .regex(
        /^[\p{L}\p{N}]+$/u,
        "Account name can contain only letters and numbers.",
      ),
    phoneNumber: z
      .string()
      .trim()
      .refine(
        (value) => value.length === 0 || /^0\d{9}$/.test(value),
        "Phone number must start with 0 and contain exactly 10 digits.",
      ),
    email: z
      .string()
      .trim()
      .min(1, "Email is required.")
      .max(100, "Email must not exceed 100 characters.")
      .email("Email format is invalid."),
    roleId: z.enum(["3", "4"]),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(100, "Password must not exceed 100 characters.")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        "Password must include uppercase, lowercase, and number.",
      ),
    confirmPassword: z.string().min(1, "Please confirm password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Confirm password does not match.",
  });

export type CreateAccountFormValues = z.infer<typeof createAccountSchema>;
