"use client";

import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { useAuthContext } from "@/context/AuthContext";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { profileApi } from "@/features/profile/services/profile-api";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { profile, isLoading, isSaving, error, updateProfile } = useProfile();
  const { account, setAuth } = useAuthContext();

  const syncAuth = (updated: {
    accountName: string;
    email: string;
    imageUrl: string | null;
    roleId: number;
    roleName: string;
  }) => {
    if (!account) {
      return;
    }

    const token = localStorage.getItem("access_token") ?? "";
    if (!token) {
      return;
    }

    setAuth(
      {
        ...account,
        accountName: updated.accountName,
        email: updated.email,
        imageUrl: updated.imageUrl ?? undefined,
        roleId: updated.roleId,
        roleName: updated.roleName,
      },
      token,
    );
  };

  const handleUpdateImage = async (file: File) => {
    try {
      const uploadResult = await profileApi.uploadMyAvatar(file);
      const result = await updateProfile({ imageUrl: uploadResult.url });
      if (!result.success) {
        toast.error(result.message ?? "Unable to update avatar.");
        return;
      }

      syncAuth(result.data);
      toast.success("Avatar updated successfully.");
    } catch {
      toast.error("Unable to update avatar.");
    }
  };

  const handleUpdateInfo = async (payload: { phoneNumber: string }) => {
    const result = await updateProfile({
      phoneNumber: payload.phoneNumber.trim() || null,
    });

    if (result.success) {
      syncAuth(result.data);
      toast.success("Profile updated successfully.");
    }
    return result;
  };

  const handleChangePassword = async (payload: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => {
    const result = await updateProfile({
      currentPassword: payload.currentPassword.trim() || undefined,
      newPassword: payload.newPassword.trim() || undefined,
      confirmNewPassword: payload.confirmNewPassword.trim() || undefined,
    });

    if (result.success) {
      toast.success("Password changed successfully.");
    }
    return result;
  };

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>

        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading profile...</p>
        ) : error ? (
          <p className="text-sm text-error-500">{error}</p>
        ) : profile ? (
          <div className="space-y-6">
            <UserMetaCard profile={profile} isSaving={isSaving} onUpdateImage={handleUpdateImage} />
            <UserInfoCard
              profile={profile}
              isSaving={isSaving}
              onUpdateInfo={handleUpdateInfo}
              onChangePassword={handleChangePassword}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
