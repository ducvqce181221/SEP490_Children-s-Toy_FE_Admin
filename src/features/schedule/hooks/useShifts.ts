"use client";

import { useState, useEffect, useCallback } from "react";
import { scheduleApi } from "../services/schedule-api";
import { ShiftTemplate } from "../types/shift";
import toast from "react-hot-toast";

export const useShifts = () => {
  const [shifts, setShifts] = useState<ShiftTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShifts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await scheduleApi.getShiftTemplates();
      setShifts(data);
    } catch (err) {
      console.error("Failed to fetch shifts:", err);
      setError("Cannot load shift templates");
    } finally {
      setIsLoading(false);
    }
  }, []);

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
