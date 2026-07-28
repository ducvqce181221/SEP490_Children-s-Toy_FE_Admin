import type { AxiosError } from "axios";

type ApiErrorBody = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  title?: string;
  Title?: string;
  errors?: Record<string, string[]>;
  Errors?: Record<string, string[]>;
};

function asErrorBody(data: unknown): ApiErrorBody {
  if (!data || typeof data !== "object") return {};
  return data as ApiErrorBody;
}

function pickMessage(data: ApiErrorBody): string | undefined {
  const msg = data.message ?? data.Message ?? data.title ?? data.Title;
  return typeof msg === "string" && msg.trim() ? msg.trim() : undefined;
}

function pickFieldErrors(data: ApiErrorBody): Record<string, string[]> | undefined {
  const raw = data.errors ?? data.Errors;
  if (!raw || typeof raw !== "object") return undefined;
  return raw;
}

function summarizeFieldErrors(errors: Record<string, string[]>): string | null {
  const parts = Object.values(errors)
    .flat()
    .filter((m): m is string => typeof m === "string" && m.trim().length > 0)
    .slice(0, 3);
  return parts.length ? parts.join(" ") : null;
}

/**
 * Resolves a user-facing error message from a voucher API failure.
 */
export function getVoucherMutationErrorMessage(error: unknown, fallback: string): string {
  const ax = error as AxiosError<ApiErrorBody>;
  const status = ax.response?.status;
  const data = asErrorBody(ax.response?.data);

  const fieldSummary = summarizeFieldErrors(pickFieldErrors(data) ?? {});
  if (fieldSummary) return fieldSummary;

  const apiMessage = pickMessage(data);
  if (apiMessage) return apiMessage;

  if (status === 404) return "Voucher was not found.";
  if (status === 409) return "Voucher code already exists.";
  if (status === 500) return "Server error. Please try again later.";

  return fallback;
}
