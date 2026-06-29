"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { campaignApi } from "../services/campaign-api";
import type { CampaignScheduleBounds } from "../types/campaign";
import {
  SCHEDULE_MAX_LEAD_DAYS,
  SCHEDULE_MIN_LEAD_MINUTES,
} from "../utils/campaign-schedule-hints";
import { clampDate } from "../utils/campaign-schedule-time";

export interface ScheduleLimits {
  minLeadMinutes: number;
  maxFutureDays: number;
  voucherEndBufferHours: number;
  saleLeadWindowHours: number;
}

const DEFAULT_LIMITS: ScheduleLimits = {
  minLeadMinutes: SCHEDULE_MIN_LEAD_MINUTES,
  maxFutureDays: SCHEDULE_MAX_LEAD_DAYS,
  voucherEndBufferHours: 2,
  saleLeadWindowHours: 24,
};

function pickLimits(bounds: CampaignScheduleBounds | null): ScheduleLimits {
  if (!bounds) return DEFAULT_LIMITS;
  return {
    minLeadMinutes: bounds.minLeadMinutes ?? SCHEDULE_MIN_LEAD_MINUTES,
    maxFutureDays: bounds.maxFutureDays ?? SCHEDULE_MAX_LEAD_DAYS,
    voucherEndBufferHours: bounds.voucherEndBufferHours ?? 2,
    saleLeadWindowHours: bounds.saleLeadWindowHours ?? 24,
  };
}

function computeFallbackWindow(limits: ScheduleLimits): { min: Date; max: Date } {
  const min = new Date();
  min.setSeconds(0, 0);
  min.setMinutes(min.getMinutes() + limits.minLeadMinutes);
  const max = new Date();
  max.setSeconds(0, 0);
  max.setDate(max.getDate() + limits.maxFutureDays);
  return { min, max };
}

function computeEffectiveWindow(
  bounds: CampaignScheduleBounds | null,
  limits: ScheduleLimits,
  boundsError: boolean,
): { effectiveMin: Date; effectiveMax: Date; isFeasible: boolean } {
  const fallback = computeFallbackWindow(limits);

  if (!bounds || boundsError) {
    return { effectiveMin: fallback.min, effectiveMax: fallback.max, isFeasible: true };
  }

  if (!bounds.isFeasible) {
    return { effectiveMin: fallback.min, effectiveMax: fallback.max, isFeasible: false };
  }

  const refMin = new Date(bounds.earliestUtc);
  const refMax = new Date(bounds.latestUtc);
  const effectiveMin = refMin > fallback.min ? refMin : fallback.min;
  const effectiveMax = refMax < fallback.max ? refMax : fallback.max;

  return {
    effectiveMin,
    effectiveMax,
    isFeasible: effectiveMin <= effectiveMax,
  };
}

export const useCampaignScheduleBounds = (campaignId: number | null, loadBounds = true) => {
  const [bounds, setBounds] = useState<CampaignScheduleBounds | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [boundsError, setBoundsError] = useState(false);

  const limits = useMemo(() => pickLimits(bounds), [bounds]);

  const { effectiveMin, effectiveMax, isFeasible } = useMemo(
    () => computeEffectiveWindow(bounds, limits, boundsError),
    [bounds, limits, boundsError],
  );

  const reload = useCallback(() => {
    if (!loadBounds || campaignId == null) {
      setBounds(null);
      setBoundsError(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setBoundsError(false);
    setBounds(null);

    void campaignApi
      .getScheduleBounds(campaignId)
      .then((b) => {
        if (!cancelled) setBounds(b);
      })
      .catch(() => {
        if (!cancelled) {
          setBoundsError(true);
          setBounds(null);
          toast.error("Failed to load scheduling window from server. Using general limits.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [campaignId, loadBounds]);

  useEffect(() => {
    const cleanup = reload();
    return cleanup;
  }, [reload]);

  const clampToEffective = useCallback(
    (d: Date) => clampDate(d, effectiveMin, effectiveMax),
    [effectiveMin, effectiveMax],
  );

  return {
    bounds,
    limits,
    isLoading,
    boundsError,
    effectiveMin,
    effectiveMax,
    isFeasible,
    clampToEffective,
    reload,
  };
};
