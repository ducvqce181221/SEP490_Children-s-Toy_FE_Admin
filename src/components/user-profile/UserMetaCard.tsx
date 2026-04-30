"use client";

import Image from "next/image";
import { ChangeEvent, useRef } from "react";
import { Profile } from "@/features/profile/types/profile";

interface UserMetaCardProps {
  profile: Profile;
  isSaving: boolean;
  onUpdateImage: (file: File) => Promise<void>;
}

export default function UserMetaCard({
  profile,
  isSaving,
  onUpdateImage,
}: UserMetaCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarClick = () => {
    if (isSaving) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await onUpdateImage(file);

    event.target.value = "";
  };

  const initials = profile.accountName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={isSaving}
            className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-gray-100 dark:bg-gray-800 disabled:cursor-not-allowed"
            title="Click to upload avatar"
          >
              {profile.imageUrl ? (
                <Image
                  width={80}
                  height={80}
                  src={profile.imageUrl}
                  alt={profile.accountName}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  {initials}
                </span>
              )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="order-3 xl:order-2">
            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              {profile.accountName}
            </h4>
            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">{profile.roleName}</p>
              <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Click avatar to upload image
        </p>
      </div>
    </div>
  );
}
