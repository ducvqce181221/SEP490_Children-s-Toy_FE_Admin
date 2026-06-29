import type { AxiosError } from "axios";
import {
  SALE_LEAD_HOURS_BEFORE_START,
  SCHEDULE_MAX_LEAD_DAYS,
  SCHEDULE_MIN_LEAD_MINUTES,
  VOUCHER_END_BUFFER_HOURS,
  VOUCHER_EXPIRING_WARN_HOURS,
} from "./campaign-schedule-hints";

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

/** User-facing messages for campaign domain (falls back to API message). Uses numbers from campaign-schedule-hints to align with backend constraints. */
const CAMPAIGN_ERROR_MESSAGE_BY_CODE: Partial<Record<string, string>> = {
  SOURCE_TYPE_INVALID: "Invalid campaign source type.",
  CONTENT_REQUIRED: "Content is required (either template or custom title and body).",
  TEMPLATE_NOT_FOUND: "Notification template does not exist or has been deactivated.",
  TARGET_REQUIRED: "At least one target recipient must be selected.",
  TARGET_ACCOUNT_INVALID: "One or more recipient accounts are invalid.",
  REFERENCE_INCONSISTENT: "Linked reference type and ID are inconsistent.",
  REFERENCE_NOT_FOUND:
    "Linked reference could not be found or is unavailable: vouchers must be Active; promotions must be Active or Scheduled; blog posts must be Published.",
  NAME_REQUIRED: "Campaign name is required.",
  FORBIDDEN: "You do not have permission to perform this action.",
  NOT_FOUND: "The requested campaign or resource was not found.",
  CONFLICT: "Campaign name already exists. Please choose a different name.",
  VALIDATION_ERROR: "One or more validation errors occurred. Please check the form and try again.",
  BUSINESS_RULE_VIOLATION: "This action could not be completed due to a business rule violation.",
  INVALID_STATUS_TRANSITION:
    "This action is not allowed in the campaign's current status. Only Approved campaigns can be scheduled, and only Scheduled campaigns can be rescheduled. Please refresh the page and try again.",
  REFERENCE_EXPIRED: "Linked reference (voucher/promotion) is no longer valid (either expired or changed status).",
  SCHEDULE_NOT_ALLOWED_AT_SUBMIT:
    "Scheduling is not allowed when submitting for review. Please clear the scheduled date and schedule it only after it has been approved.",
  SCHEDULE_NOT_ALLOWED_AT_CREATE:
    "Cannot set schedule date during campaign creation. Please schedule the campaign using the 'Schedule' button after it is approved.",
  REVIEWER_CANNOT_BE_SUBMITTER: "The reviewer cannot be the same person who submitted the campaign.",
  REFERENCE_ALREADY_EXPIRED: "The linked reference (voucher/promotion) has already expired.",
  TEMPLATE_DEACTIVATED: "Notification template is currently deactivated.",
  REVIEW_NOTE_REQUIRED: "A review note is required when rejecting the campaign.",
  APPROVED_EXPIRED:
    "Approval period has expired: campaigns must be scheduled within the allowed timeframe after approval. Please submit for review again or create a new campaign.",
  SCHEDULED_AT_REQUIRED: "Send time has not been chosen. Please select a date and time, or use a quick option.",
  SCHEDULED_AT_TOO_SOON: `Send time must be at least ${SCHEDULE_MIN_LEAD_MINUTES} minutes in the future (server time). Choose a later time or use the 'In 30 minutes' option.`,
  SCHEDULED_AT_TOO_FAR: `Send time cannot exceed ${SCHEDULE_MAX_LEAD_DAYS} days from now. Please select a sooner date or split your campaign.`,
  VALID_RANGE_INVALID:
    "Invalid valid-from/valid-to range: 'Valid from' must be before 'Valid to'. Adjust these dates or remove them if not needed.",
  SCHEDULED_AT_OUT_OF_RANGE:
    "Send time falls outside the valid-from/valid-to range. Adjust the send time to fit within the range, or leave the valid fields blank.",
  SCHEDULED_BEFORE_VOUCHER_START: `Send time is earlier than the voucher's effective start date. Please check the voucher's start date and set a send time after it, keeping a minimum of ${SCHEDULE_MIN_LEAD_MINUTES} minutes and within ${SCHEDULE_MAX_LEAD_DAYS} days.`,
  SCHEDULED_TOO_CLOSE_TO_VOUCHER_END: `Send time must be at least ${VOUCHER_END_BUFFER_HOURS} hours before the voucher expires. For example, if the voucher ends at 17:00, send before 15:00.`,
  SCHEDULED_TOO_EARLY_FOR_SALE: `Send time is too early for the promotion: you cannot send before ${SALE_LEAD_HOURS_BEFORE_START} hours prior to the sale start date. For example, if the sale starts at 10:00 on June 20, do not send before 10:00 on June 19.`,
  SCHEDULED_AFTER_SLOT_START: "[Deprecated] Legacy flash sale error; please refresh and try again.",
  SCHEDULED_TOO_CLOSE_TO_SALE_END: `Send time must be at least ${VOUCHER_END_BUFFER_HOURS} hours before the promotion ends. Set an earlier send time to allow a ${VOUCHER_END_BUFFER_HOURS}-hour buffer.`,
  SCHEDULED_AFTER_LAUNCH:
    "Coming Soon product: cannot send after Launch Date. Notifications are only allowed before or on the launch date.",
  MAX_RESCHEDULE_EXCEEDED:
    "Maximum rescheduling limit has been reached for this campaign. Please contact support or create a new campaign.",
  CAMPAIGN_LOCKED_BY_JOB:
    "This campaign is currently locked by a background worker. Please wait a few seconds and try rescheduling again.",
  SAME_SCHEDULED_AT: "The new send time must be different from the current send time. Please select a different time.",
  REASON_TOO_LONG: "Reschedule reason cannot exceed 200 characters.",
  WARN_VOUCHER_EXPIRING_SOON: `Warning: The voucher will expire within ${VOUCHER_EXPIRING_WARN_HOURS} hours after sending. Please verify if this timeframe is appropriate for customers.`,
};

