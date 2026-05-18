import type { AxiosError } from "axios";

type ErrorBody = { code?: string; message?: string };

type ValidationBody = ErrorBody & {
  errors?: Record<string, string[]>;
};

/** Maps template / generic API error codes to user-facing copy when message is generic. */
const TEMPLATE_ERROR_MESSAGE_BY_CODE: Partial<Record<string, string>> = {
  CONFLICT: "This template code is already in use.",
  NOT_FOUND: "Template was not found.",
  BUSINESS_RULE_VIOLATION: "This action is not allowed for this template.",
  VALIDATION_ERROR: "Please check the form fields.",
};

function flattenValidationErrors(errors: Record<string, string[]> | undefined): string | null {
  if (!errors || Object.keys(errors).length === 0) return null;
  const parts = Object.values(errors)
    .flat()
    .filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

/** Message to show for template API failures (create/update). */
export function getTemplateMutationErrorMessage(error: unknown, fallback: string): string {
  const ax = error as AxiosError<ValidationBody>;
  const status = ax.response?.status;
  const data = ax.response?.data;

  if (data?.code === "VALIDATION_ERROR" && data.errors) {
    const flat = flattenValidationErrors(data.errors);
    if (flat) return flat;
  }

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message.trim();
  }

  if (data?.code && TEMPLATE_ERROR_MESSAGE_BY_CODE[data.code]) {
    return TEMPLATE_ERROR_MESSAGE_BY_CODE[data.code]!;
  }

  if (status === 409) return TEMPLATE_ERROR_MESSAGE_BY_CODE.CONFLICT!;

  return fallback;
}

/** Message for list load failures. */
export function getTemplateListErrorMessage(error: unknown, fallback: string): string {
  const ax = error as AxiosError<ErrorBody>;
  const data = ax.response?.data;
  if (typeof data?.message === "string" && data.message.trim()) return data.message.trim();
  return getTemplateMutationErrorMessage(error, fallback);
}
