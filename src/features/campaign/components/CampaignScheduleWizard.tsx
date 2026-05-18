"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { campaignApi } from "../services/campaign-api";
import type { Campaign } from "../types/campaign";
import type { CampaignScheduleFormPayload } from "../types/campaign-schedule";
import { CAMPAIGN_SCHEDULE_FORM_ID } from "../types/campaign-schedule";
import { useCampaignMutations } from "../hooks/useCampaignMutations";
import { CampaignScheduleForm } from "./CampaignScheduleForm";
import { CampaignReferenceCardFromCampaign } from "./CampaignReferenceCard";
import { campaignDetailPath } from "../utils/campaign-navigation";

const DesktopPreview: React.FC<{ campaign: Campaign }> = ({ campaign }) => {
  const title = campaign.resolvedTitle || campaign.titleOverride || "Notification Title";
  const message = campaign.resolvedMessage || campaign.messageOverride || "Notification message...";
  const imageUrl = campaign.imageUrl;

  return (
    <div className="mx-auto w-full max-w-[350px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-md">
      <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-700">
        <div className="w-3.5 h-3.5 rounded-[3px] bg-brand-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[8px] font-medium">T</span>
        </div>
        <span className="text-[11px] text-zinc-500 flex-1 truncate">Toy Store</span>
        <span className="text-[10px] text-zinc-400 flex-shrink-0">now</span>
      </div>
      <div className="p-3 flex gap-2.5 items-start">
        {/* eslint-disable-next-line @next/next/no-img-element -- preview thumb giống màn chi tiết */}
        <img
          src={imageUrl || "/images/logo/logo-icon.svg"}
          alt=""
          className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-white"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/images/logo/logo-icon.svg";
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-zinc-900 dark:text-zinc-100 break-words">{title}</p>
          <p className="text-[11px] text-zinc-500 mt-1 leading-snug whitespace-pre-wrap break-words">{message}</p>
        </div>
      </div>
    </div>
  );
};

interface CampaignScheduleWizardProps {
  campaignId: number;
}

export const CampaignScheduleWizard: React.FC<CampaignScheduleWizardProps> = ({ campaignId }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "reschedule" ? "reschedule" : "schedule";

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const redirectDetail = useCallback(() => {
    router.replace(campaignDetailPath(campaignId));
  }, [router, campaignId]);

  const { scheduleCampaign, rescheduleCampaign, isSubmitting } = useCampaignMutations(() => {
    router.push(campaignDetailPath(campaignId));
  });

  const fetchCampaign = useCallback(() => {
    setIsLoading(true);
    campaignApi
      .getCampaignById(campaignId)
      .then(setCampaign)
      .catch(() => {
        toast.error("Failed to load campaign information.");
        redirectDetail();
      })
      .finally(() => setIsLoading(false));
  }, [campaignId, redirectDetail]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchCampaign();
    });
  }, [fetchCampaign]);

  useEffect(() => {
    if (!campaign) return;
    if (mode === "schedule" && campaign.status !== "Approved") {
      toast.error("Only approved campaigns can be scheduled.");
      redirectDetail();
      return;
    }
    if (mode === "reschedule") {
      if (campaign.status !== "Scheduled") {
        toast.error("Only scheduled campaigns can be rescheduled.");
        redirectDetail();
        return;
      }
      const max = campaign.maxRescheduleCount;
      if (max != null && (campaign.rescheduleCount ?? 0) >= max) {
        toast.error("Maximum rescheduling limit reached.");
        redirectDetail();
      }
    }
  }, [campaign, mode, redirectDetail]);

  const handleScheduleConfirm = async (payload: CampaignScheduleFormPayload): Promise<boolean> => {
    if (mode === "schedule") {
      return scheduleCampaign(campaignId, {
        scheduledAt: payload.scheduledAt,
        validFrom: payload.validFrom,
        validTo: payload.validTo,
      });
    }
    return rescheduleCampaign(campaignId, {
      newScheduledAt: payload.scheduledAt,
      reason: payload.reason,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <svg className="w-10 h-10 animate-spin text-brand-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) return null;

  const detailHref = campaignDetailPath(campaignId);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start gap-3 mb-6">
        <Link
          href={detailHref}
          className="mt-1 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Go back to details"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">
            {mode === "reschedule" ? "Reschedule Delivery" : "Schedule Delivery"} — {campaign.campaignName}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Select delivery time on the left. Reference details and preview are shown on the right.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-6 lg:p-8">
            <CampaignScheduleForm
              mode={mode}
              campaignId={campaignId}
              context={{
                referenceType: campaign.referenceType,
                campaignName: campaign.campaignName,
                promotionType: campaign.resolvedReference?.promotionType ?? null,
              }}
              isSubmitting={isSubmitting}
              onConfirm={handleScheduleConfirm}
              showActionButtons={false}
              compactIntro
              className="w-full"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push(detailHref)}
              className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form={CAMPAIGN_SCHEDULE_FORM_ID}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </>
              ) : mode === "reschedule" ? (
                "Confirm Reschedule"
              ) : (
                "Confirm Schedule"
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5 lg:sticky lg:top-6">
          <CampaignReferenceCardFromCampaign campaign={campaign} scheduleContextNote />
          {campaign.approvedExpireAt && (campaign.status === "Approved" || campaign.status === "Scheduled") ? (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/15 p-4 text-sm">
              <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">Approval Window Expiration</p>
              <p className="text-amber-800 dark:text-amber-200/90">
                {new Date(campaign.approvedExpireAt).toLocaleString("en-US", {
                  timeZone: "Asia/Ho_Chi_Minh",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-200/70 mt-2">
                You must schedule the delivery before this window expires (system policy).
              </p>
            </div>
          ) : null}
          {campaign.scheduledAt && mode === "reschedule" ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4 text-sm">
              <p className="font-medium text-gray-600 dark:text-gray-400 mb-1">Current Schedule</p>
              <p className="text-gray-800 dark:text-white/90">
                {new Date(campaign.scheduledAt).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })}
              </p>
              {campaign.maxRescheduleCount != null ? (
                <p className="text-xs text-gray-500 mt-2">
                  Reschedules used: {campaign.rescheduleCount ?? 0} / {campaign.maxRescheduleCount}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="rounded-2xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-5">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 text-center">
              Notification Preview
            </h3>
            <DesktopPreview campaign={campaign} />
          </div>
        </div>
      </div>
    </div>
  );
};
