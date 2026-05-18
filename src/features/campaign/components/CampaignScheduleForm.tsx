"use client";

import React, { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/form/date-picker";
import TextArea from "@/components/form/input/TextArea";
import { campaignApi } from "../services/campaign-api";
import type { CampaignScheduleBounds } from "../types/campaign";
import type { CampaignScheduleContext, CampaignScheduleFormPayload } from "../types/campaign-schedule";
import { CAMPAIGN_SCHEDULE_FORM_ID } from "../types/campaign-schedule";
import {
  getCampaignScheduleHintSections,
  SCHEDULE_MAX_LEAD_DAYS,
  SCHEDULE_MIN_LEAD_MINUTES,
} from "../utils/campaign-schedule-hints";

export type { CampaignScheduleFormPayload, CampaignScheduleContext } from "../types/campaign-schedule";

function formatVnDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatVnFromDate(d: Date): string {
  return d.toLocaleString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function clampDate(d: Date, min: Date, max: Date): Date {
  const t = d.getTime();
  if (t < min.getTime()) return new Date(min);
  if (t > max.getTime()) return new Date(max);
  return d;
}

interface CampaignScheduleFormProps {
  mode: "schedule" | "reschedule";
  campaignId: number | null;
  context?: CampaignScheduleContext | null;
  isSubmitting: boolean;
  onConfirm: (payload: CampaignScheduleFormPayload) => Promise<boolean>;
  /** When false: don't render Cancel/Confirm buttons (wizard uses external footer + submit via form) */
  showActionButtons?: boolean;
  onCancel?: () => void;
  /** When false: don't fetch schedule-bounds */
  loadBounds?: boolean;
  /** Remove large top header intro (used when wizard already has step titles) */
  compactIntro?: boolean;
  className?: string;
}

export const CampaignScheduleForm: React.FC<CampaignScheduleFormProps> = ({
  mode,
  campaignId,
  context = null,
  isSubmitting,
  onConfirm,
  showActionButtons = true,
  onCancel,
  loadBounds = true,
  compactIntro = false,
  className = "",
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [validFrom, setValidFrom] = useState<Date | null>(null);
  const [validTo, setValidTo] = useState<Date | null>(null);
  const [reason, setReason] = useState("");
  const [scheduleBounds, setScheduleBounds] = useState<CampaignScheduleBounds | null>(null);
  const [boundsLoading, setBoundsLoading] = useState(false);
  const [boundsError, setBoundsError] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setSelectedDate(null);
      setValidFrom(null);
      setValidTo(null);
      setReason("");
    });
  }, [mode, campaignId]);

  useEffect(() => {
    if (!loadBounds || campaignId == null) {
      queueMicrotask(() => {
        setScheduleBounds(null);
        setBoundsLoading(false);
        setBoundsError(false);
      });
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setBoundsLoading(true);
        setBoundsError(false);
        setScheduleBounds(null);
      }
    });

    void campaignApi
      .getScheduleBounds(campaignId)
      .then((b) => {
        if (!cancelled) setScheduleBounds(b);
      })
      .catch(() => {
        if (!cancelled) {
          setBoundsError(true);
          setScheduleBounds(null);
        }
      })
      .finally(() => {
        if (!cancelled) setBoundsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadBounds, campaignId]);

  const minScheduleDate = new Date();
  minScheduleDate.setSeconds(0, 0);
  minScheduleDate.setMinutes(minScheduleDate.getMinutes() + SCHEDULE_MIN_LEAD_MINUTES);

  const maxScheduleDate = new Date();
  maxScheduleDate.setSeconds(0, 0);
  maxScheduleDate.setDate(maxScheduleDate.getDate() + SCHEDULE_MAX_LEAD_DAYS);

  let effectiveMinDate = minScheduleDate;
  let effectiveMaxDate = maxScheduleDate;
  if (scheduleBounds?.isFeasible) {
    const refMin = new Date(scheduleBounds.earliestUtc);
    const refMax = new Date(scheduleBounds.latestUtc);
    effectiveMinDate = refMin > minScheduleDate ? refMin : minScheduleDate;
    effectiveMaxDate = refMax < maxScheduleDate ? refMax : maxScheduleDate;
  }

  useEffect(() => {
    if (!scheduleBounds || boundsLoading) return;
    queueMicrotask(() => {
      if (!scheduleBounds.isFeasible) {
        setSelectedDate(null);
        return;
      }
      const minLead = new Date();
      minLead.setSeconds(0, 0);
      minLead.setMinutes(minLead.getMinutes() + SCHEDULE_MIN_LEAD_MINUTES);
      const globalMax = new Date();
      globalMax.setSeconds(0, 0);
      globalMax.setDate(globalMax.getDate() + SCHEDULE_MAX_LEAD_DAYS);
      const refMin = new Date(scheduleBounds.earliestUtc);
      const refMax = new Date(scheduleBounds.latestUtc);
      const effMin = refMin > minLead ? refMin : minLead;
      const effMax = refMax < globalMax ? refMax : globalMax;
      setSelectedDate((prev) => {
        if (!prev) return prev;
        const clamped = clampDate(prev, effMin, effMax);
        return clamped.getTime() === prev.getTime() ? prev : null;
      });
    });
  }, [scheduleBounds, boundsLoading]);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    const ok = await onConfirm({
      scheduledAt: selectedDate.toISOString(),
      validFrom: validFrom ? validFrom.toISOString() : null,
      validTo: validTo ? validTo.toISOString() : null,
      reason: mode === "reschedule" ? (reason.trim() || null) : null,
    });
    if (ok) {
      setSelectedDate(null);
      setValidFrom(null);
      setValidTo(null);
      setReason("");
    }
  };

  const hintSections = useMemo(
    () => getCampaignScheduleHintSections(context?.referenceType, context?.promotionType),
    [context?.referenceType, context?.promotionType],
  );

  const setQuickTime = (type: "30m" | "1h" | "tomorrow") => {
    const d = new Date();
    d.setSeconds(0, 0);
    if (type === "30m") {
      d.setMinutes(d.getMinutes() + SCHEDULE_MIN_LEAD_MINUTES);
    } else if (type === "1h") {
      d.setHours(d.getHours() + 1);
    } else if (type === "tomorrow") {
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    }
    setSelectedDate(clampDate(d, effectiveMinDate, effectiveMaxDate));
  };

  const awaitingBounds = campaignId != null && boundsLoading && loadBounds;
  const infeasibleWindow = scheduleBounds !== null && !scheduleBounds.isFeasible;

  const title = mode === "reschedule" ? "Reschedule Delivery" : "Schedule Delivery";

  return (
    <form id={CAMPAIGN_SCHEDULE_FORM_ID} onSubmit={(e) => void handleSubmitForm(e)} className={className}>
      {!compactIntro ? (
        <div className="flex flex-col items-center mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 text-brand-600 mb-4 dark:bg-brand-900/30 dark:text-brand-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="mb-1 text-lg font-bold text-gray-800 dark:text-white/90">{title}</h3>
          <p className="mb-1 text-center text-sm text-gray-600 dark:text-gray-400 px-2 leading-relaxed">
            This is the time when the background worker sends notifications to the selected audience. The date picker displays times based on your local machine;{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              the allowed scheduling range is shown below the "Send time" input
            </span>{" "}
            (synced with the server).
          </p>
          <p className="mb-2 text-center text-xs text-gray-500 dark:text-gray-400 px-2 leading-relaxed">
            Open the "Detailed Scheduling Guide" below to view eligibility requirements by campaign type (vouchers, sales, flash sales, etc.).
            If the API returns an error after clicking Confirm, read the toast notification — it usually identifies the violated time limit.
          </p>
          {context?.campaignName ? (
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400 text-center">
              Campaign: <span className="font-medium text-gray-700 dark:text-gray-300">{context.campaignName}</span>
              {context.referenceType ? (
                <span className="ml-1">
                  ({context.referenceType}
                  {context.referenceType === "SALE" && context.promotionType ? ` · ${context.promotionType}` : ""})
                </span>
              ) : null}
            </p>
          ) : (
            <div className="mb-4" />
          )}
        </div>
      ) : null}

      <details
        open
        className="w-full mb-4 rounded-lg border border-brand-100 bg-brand-50/50 px-3 py-2 text-left dark:border-brand-500/20 dark:bg-brand-500/10"
      >
        <summary className="cursor-pointer text-sm font-semibold text-brand-800 dark:text-brand-200 list-none flex items-center gap-2">
          <span className="select-none" aria-hidden>
            ▼
          </span>
          Detailed Scheduling Guide (vouchers, promotions, flash sales...)
        </summary>
        <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
          Scroll within this box for full details. Click the header again to collapse.
        </p>
        <div className="mt-3 space-y-3 text-xs text-gray-700 dark:text-gray-300">
          {hintSections.map((section) => (
            <div key={section.title}>
              <p className="font-semibold text-gray-800 dark:text-white/90 mb-1">{section.title}</p>
              <ul className="list-disc pl-4 space-y-2 leading-relaxed">
                {section.bullets.map((b, idx) => (
                  <li key={`${section.title}-${idx}`}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>

      <div className="w-full mb-6 text-left">
        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Quick pick</label>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setQuickTime("30m")}
            className="px-3 py-1.5 text-xs font-medium border rounded-full text-gray-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors dark:text-gray-400 dark:border-gray-700 dark:hover:bg-brand-900/20 dark:hover:border-brand-700 dark:hover:text-brand-400"
          >
            In 30 minutes
          </button>
          <button
            type="button"
            onClick={() => setQuickTime("1h")}
            className="px-3 py-1.5 text-xs font-medium border rounded-full text-gray-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors dark:text-gray-400 dark:border-gray-700 dark:hover:bg-brand-900/20 dark:hover:border-brand-700 dark:hover:text-brand-400"
          >
            In 1 hour
          </button>
          <button
            type="button"
            onClick={() => setQuickTime("tomorrow")}
            className="px-3 py-1.5 text-xs font-medium border rounded-full text-gray-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors dark:text-gray-400 dark:border-gray-700 dark:hover:bg-brand-900/20 dark:hover:border-brand-700 dark:hover:text-brand-400"
          >
            Tomorrow 9:00
          </button>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
          Send time <span className="text-error-500">*</span>
        </label>
        <DatePicker
          id={`campaign-schedule-at-${mode}`}
          enableTime={true}
          dateFormat="Y-m-d H:i"
          minDate={effectiveMinDate}
          maxDate={effectiveMaxDate}
          defaultDate={selectedDate || undefined}
          onChange={([date]) =>
            setSelectedDate(date ? clampDate(date, effectiveMinDate, effectiveMaxDate) : null)
          }
          placeholder="Select date and time"
        />

        {campaignId != null ? (
          <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs dark:border-gray-700 dark:bg-gray-900/40">
            <p className="mb-1 font-semibold text-gray-800 dark:text-gray-200">Allowed Time Range (VN Time)</p>
            {boundsLoading ? (
              <p className="text-gray-600 dark:text-gray-400">Loading from server...</p>
            ) : boundsError ? (
              <>
                <p className="text-amber-800 dark:text-amber-200/90 mb-2">
                  Failed to load precise range from server. Using general system limits; try refreshing or checking your connection.
                </p>
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  Allowed between {formatVnFromDate(effectiveMinDate)} and {formatVnFromDate(effectiveMaxDate)} (local time)
                </p>
              </>
            ) : scheduleBounds && scheduleBounds.isFeasible ? (
              <>
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  Can be scheduled from {formatVnDateTime(scheduleBounds.earliestUtc)} to {formatVnDateTime(scheduleBounds.latestUtc)}
                </p>
                <p className="mt-2 text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  Please select a time within the above range. When aligning with vouchers or promotions, ensure matching timezones (e.g., both viewing in local Vietnam time).
                </p>
                {!scheduleBounds.referenceRulesApplied ? (
                  <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-400">
                    Currently applying only general system boundaries (not intersected with detailed promotion rules).
                  </p>
                ) : null}
                {scheduleBounds.referenceHintWarning ? (
                  <p className="mt-1 text-amber-800 dark:text-amber-200/90">{scheduleBounds.referenceHintWarning}</p>
                ) : null}
              </>
            ) : scheduleBounds && !scheduleBounds.isFeasible ? (
              <p className="text-error-600 dark:text-error-400">
                No valid scheduling window remains (no intersection between promotion dates and system limits). Please modify the promotion or campaign; you cannot submit this schedule.
              </p>
            ) : null}
          </div>
        ) : null}

        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          {campaignId != null ? (
            <>
              The date picker is restricted to the "Allowed Time Range" shown above (
              {boundsError || (!boundsLoading && scheduleBounds !== null && !scheduleBounds.isFeasible) ? "currently using safe limits — " : ""}
              minimum {SCHEDULE_MIN_LEAD_MINUTES} minutes after current time; maximum {SCHEDULE_MAX_LEAD_DAYS} days
              {scheduleBounds?.isFeasible ? ", intersected with promotion rules if applicable" : ""}). Click Confirm to save.
            </>
          ) : (
            <>
              Select a send time at least {SCHEDULE_MIN_LEAD_MINUTES} minutes after the current time and no further than {SCHEDULE_MAX_LEAD_DAYS} days (general system rule).
            </>
          )}
        </p>

        {mode === "schedule" && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Valid from / Valid to (optional): Restricts the send time to this range only when both boundaries are specified and 'Valid from' is earlier than 'Valid to'. This does not replace the voucher or promotion expiration dates. For the valid <span className="font-medium">Send time</span>, see the allowed bounds below the Send time field.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Valid from</label>
              <DatePicker
                id="campaign-valid-from"
                enableTime={true}
                dateFormat="Y-m-d H:i"
                defaultDate={validFrom || undefined}
                onChange={([date]) => setValidFrom(date ?? null)}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Valid to</label>
              <DatePicker
                id="campaign-valid-to"
                enableTime={true}
                dateFormat="Y-m-d H:i"
                defaultDate={validTo || undefined}
                onChange={([date]) => setValidTo(date ?? null)}
                placeholder="Optional"
              />
            </div>
          </div>
        )}

        {mode === "reschedule" && (
          <div className="mt-4">
            <label htmlFor="campaign-reschedule-reason" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Rescheduling reason (optional, max 200 characters)
            </label>
            <TextArea
              id="campaign-reschedule-reason"
              value={reason}
              maxLength={200}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g., requested by marketing team..."
            />
          </div>
        )}
      </div>

      {showActionButtons ? (
        <div className="flex w-full gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-center"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            className="w-full justify-center bg-brand-500 hover:bg-brand-600 text-white"
            disabled={isSubmitting || !selectedDate || awaitingBounds || infeasibleWindow}
          >
            Confirm
          </Button>
        </div>
      ) : null}
    </form>
  );
};

