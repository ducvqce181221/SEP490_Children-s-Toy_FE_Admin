"use client";

import React from "react";
import type { Campaign } from "../types/campaign";
import type { CampaignScheduleBounds } from "../types/campaign";
import type { CampaignScheduleFormSubmitState } from "../types/campaign-schedule";
import { formatCampaignScheduleDisplay } from "../utils/campaign-schedule-time";

interface CampaignScheduleSummaryProps {
  campaign: Campaign;
  mode: "schedule" | "reschedule";
  formState: CampaignScheduleFormSubmitState;
  bounds: CampaignScheduleBounds | null;
}

export const CampaignScheduleSummary: React.FC<CampaignScheduleSummaryProps> = ({
  campaign,
  mode,
  formState,
  bounds,
}) => {
  const { selectedDate, validFrom, validTo, reason } = formState;

  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
          Schedule summary
        </h3>
        <dl className="space-y-3">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Campaign</dt>
            <dd className="font-medium text-gray-800 dark:text-white/90 break-all">{campaign.campaignName}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Send time (Vietnam Time)</dt>
            <dd className="font-medium text-gray-800 dark:text-white/90">
              {selectedDate ? formatCampaignScheduleDisplay(selectedDate) : "—"}
            </dd>
          </div>
          {mode === "schedule" && (validFrom || validTo) ? (
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Valid window</dt>
              <dd className="font-medium text-gray-800 dark:text-white/90">
                {validFrom ? formatCampaignScheduleDisplay(validFrom) : "—"} —{" "}
                {validTo ? formatCampaignScheduleDisplay(validTo) : "—"}
              </dd>
            </div>
          ) : null}
          {mode === "reschedule" && reason.trim() ? (
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Reschedule reason</dt>
              <dd className="text-gray-800 dark:text-white/90 whitespace-pre-wrap break-all">{reason.trim()}</dd>
            </div>
          ) : null}
          {mode === "reschedule" && campaign.scheduledAt ? (
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Previous send time</dt>
              <dd className="text-gray-800 dark:text-white/90">
                {formatCampaignScheduleDisplay(campaign.scheduledAt)}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      {bounds?.referenceHintWarning ? (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/15 p-4 text-amber-900 dark:text-amber-200">
          <p className="font-semibold mb-1">Warning</p>
          <p className="text-sm">{bounds.referenceHintWarning}</p>
        </div>
      ) : null}

      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
        Confirm to save the schedule. The background worker will send notifications at the chosen time.
      </p>
    </div>
  );
};
