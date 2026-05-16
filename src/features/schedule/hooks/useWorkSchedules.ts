"use client";

import { useState, useEffect, useCallback } from "react";
import { scheduleApi } from "../services/schedule-api";
import { WorkSchedule, WorkScheduleQuery } from "../types/schedule";
import toast from "react-hot-toast";

export const useWorkSchedules = (initialQuery?: WorkScheduleQuery) => {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<WorkScheduleQuery>(initialQuery || {});

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await scheduleApi.getWorkSchedules(query);
      setSchedules(data);
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
      setError("Cannot load work schedules");
      toast.error("Cannot load work schedules");
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const updateQuery = (newQuery: Partial<WorkScheduleQuery>) => {
    setQuery(prev => ({ ...prev, ...newQuery }));
  };

  return {
    schedules,
    isLoading,
    error,
    query,
    updateQuery,
    refetch: fetchSchedules,
  };
};
