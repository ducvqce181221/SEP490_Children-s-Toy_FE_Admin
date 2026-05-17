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
  CONTENT_REQUIRED: "Content is required (template or title + message).",
  TEMPLATE_NOT_FOUND: "Notification template not found or inactive.",
  TARGET_REQUIRED: "At least one recipient target is required.",
  TARGET_ACCOUNT_INVALID: "One or more target accounts are invalid.",
  REFERENCE_INCONSISTENT: "Reference (type / id) is inconsistent.",
  REFERENCE_NOT_FOUND:
    "Linked reference not found or unavailable: voucher must be Active; promotion must be Active or Scheduled (and EndDate must not have passed when the campaign was created); blog must be Published. Check the details page of the voucher/promotion/blog to update its status or change the reference.",
  FORBIDDEN: "You do not have permission to perform this action.",
  INVALID_STATUS_TRANSITION:
    "The action does not match the current status of the campaign (e.g., only Approved can be scheduled; only Scheduled can be rescheduled). Please check the list or refresh the page.",
  REFERENCE_EXPIRED: "The linked reference (voucher/promotion/...) is no longer valid for this action — it may have changed status or expired after the campaign was created.",
  SCHEDULE_NOT_ALLOWED_AT_SUBMIT:
    "Scheduling is not allowed when submitting for approval. Please remove scheduledAt from the form (if any) and only schedule after approval.",
  SCHEDULE_NOT_ALLOWED_AT_CREATE: "Cannot set ScheduledAt when creating a campaign. Please schedule via the API or Schedule button after it is approved.",
  REVIEWER_CANNOT_BE_SUBMITTER: "Reviewer cannot be the same as the submitter.",
  REFERENCE_ALREADY_EXPIRED: "The linked reference (voucher/promotion) has expired — cannot proceed with the previous reference.",
  TEMPLATE_DEACTIVATED: "Notification template has been deactivated.",
  REVIEW_NOTE_REQUIRED: "A note is required when rejecting.",
  APPROVED_EXPIRED:
    "Approved window expired: the campaign must be scheduled within the allowed timeframe after being Approved. Submit for approval again or create a new campaign if needed.",
  SCHEDULED_AT_REQUIRED: "Send time has not been chosen. Please select a date and time in the 'Send time' field or use Quick pick and click Confirm.",
  SCHEDULED_AT_TOO_SOON: `Send time must be at least ${SCHEDULE_MIN_LEAD_MINUTES} minutes after the current time (based on server clock). Choose a later time or click 'In 30 minutes'.`,
  SCHEDULED_AT_TOO_FAR: `Send time cannot be further than ${SCHEDULE_MAX_LEAD_DAYS} days from now. Shorten the date or split into multiple campaigns.`,
  VALID_RANGE_INVALID:
    "Invalid Valid from / Valid to range: 'Valid from' must be earlier than 'Valid to'. Modify either value or clear both if not needed.",
  SCHEDULED_AT_OUT_OF_RANGE:
    "Send time is outside of the specified Valid from / Valid to range. Either adjust the Send time to fall within the range, or leave both valid fields blank to remove the constraint.",
  SCHEDULED_BEFORE_VOUCHER_START:
    `Send time is earlier than when the voucher becomes active (StartDate on voucher details). Please view the voucher details, get the start time, and set the Send time after that mark, while still satisfying the minimum ${SCHEDULE_MIN_LEAD_MINUTES} minutes lead time and ${SCHEDULE_MAX_LEAD_DAYS} days window...`,
  SCHEDULED_TOO_CLOSE_TO_VOUCHER_END:
    `Send time must be at least ${VOUCHER_END_BUFFER_HOURS} hours before the voucher expires (EndDate) — meaning the send time cannot be too close to expiration. Set it earlier; for example, if EndDate is 17:00, you should send before 15:00.`,
  SCHEDULED_TOO_EARLY_FOR_SALE:
    `Send time is too early compared to the promotion: it cannot be scheduled before (Promotion StartDate minus ${SALE_LEAD_HOURS_BEFORE_START} hours). For example, if the sale starts at 10:00 on June 20, you cannot send before 10:00 on June 19.`,
  SCHEDULED_AFTER_SLOT_START:
    "[Deprecated] Older flash error code; the new version uses SCHEDULED_TOO_CLOSE_TO_SALE_END based on the last slot's end rule. If you still see this, refresh the page and try again.",
  SCHEDULED_TOO_CLOSE_TO_SALE_END:
    `Send time must be at least ${VOUCHER_END_BUFFER_HOURS} hours before the promotion end time: for standard sales, this is the campaign EndDate; for flash sales, it is the end of the last active timeslot (maximum EndAt). Set the Send time earlier to allow a ${VOUCHER_END_BUFFER_HOURS}-hour buffer.`,
  SCHEDULED_AFTER_LAUNCH:
    "Coming soon product: Send time cannot be after the LaunchDate (notifications are only valid before or exactly on the launch day). Check LaunchDate in the product catalog.",
  MAX_RESCHEDULE_EXCEEDED:
    "You have reached the maximum number of reschedules allowed for this campaign. Contact an administrator or create a new campaign.",
  CAMPAIGN_LOCKED_BY_JOB:
    "The campaign is temporarily locked by a background sending worker. Wait a few seconds and try rescheduling again; avoid double-clicking.",
  SAME_SCHEDULED_AT: "The new send time must be different from the currently scheduled send time. Please select a different time.",
  REASON_TOO_LONG: "The rescheduling reason cannot exceed 200 characters. Please shorten your content.",
  WARN_VOUCHER_EXPIRING_SOON:
    `Warning (non-blocking): The voucher will expire within approximately ${VOUCHER_EXPIRING_WARN_HOURS} hours after the send time — please check if this notification window is still appropriate for customers.`,
};

export function getCampaignMutationErrorMessage(
  error: unknown,
  fallback: string,
): string | null {
  const ax = error as AxiosError<ErrorBody>;
  const status = ax.response?.status;
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
