"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { authApi } from "@/features/auth/services/auth-api";
import { useAuthContext } from "@/context/AuthContext";
import { getSafeAdminReturnTo } from "@/features/auth/utils/admin-access";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const ADMIN_ROLE_IDS = [2, 3, 4];

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { account, isAuthenticated, isInitialized, setAuth } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToParam = searchParams?.get("returnTo") ?? null;

  // Redirect already-authenticated users away from login page (fixes Back-to-login bug)
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace(getSafeAdminReturnTo(returnToParam, account));
    }
  }, [isInitialized, isAuthenticated, account, returnToParam, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const payload: LoginFormValues = {
        ...data,
        password: data.password.trim(),
      };
      const response = await authApi.login(payload);

      if (!ADMIN_ROLE_IDS.includes(response.account.roleId)) {
        toast.error("This account does not have access to the admin system.");
        return;
      }

      setAuth(response.account, response.accessToken);
      toast.success(`Welcome, ${response.account.accountName}!`);
      router.replace(getSafeAdminReturnTo(returnToParam, response.account));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message ?? "Sign-in failed. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-brand-500 text-lg">ToyStore Admin</span>
        </div>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-8">
            <h1 className="mb-2 font-bold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your credentials to access the admin system.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-5">
              <div>
                <Label htmlFor="email">
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@gmail.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-error-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    {...register("password")}
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
                {errors.password && (
                  <p className="mt-1.5 text-xs text-error-500">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
