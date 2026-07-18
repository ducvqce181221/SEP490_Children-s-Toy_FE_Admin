"use client";

import React, { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/form/date-picker";
import TextArea from "@/components/form/input/TextArea";
import type { CampaignScheduleBounds } from "../types/campaign";
import type {
  CampaignScheduleContext,
  CampaignScheduleFormPayload,
  CampaignScheduleFormSubmitState,
} from "../types/campaign-schedule";
import { CAMPAIGN_SCHEDULE_FORM_ID } from "../types/campaign-schedule";
import { useCampaignScheduleBounds } from "../hooks/useCampaignScheduleBounds";
import {
  getCampaignScheduleHintSections,
  getCampaignScheduleShortSummary,
  SCHEDULE_MIN_LEAD_MINUTES,
} from "../utils/campaign-schedule-hints";
import {
  addHoursUtc,
  addMinutesUtc,
  clampDate,
  formatCampaignScheduleDisplay,
  getTomorrowNineAmVn,
  isDateWithinRange,
} from "../utils/campaign-schedule-time";

export type { CampaignScheduleFormPayload, CampaignScheduleContext } from "../types/campaign-schedule";

type FormStep = "all" | "pick";

function validateScheduleSelection(
  selectedDate: Date | null,
  validFrom: Date | null,
  validTo: Date | null,
  effectiveMin: Date,
  effectiveMax: Date,
  isFeasible: boolean,
  mode: "schedule" | "reschedule",
  reason: string,
): string | null {
  if (!isFeasible) {
    return "No valid scheduling window remains. Please modify the promotion or campaign.";
  }
  if (!selectedDate) return null;

  if (!isDateWithinRange(selectedDate, effectiveMin, effectiveMax)) {
    return "Send time is outside the allowed scheduling window. Choose a time within the range shown below.";
  }

  if (mode === "schedule" && validFrom && validTo) {
    if (validFrom.getTime() >= validTo.getTime()) {
      return "Invalid valid-from/valid-to range: 'Valid from' must be before 'Valid to'.";
    }
    if (
      selectedDate.getTime() < validFrom.getTime() ||
      selectedDate.getTime() > validTo.getTime()
    ) {
      return "Send time falls outside the valid-from/valid-to range. Adjust the send time or clear the valid fields.";
    }
  }

  if (mode === "reschedule" && reason.trim().length > 200) {
    return "Reschedule reason cannot exceed 200 characters.";
  }

  return null;
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
  /** Wizard: only render pick-time section */
  formStep?: FormStep;
  /** Optional injected bounds (wizard shares one fetch) */
  bounds?: CampaignScheduleBounds | null;
  boundsLoading?: boolean;
  boundsError?: boolean;
  effectiveMin?: Date;
  effectiveMax?: Date;
  isFeasible?: boolean;
  limits?: {
    minLeadMinutes: number;
    maxFutureDays: number;
    voucherEndBufferHours: number;
    saleLeadWindowHours: number;
  };
  clampToEffective?: (d: Date) => Date;
  onSubmitStateChange?: (state: CampaignScheduleFormSubmitState) => void;
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
  formStep = "all",
  bounds: injectedBounds,
  boundsLoading: injectedBoundsLoading,
  boundsError: injectedBoundsError,
  effectiveMin: injectedEffectiveMin,
  effectiveMax: injectedEffectiveMax,
  isFeasible: injectedIsFeasible,
  limits: injectedLimits,
  clampToEffective: injectedClamp,
  onSubmitStateChange,
}) => {
  const internalBounds = useCampaignScheduleBounds(campaignId, loadBounds && injectedBounds === undefined);

  const scheduleBounds = injectedBounds !== undefined ? injectedBounds : internalBounds.bounds;
  const boundsLoading =
    injectedBoundsLoading !== undefined ? injectedBoundsLoading : internalBounds.isLoading;
  const boundsError =
    injectedBoundsError !== undefined ? injectedBoundsError : internalBounds.boundsError;
  const effectiveMin = injectedEffectiveMin ?? internalBounds.effectiveMin;
  const effectiveMax = injectedEffectiveMax ?? internalBounds.effectiveMax;
  const isFeasible = injectedIsFeasible ?? internalBounds.isFeasible;
  const limits = injectedLimits ?? internalBounds.limits;
  const clampToEffective = injectedClamp ?? internalBounds.clampToEffective;

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [validFrom, setValidFrom] = useState<Date | null>(null);
  const [validTo, setValidTo] = useState<Date | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      setSelectedDate(null);
      setValidFrom(null);
      setValidTo(null);
      setReason("");
    });
  }, [mode, campaignId]);

  useEffect(() => {
    if (!scheduleBounds || boundsLoading) return;
    queueMicrotask(() => {
      if (!scheduleBounds.isFeasible) {
        setSelectedDate(null);
        return;
      }
      setSelectedDate((prev) => {
        if (!prev) return prev;
        const clamped = clampDate(prev, effectiveMin, effectiveMax);
        return clamped.getTime() === prev.getTime() ? prev : clamped;
      });
    });
  }, [scheduleBounds, boundsLoading, effectiveMin, effectiveMax]);

  const scheduleError = useMemo(
    () =>
      validateScheduleSelection(
        selectedDate,
        validFrom,
        validTo,
        effectiveMin,
        effectiveMax,
        isFeasible,
        mode,
        reason,
      ),
    [
      selectedDate,
      validFrom,
      validTo,
      effectiveMin,
      effectiveMax,
      isFeasible,
      mode,
      reason,
    ],
  );

  const canSubmit =
    selectedDate !== null &&
    !boundsLoading &&
    isFeasible &&
    scheduleError === null;

  useEffect(() => {
    if (!onSubmitStateChange) return;
    onSubmitStateChange({
      canSubmit,
      isLoadingBounds: boundsLoading,
      isFeasible,
      selectedDate,
      validFrom,
      validTo,
      reason,
      scheduleError,
    });
  }, [
    onSubmitStateChange,
    canSubmit,
    boundsLoading,
    isFeasible,
    selectedDate,
    validFrom,
    validTo,
    reason,
    scheduleError,
  ]);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selectedDate) return;
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
    () =>
      getCampaignScheduleHintSections(
        context?.referenceType,
        context?.promotionType,
        limits,
      ),
    [context?.referenceType, context?.promotionType, limits],
  );

  const shortSummary = useMemo(
    () =>
      getCampaignScheduleShortSummary(
        context?.referenceType,
        context?.promotionType,
        limits,
      ),
    [context?.referenceType, context?.promotionType, limits],
  );

  const setQuickTime = (type: "minLead" | "1h" | "tomorrow") => {
    const now = new Date();
    let d: Date;
    if (type === "minLead") {
      d = addMinutesUtc(now, SCHEDULE_MIN_LEAD_MINUTES);
    } else if (type === "1h") {
      d = addHoursUtc(now, 1);
    } else {
      d = getTomorrowNineAmVn(now);
    }
    setSelectedDate(clampToEffective(d));
  };

  const showPickSection = formStep === "all" || formStep === "pick";
  const title = mode === "reschedule" ? "Reschedule Send Time" : "Schedule Send Time";

  return (
    <form
      id={CAMPAIGN_SCHEDULE_FORM_ID}
      onSubmit={(e) => void handleSubmitForm(e)}
      className={className}
    >
      {!compactIntro && formStep === "all" ? (
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
          <p className="mb-2 text-center text-sm text-gray-600 dark:text-gray-400 px-2 leading-relaxed">
            All times shown in Vietnam Time (GMT+7). The server stores send time as UTC.
          </p>
          {context?.campaignName ? (
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400 text-center">
              Campaign: <span className="font-medium text-gray-700 dark:text-gray-300 break-all">{context.campaignName}</span>
            </p>
          ) : (
            <div className="mb-4" />
          )}
        </div>
      ) : null}

      {formStep === "all" ? (
        <ul className="mb-4 space-y-1 text-xs text-gray-600 dark:text-gray-400 list-disc pl-4">
          {shortSummary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}

      {showPickSection ? (
        <>
          <details
            className="w-full mb-4 rounded-lg border border-brand-100 bg-brand-50/50 px-3 py-2 text-left dark:border-brand-500/20 dark:bg-brand-500/10"
          >
            <summary className="cursor-pointer text-sm font-semibold text-brand-800 dark:text-brand-200 list-none flex items-center gap-2">
              <span className="select-none" aria-hidden>▼</span>
              Full scheduling rules
            </summary>
            <div className="mt-3 space-y-3 text-xs text-gray-700 dark:text-gray-300 max-h-48 overflow-y-auto">
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
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Quick select</label>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => setQuickTime("minLead")}
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
                Tomorrow 9:00 VN
              </button>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Send time <span className="text-error-500">*</span>
              <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                (Vietnam Time, GMT+7)
              </span>
            </label>
            <DatePicker
              id={`campaign-schedule-at-${mode}`}
              enableTime={true}
              dateFormat="Y-m-d H:i"
              minDate={effectiveMin}
              maxDate={effectiveMax}
              defaultDate={selectedDate || undefined}
              onChange={([date]) =>
                setSelectedDate(date ? clampToEffective(date) : null)
              }
              placeholder="Select date and time"
            />

            {scheduleError ? (
              <p className="mt-2 text-sm text-error-600 dark:text-error-400" role="alert">
                {scheduleError}
              </p>
            ) : null}

            {campaignId != null ? (
              <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs dark:border-gray-700 dark:bg-gray-900/40">
                <p className="mb-1 font-semibold text-gray-800 dark:text-gray-200">
                  Allowed window (Vietnam Time)
                </p>
                {boundsLoading ? (
                  <p className="text-gray-600 dark:text-gray-400">Loading from server...</p>
                ) : boundsError ? (
                  <>
                    <p className="text-amber-800 dark:text-amber-200/90 mb-2">
                      Failed to load precise range. Using general system limits.
                    </p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {formatCampaignScheduleDisplay(effectiveMin)} — {formatCampaignScheduleDisplay(effectiveMax)}
                    </p>
                  </>
                ) : scheduleBounds && scheduleBounds.isFeasible ? (
                  <>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {formatCampaignScheduleDisplay(scheduleBounds.earliestUtc)} —{" "}
                      {formatCampaignScheduleDisplay(scheduleBounds.latestUtc)}
                    </p>
                    {!scheduleBounds.referenceRulesApplied ? (
                      <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-400">
                        Applying general system boundaries only (reference rules not intersected).
                      </p>
                    ) : null}
                    {scheduleBounds.referenceHintWarning ? (
                      <p className="mt-1 text-amber-800 dark:text-amber-200/90">
                        {scheduleBounds.referenceHintWarning}
                      </p>
                    ) : null}
                  </>
                ) : scheduleBounds && !scheduleBounds.isFeasible ? (
                  <p className="text-error-600 dark:text-error-400">
                    No valid scheduling window remains. You cannot submit this schedule.
                  </p>
                ) : null}
              </div>
            ) : null}

            {mode === "schedule" && (
              <details className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 list-none">
                  Advanced: valid from / to (optional)
                </summary>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Restricts send time when both fields are set. Does not replace voucher or promotion expiry.
                </p>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Valid from</label>
                    <DatePicker
                      id="campaign-valid-from"
                      enableTime={true}
                      dateFormat="Y-m-d H:i"
                      minDate={effectiveMin}
                      maxDate={effectiveMax}
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
                      minDate={effectiveMin}
                      maxDate={effectiveMax}
                      defaultDate={validTo || undefined}
                      onChange={([date]) => setValidTo(date ?? null)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </details>
            )}

            {mode === "reschedule" && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="campaign-reschedule-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reschedule reason (optional)
                  </label>
                  <span className={`text-xs font-medium ${(reason || "").length > 200 ? "text-error-500 font-bold" : "text-gray-400 dark:text-gray-500"}`}>
                    {(reason || "").length}/200
                  </span>
                </div>
                <TextArea
                  id="campaign-reschedule-reason"
                  value={reason}
                  maxLength={200}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="e.g., requested by marketing team..."
                />
                {(reason || "").trim().length > 200 ? (
                  <p className="mt-1 text-sm text-error-600 dark:text-error-400" role="alert">
                    Reschedule reason cannot exceed 200 characters.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </>
      ) : null}

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
            disabled={isSubmitting || !canSubmit}
          >
            Confirm
          </Button>
        </div>
      ) : null}
    </form>
  );
};
