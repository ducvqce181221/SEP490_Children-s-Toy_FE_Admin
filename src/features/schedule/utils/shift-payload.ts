import { ShiftTemplate, ShiftTemplateFormData, ShiftTemplateUpdatePayload } from "../types/shift";

/**
 * Tạo payload đầy đủ cho POST /api/shift-templates
 */
export function buildCreatePayload(form: ShiftTemplateFormData): ShiftTemplateFormData {
  return {
    shiftName: form.shiftName.trim(),
    startTime: form.startTime,
    endTime: form.endTime,
    maxOrdersPerShift: form.maxOrdersPerShift,
    isActive: form.isActive,
  };
}

/**
 * Tạo payload chỉ gồm các field thực sự thay đổi cho PUT /api/shift-templates/{id}
 *
 * Quy tắc:
 * - timeLocked: chỉ gửi shiftName, maxOrdersPerShift nếu khác giá trị cũ
 * - Không locked: gửi field nào thay đổi; nếu đổi giờ phải gửi cả start + end
 * - Trả về null nếu không có gì thay đổi
 */
export function buildUpdatePayload(
  form: ShiftTemplateFormData,
  initial: ShiftTemplate,
  options: { timeLocked: boolean },
): ShiftTemplateUpdatePayload | null {
  const payload: ShiftTemplateUpdatePayload = {};

  const trimmedName = form.shiftName.trim();
  if (trimmedName !== initial.shiftName) {
    payload.shiftName = trimmedName;
  }

  if (form.maxOrdersPerShift !== initial.maxOrdersPerShift) {
    payload.maxOrdersPerShift = form.maxOrdersPerShift;
  }

  if (!options.timeLocked) {
    const newStart = form.startTime;
    const newEnd = form.endTime;
    const existingStart = initial.startTime.slice(0, 5);
    const existingEnd = initial.endTime.slice(0, 5);

    const startChanged = newStart !== existingStart;
    const endChanged = newEnd !== existingEnd;

    // Đổi giờ phải gửi cả start + end để backend có thể kiểm tra tính hợp lệ
    if (startChanged || endChanged) {
      payload.startTime = newStart;
      payload.endTime = newEnd;
    }

    if (form.isActive !== initial.isActive) {
      payload.isActive = form.isActive;
    }
  }

  if (Object.keys(payload).length === 0) return null;
  return payload;
}
