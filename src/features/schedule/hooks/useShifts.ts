"use client";

import { useState, useEffect, useCallback } from "react";
import { scheduleApi } from "../services/schedule-api";
import { ShiftTemplate } from "../types/shift";

export type UseShiftsOptions = {
  /** Admin shift management page: include inactive templates. Schedule picker: active only. */
  includeInactive?: boolean;
};

export const useShifts = (options: UseShiftsOptions = {}) => {
  const { includeInactive = false } = options;
  const [shifts, setShifts] = useState<ShiftTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShifts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await scheduleApi.getShiftTemplates(
        includeInactive ? { includeInactive: true } : undefined
      );
      setShifts(data);
    } catch (err) {
      console.error("Failed to fetch shifts:", err);
      setError("Cannot load shift templates");
    } finally {
      setIsLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  return {
    shifts,
    isLoading,
    error,
    refetch: fetchShifts,
  };
};
