import { format } from "date-fns";

/**
 * Chuyển đổi một chuỗi ISO UTC thành định dạng datetime-local (YYYY-MM-DDTHH:mm)
 * dựa trên múi giờ địa phương của người dùng.
 */
export const formatUTCtoLocal = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
};

/**
 * Chuyển đổi giá trị từ datetime-local thành ISO UTC string để gửi lên API.
 */
export const formatLocalToUTC = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toISOString();
};

/**
 * Định dạng ngày để hiển thị trên UI (giống với trang danh sách)
 * Định dạng: dd/MM/yyyy HH:mm
 */
export const formatDisplayDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return format(date, "dd/MM/yyyy HH:mm");
};
