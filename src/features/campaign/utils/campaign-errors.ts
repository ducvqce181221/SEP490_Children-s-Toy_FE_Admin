import type { AxiosError } from "axios";
import {
  SALE_LEAD_HOURS_BEFORE_START,
  SCHEDULE_MAX_LEAD_DAYS,
  SCHEDULE_MIN_LEAD_MINUTES,
  VOUCHER_END_BUFFER_HOURS,
  VOUCHER_EXPIRING_WARN_HOURS,
} from "./campaign-schedule-hints";

type ErrorBody = { code?: string; message?: string };

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
  FORBIDDEN: "You do not have permission to perform this action.",
  INVALID_STATUS_TRANSITION:
    "This action is not allowed in the campaign's current status. Only Approved campaigns can be scheduled, and only Scheduled campaigns can be rescheduled. Please refresh the page and try again.",
  REFERENCE_EXPIRED: "Linked reference (voucher/promotion) is no longer valid (either expired or changed status).",
  SCHEDULE_NOT_ALLOWED_AT_SUBMIT:
    "Scheduling is not allowed when submitting for review. Please clear the scheduled date and schedule it only after it has been approved.",
  SCHEDULE_NOT_ALLOWED_AT_CREATE: "Cannot set schedule date during campaign creation. Please schedule the campaign using the 'Schedule' button after it is approved.",
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
  SCHEDULED_BEFORE_VOUCHER_START:
    `Send time is earlier than the voucher's effective start date. Please check the voucher's start date and set a send time after it, keeping a minimum of ${SCHEDULE_MIN_LEAD_MINUTES} minutes and within ${SCHEDULE_MAX_LEAD_DAYS} days.`,
  SCHEDULED_TOO_CLOSE_TO_VOUCHER_END:
    `Send time must be at least ${VOUCHER_END_BUFFER_HOURS} hours before the voucher expires. For example, if the voucher ends at 17:00, send before 15:00.`,
  SCHEDULED_TOO_EARLY_FOR_SALE:
    `Send time is too early for the promotion: you cannot send before ${SALE_LEAD_HOURS_BEFORE_START} hours prior to the sale start date. For example, if the sale starts at 10:00 on June 20, do not send before 10:00 on June 19.`,
  SCHEDULED_AFTER_SLOT_START:
    "[Deprecated] Legacy flash sale error; please refresh and try again.",
  SCHEDULED_TOO_CLOSE_TO_SALE_END:
    `Send time must be at least ${VOUCHER_END_BUFFER_HOURS} hours before the promotion ends. Set an earlier send time to allow a ${VOUCHER_END_BUFFER_HOURS}-hour buffer.`,
  SCHEDULED_AFTER_LAUNCH:
    "Coming Soon product: cannot send after Launch Date. Notifications are only allowed before or on the launch date.",
  MAX_RESCHEDULE_EXCEEDED:
    "Maximum rescheduling limit has been reached for this campaign. Please contact support or create a new campaign.",
  CAMPAIGN_LOCKED_BY_JOB:
    "This campaign is currently locked by a background worker. Please wait a few seconds and try rescheduling again.",
  SAME_SCHEDULED_AT: "The new send time must be different from the current send time. Please select a different time.",
  REASON_TOO_LONG: "Reschedule reason cannot exceed 200 characters.",
  WARN_VOUCHER_EXPIRING_SOON:
    `Warning: The voucher will expire within ${VOUCHER_EXPIRING_WARN_HOURS} hours after sending. Please verify if this timeframe is appropriate for customers.`,
};

export function getCampaignMutationErrorMessage(
  error: unknown,
  fallback: string,
): string | null {
  const ax = error as AxiosError<ErrorBody>;
  const status = ax.response?.status;
  if (status === 403)
    return CAMPAIGN_ERROR_MESSAGE_BY_CODE.FORBIDDEN ?? "You do not have permission to perform this action.";
  if (status !== 400 && status !== 422) return null;
  const data = ax.response?.data;
  const code = data?.code;
  if (code && CAMPAIGN_ERROR_MESSAGE_BY_CODE[code]) return CAMPAIGN_ERROR_MESSAGE_BY_CODE[code]!;
  return data?.message ?? fallback;
}

export function translateScheduleWarningCodes(codes: string[] | null | undefined): string | null {
  if (!codes?.length) return null;
  const parts = codes
    .map((c) => CAMPAIGN_ERROR_MESSAGE_BY_CODE[c])
    .filter((s): s is string => Boolean(s));
  return parts.length ? parts.join(" ") : null;
}
