import { z } from "zod";

export interface WorkSchedule {
  scheduleId: number;
  accountId: number;
  accountName: string;
  roleId?: number;
  shiftTemplateId: number;
  shiftName: string;
  workDate: string; // ISO datetime string from backend
  status: string;   // "Scheduled", "Completed", "Cancelled"
  currentLoad: number;
  maxLoad: number;
  imageUrl?: string;
}

export const WorkScheduleSchema = z.object({
  accountId: z.number().min(1, "Staff selection is required"),
  shiftTemplateId: z.number().min(1, "Shift selection is required"),
  workDate: z.string().min(1, "Work date is required"),
});

export type WorkScheduleFormData = z.infer<typeof WorkScheduleSchema>;

// Aligned with backend WorkScheduleQueryDto
export interface WorkScheduleQuery {
  workDate?: string;   // "YYYY-MM-DD" - maps to backend WorkDate
  status?: string;     // "Scheduled" | "Completed" | "Cancelled"
  roleId?: number;     // filter by role
}
