"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useModal } from "../../hooks/useModal";
import { Profile } from "@/features/profile/types/profile";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import {
  changePasswordSchema,
  ChangePasswordFormValues,
  profileInfoSchema,
  ProfileInfoFormValues,
} from "@/features/profile/types/profile.schema";

interface UserInfoCardProps {
  profile: Profile;
  isSaving: boolean;
  onUpdateInfo: (payload: { phoneNumber: string }) => Promise<{
    success: boolean;
    message?: string;
    validationErrors?: Record<string, string[]>;
  }>;
  onChangePassword: (payload: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => Promise<{
    success: boolean;
    message?: string;
    validationErrors?: Record<string, string[]>;
  }>;
}

export default function UserInfoCard({
  profile,
  isSaving,
  onUpdateInfo,
  onChangePassword,
}: UserInfoCardProps) {
  const { isOpen: isInfoOpen, openModal: openInfoModal, closeModal: closeInfoModal } = useModal();
  const { isOpen: isPasswordOpen, openModal: openPasswordModal, closeModal: closePasswordModal } = useModal();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: registerInfo,
    handleSubmit: handleInfoSubmit,
    reset: resetInfoForm,
    setError: setInfoError,
    formState: { errors: infoErrors },
  } = useForm<ProfileInfoFormValues>({
    resolver: zodResolver(profileInfoSchema),
    defaultValues: { phoneNumber: profile.phoneNumber ?? "" },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    setError: setPasswordError,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    resetInfoForm({ phoneNumber: profile.phoneNumber ?? "" });
  }, [profile.phoneNumber, resetInfoForm]);

  const getServerValidationMessage = (
    validationErrors: Record<string, string[]> | undefined,
    keys: string[],
  ) => {
    if (!validationErrors) {
      return null;
    }

    for (const key of keys) {
      const errorMessages = validationErrors[key];
      if (errorMessages?.length) {
        return errorMessages[0];
      }
    }

    return null;
  };

  const submitInfoForm = async (values: ProfileInfoFormValues) => {
    const result = await onUpdateInfo({ phoneNumber: values.phoneNumber });

    if (!result.success) {
      const phoneMessage = getServerValidationMessage(result.validationErrors, ["PhoneNumber", "phoneNumber"]);

      if (phoneMessage) {
        setInfoError("phoneNumber", { type: "server", message: phoneMessage });
        return;
      }

      toast.error(result.message ?? "Unable to update profile.");
      return;
    }

    closeInfoModal();
  };

  const submitPasswordForm = async (values: ChangePasswordFormValues) => {
    const result = await onChangePassword(values);

    if (!result.success) {
      const currentPasswordMessage = getServerValidationMessage(result.validationErrors, [
        "CurrentPassword",
        "currentPassword",
      ]);
      const newPasswordMessage = getServerValidationMessage(result.validationErrors, ["NewPassword", "newPassword"]);
      const confirmPasswordMessage = getServerValidationMessage(result.validationErrors, [
        "ConfirmNewPassword",
        "confirmNewPassword",
      ]);

      if (currentPasswordMessage) {
        setPasswordError("currentPassword", { type: "server", message: currentPasswordMessage });
      }
      if (newPasswordMessage) {
        setPasswordError("newPassword", { type: "server", message: newPasswordMessage });
      }
      if (confirmPasswordMessage) {
        setPasswordError("confirmNewPassword", { type: "server", message: confirmPasswordMessage });
      }

      if (!currentPasswordMessage && !newPasswordMessage && !confirmPasswordMessage) {
        toast.error(result.message ?? "Unable to change password.");
      }
      return;
    }

    resetPasswordForm();
    closePasswordModal();
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">Personal Information</h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Account Name</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{profile.accountName}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Email address</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{profile.email}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{profile.phoneNumber ?? "-"}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Role</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{profile.roleName}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Status</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
          <button
            onClick={openInfoModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            Edit
          </button>
          <button
            onClick={openPasswordModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            Change Password
          </button>
        </div>
      </div>

      <Modal isOpen={isInfoOpen} onClose={closeInfoModal} className="max-w-[700px] m-4">
        <div className="relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Edit Personal Information</h4>
          </div>
          <div className="px-2 pb-3">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div>
                <Label>Account Name</Label>
                <Input type="text" value={profile.accountName} disabled />
              </div>
              <div>
                <Label>Email address</Label>
                <Input type="text" value={profile.email} disabled />
              </div>
              <div>
                <Label>Role</Label>
                <Input type="text" value={profile.roleName} disabled />
              </div>
              <div>
                <Label>Status</Label>
                <Input type="text" value={profile.isActive ? "Active" : "Inactive"} disabled />
              </div>
              <div className="lg:col-span-2">
                <Label>Phone</Label>
                <Input type="text" {...registerInfo("phoneNumber")} />
                {infoErrors.phoneNumber && (
                  <p className="mt-1.5 text-xs text-error-500">{infoErrors.phoneNumber.message}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={closeInfoModal}>
              Close
            </Button>
            <Button size="sm" onClick={() => void handleInfoSubmit(submitInfoForm)()} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isPasswordOpen} onClose={closePasswordModal} className="max-w-[700px] m-4">
        <div className="relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Change Password</h4>
          </div>
          <div className="px-2 pb-3">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5">
              <div>
                <Label>Current Password</Label>
                <div className="relative">
                  <Input type={showCurrentPassword ? "text" : "password"} {...registerPassword("currentPassword")} className="pr-10" />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                  >
                    {showCurrentPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="mt-1.5 text-xs text-error-500">{passwordErrors.currentPassword.message}</p>
                )}
              </div>
              <div>
                <Label>New Password</Label>
                <div className="relative">
                  <Input type={showNewPassword ? "text" : "password"} {...registerPassword("newPassword")} className="pr-10" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  >
                    {showNewPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="mt-1.5 text-xs text-error-500">{passwordErrors.newPassword.message}</p>
                )}
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    {...registerPassword("confirmNewPassword")}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </button>
                </div>
                {passwordErrors.confirmNewPassword && (
                  <p className="mt-1.5 text-xs text-error-500">{passwordErrors.confirmNewPassword.message}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={closePasswordModal}>
              Close
            </Button>
            <Button size="sm" onClick={() => void handlePasswordSubmit(submitPasswordForm)()} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
