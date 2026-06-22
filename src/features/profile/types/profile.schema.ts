import { z } from "zod";

const ALLOWED_SEX_IDS = ["1", "2", "3"];
const MINIMUM_AGE = 15;

const isValidDateInput = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
};

const isAtLeastMinimumAge = (value: string) => {
  if (!value) {
    return true;
  }

  const [year, month, day] = value.split("-").map(Number);
  const dob = new Date(Date.UTC(year, month - 1, day));
  const now = new Date();
  const latestAllowedDob = new Date(Date.UTC(
    now.getUTCFullYear() - MINIMUM_AGE,
    now.getUTCMonth(),
    now.getUTCDate(),
  ));

  return dob.getTime() <= latestAllowedDob.getTime();
};

export const profileInfoSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .refine((value) => value === "" || /^0\d{9}$/.test(value), {
      message: "Phone number must start with 0 and contain exactly 10 digits.",
    }),
  dob: z
    .string()
    .trim()
    .refine((value) => value === "" || isValidDateInput(value), {
      message: "Date of birth is invalid.",
    })
    .refine((value) => value === "" || isAtLeastMinimumAge(value), {
      message: "You must be at least 15 years old.",
    }),
  sexId: z
    .string()
    .trim()
    .refine((value) => value === "" || ALLOWED_SEX_IDS.includes(value), {
      message: "Sex ID is invalid.",
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