/** Maps FluentValidation / API property names to CampaignWizard field keys. */
const VALIDATION_FIELD_TO_WIZARD: Record<string, string> = {
  CampaignName: "campaignName",
  TemplateCode: "templateCode",
  ReferenceType: "referenceId",
  ReferenceId: "referenceId",
  TitleOverride: "titleOverride",
  MessageOverride: "messageOverride",
  TargetType: "targeting",
  Targets: "targeting",
  ReviewNote: "reviewNote",
};

function asErrorBody(data: unknown): ApiErrorBody {
  if (!data || typeof data !== "object") return {};
  return data as ApiErrorBody;
}

function pickCode(data: ApiErrorBody): string | undefined {
  return data.code ?? data.Code;
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
 * Parses API validation errors into wizard form field keys.
 */
export function parseCampaignValidationErrors(error: unknown): Record<string, string> {
  const ax = error as AxiosError<ApiErrorBody>;
  const fieldErrors = pickFieldErrors(asErrorBody(ax.response?.data));
  if (!fieldErrors) return {};

  const mapped: Record<string, string> = {};
  for (const [field, messages] of Object.entries(fieldErrors)) {
    const first = messages?.find((m) => typeof m === "string" && m.trim());
    if (!first) continue;
    const wizardKey = VALIDATION_FIELD_TO_WIZARD[field] ?? field;
    if (!mapped[wizardKey]) mapped[wizardKey] = first;
  }
  return mapped;
}

/**
 * Resolves a user-facing English error message from a campaign API failure.
 * Always returns a non-empty string (never null).
 */
export function getCampaignMutationErrorMessage(error: unknown, fallback: string): string {
  const ax = error as AxiosError<ApiErrorBody>;
  const status = ax.response?.status;
  const data = asErrorBody(ax.response?.data);
  const code = pickCode(data);

  if (status === 403 || code === "FORBIDDEN") {
    return CAMPAIGN_ERROR_MESSAGE_BY_CODE.FORBIDDEN ?? fallback;
  }

  if (code && CAMPAIGN_ERROR_MESSAGE_BY_CODE[code]) {
    return CAMPAIGN_ERROR_MESSAGE_BY_CODE[code]!;
  }

  const fieldSummary = summarizeFieldErrors(pickFieldErrors(data) ?? {});
  if (fieldSummary) return fieldSummary;

  const apiMessage = pickMessage(data);
  if (apiMessage) return apiMessage;

  if (status === 404) {
    return CAMPAIGN_ERROR_MESSAGE_BY_CODE.NOT_FOUND ?? "The requested campaign or resource was not found.";
  }
  if (status === 409) {
    return CAMPAIGN_ERROR_MESSAGE_BY_CODE.CONFLICT ?? fallback;
  }
  if (status === 500) return "Server error. Please try again later.";
  if (status === 502) return "A temporary service error occurred. Please try again.";

  return fallback;
}

export function translateScheduleWarningCodes(codes: string[] | null | undefined): string | null {
  if (!codes?.length) return null;
  const parts = codes
    .map((c) => CAMPAIGN_ERROR_MESSAGE_BY_CODE[c])
    .filter((s): s is string => Boolean(s));
  return parts.length ? parts.join(" ") : null;
}
