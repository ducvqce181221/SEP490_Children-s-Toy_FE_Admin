"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { authApi } from "@/features/auth/services/auth-api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const forgotSchema = z.object({
  email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
});

const resetSchema = z.object({
  otpCode: z
    .string()
    .min(1, "Mã OTP là bắt buộc")
    .length(6, "Mã OTP phải gồm 6 chữ số")
    .regex(/^\d{6}$/, "Mã OTP chỉ gồm chữ số"),
  newPassword: z
    .string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự")
    .regex(/[A-Z]/, "Phải có ít nhất 1 chữ hoa")
    .regex(/[a-z]/, "Phải có ít nhất 1 chữ thường")
    .regex(/[0-9]/, "Phải có ít nhất 1 chữ số")
    .regex(/[^a-zA-Z0-9]/, "Phải có ít nhất 1 ký tự đặc biệt"),
  confirmPassword: z.string().min(1, "Xác nhận mật khẩu là bắt buộc"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ["confirmPassword"],
});

type ForgotFormValues = z.infer<typeof forgotSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

type Step = "email" | "reset";

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const forgotForm = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  const onSendOtp = async (data: ForgotFormValues) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data);
      setEmail(data.email);
      setStep("reset");
      toast.success("Mã OTP đã được gửi đến email của bạn.");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message ?? "Không thể gửi OTP. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async (data: ResetFormValues) => {
    setIsLoading(true);
    try {
      await authApi.resetPassword({ email, ...data });
      toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.");
      router.push("/admin/login");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message ?? "Đặt lại mật khẩu thất bại. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧸</span>
          <span className="font-bold text-brand-500 text-lg">ToyStore Admin</span>
        </div>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-8">
            <h1 className="mb-2 font-bold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Quên mật khẩu
            </h1>
            {step === "email" ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu.
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nhập mã OTP đã gửi đến <strong>{email}</strong> và mật khẩu mới.
              </p>
            )}
          </div>

          {step === "email" && (
            <form onSubmit={forgotForm.handleSubmit(onSendOtp)} noValidate>
              <div className="space-y-5">
                <div>
                  <Label htmlFor="email">
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@toystore.com"
                    {...forgotForm.register("email")}
                  />
                  {forgotForm.formState.errors.email && (
                    <p className="mt-1.5 text-xs text-error-500">
                      {forgotForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" size="sm" disabled={isLoading}>
                  {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
                </Button>
              </div>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={resetForm.handleSubmit(onResetPassword)} noValidate>
              <div className="space-y-5">
                <div>
                  <Label htmlFor="otpCode">
                    Mã OTP <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    id="otpCode"
                    type="text"
                    placeholder="Nhập 6 chữ số"
                    maxLength={6}
                    {...resetForm.register("otpCode")}
                  />
                  {resetForm.formState.errors.otpCode && (
                    <p className="mt-1.5 text-xs text-error-500">
                      {resetForm.formState.errors.otpCode.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="newPassword">
                    Mật khẩu mới <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu mới"
                      {...resetForm.register("newPassword")}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                  {resetForm.formState.errors.newPassword && (
                    <p className="mt-1.5 text-xs text-error-500">
                      {resetForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">
                    Xác nhận mật khẩu <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu mới"
                      {...resetForm.register("confirmPassword")}
                    />
                    <span
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showConfirm ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-error-500">
                      {resetForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" size="sm" disabled={isLoading}>
                  {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                </Button>

                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="w-full text-sm text-gray-500 hover:text-brand-500 transition-colors"
                >
                  ← Gửi lại OTP
                </button>
              </div>
            </form>
          )}

          <div className="mt-6">
            <p className="text-sm text-center text-gray-700 dark:text-gray-400">
              Đã nhớ mật khẩu?{" "}
              <Link href="/admin/login" className="text-brand-500 hover:text-brand-600">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
