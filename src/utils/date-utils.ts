import { format, parseISO, isValid } from "date-fns";

/**
 * Đảm bảo chuỗi ngày tháng từ DateTime2 (UTC+0) được chuẩn hóa sang ISO 8601
 */
const ensureUTC = (dateString: string): string => {
  if (!dateString) return "";
  // 1. Thay khoảng trắng bằng 'T' (Ví dụ: "2024-01-01 08:00" -> "2024-01-01T08:00")
  let formatted = dateString.replace(" ", "T");
  // 2. Thêm 'Z' nếu thiếu thông tin múi giờ
  if (!formatted.includes("Z") && !formatted.includes("+")) {
    formatted += "Z";
  }
  return formatted;
};

/**
 * UTC (API) -> Local (Input datetime-local)
 */
export const formatUTCtoLocal = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  const date = parseISO(ensureUTC(dateString));
  return isValid(date) ? format(date, "yyyy-MM-dd'T'HH:mm") : "";
};

/**
 * Local (Input) -> UTC String (API)
 */
export const formatLocalToUTC = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  // Input datetime-local trả về định dạng chuẩn mà constructor Date hiểu được ngay
  const date = new Date(dateString); 
  return isValid(date) ? date.toISOString() : "";
};

/**
 * UTC (API) -> Local (UI Display)
 */
export const formatDisplayDate = (dateString: string | null | undefined, fallback = "-"): string => {
  if (!dateString) return fallback;
  const date = parseISO(ensureUTC(dateString));
  return isValid(date) ? format(date, "dd/MM/yyyy HH:mm") : fallback;
};

/**
 * Trả về thời gian tương lai tối thiểu cho phép (hiện tại + 9 phút) để bù trừ
 * khi input datetime-local bị cắt mất phần giây.
 * Dùng cho validation form.
 */
export const getMinimumFutureTime = (): number => {
  return Date.now() + 9 * 60000;
};

/**
 * Trả về thời gian lý tưởng để tự động điền vào form (hiện tại + 10 phút).
 * Dùng cho defaultValues.
 */
export const getIdealFutureTime = (): number => {
  return Date.now() + 10 * 60000;
};

