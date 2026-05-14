import axiosClient from "@/configs/axios-client";
import { ShiftTemplate, ShiftTemplateFormData } from "../types/shift";
import { WorkSchedule, WorkScheduleFormData, WorkScheduleQuery } from "../types/schedule";

export const scheduleApi = {
  // ─── Shift Templates ─────────────────────────────────────────────────────────
  // Backend route: GET /api/shift-templates
  getShiftTemplates: () =>
    axiosClient.get<ShiftTemplate[]>("/shift-templates"),

  // Backend route: POST /api/shift-templates
  createShiftTemplate: (data: ShiftTemplateFormData) =>
    axiosClient.post<ShiftTemplate>("/shift-templates", data),

  // Backend route: PUT /api/shift-templates/{shiftTemplateId}
  updateShiftTemplate: (id: number, data: ShiftTemplateFormData) =>
    axiosClient.put<ShiftTemplate>(`/shift-templates/${id}`, data),

  // NOTE: Backend does NOT have a DELETE endpoint for shift-templates.
  // Use updateShiftTemplate with isActive=false to deactivate instead.
  deactivateShiftTemplate: (id: number, currentData: ShiftTemplateFormData) =>
    axiosClient.put<ShiftTemplate>(`/shift-templates/${id}`, {
      ...currentData,
      isActive: false,
    }),

  // ─── Work Schedules ──────────────────────────────────────────────────────────
  // Backend route: GET /api/work-schedules?workDate=...&status=...&roleId=...
  getWorkSchedules: (params?: WorkScheduleQuery) =>
    axiosClient.get<WorkSchedule[]>("/work-schedules", { params }),

  // Backend route: POST /api/work-schedules
  createWorkSchedule: (data: WorkScheduleFormData) =>
    axiosClient.post<WorkSchedule>("/work-schedules", data),

  // Backend route: PUT /api/work-schedules/{scheduleId}
  updateWorkSchedule: (id: number, data: WorkScheduleFormData) =>
    axiosClient.put<WorkSchedule>(`/work-schedules/${id}`, data),

  // Backend route: DELETE /api/work-schedules/{scheduleId}
  deleteWorkSchedule: (id: number) =>
    axiosClient.delete(`/work-schedules/${id}`),

  // Backend route: PUT /api/work-schedules/{scheduleId}/absent
  markAbsentWorkSchedule: (id: number) =>
    axiosClient.put(`/work-schedules/${id}/absent`),

  // ─── Capacity / Monitoring ───────────────────────────────────────────────────
  getStaffCapacity: (date: string) =>
    axiosClient.get(`/work-schedules?workDate=${date}`),
};
