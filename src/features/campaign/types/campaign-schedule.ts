/** Payload sent to schedule / reschedule API from scheduling form */

export interface CampaignScheduleFormPayload {
  scheduledAt: string;
  validFrom: string | null;
  validTo: string | null;
  reason: string | null;
}

/** Context for displaying scheduling hints (voucher, sale, etc.) */
export interface CampaignScheduleContext {
  referenceType?: string | null;
  campaignName?: string | null;
  /** When referenceType = SALE: FLASH_SALE | DISCOUNT | etc. */
  promotionType?: string | null;
}

/** Shared form submit ID (wizard footer submits via the `form` attribute) */
export const CAMPAIGN_SCHEDULE_FORM_ID = "campaign-schedule-form";

/** Exposed to wizard for footer / step navigation. */
export interface CampaignScheduleFormSubmitState {
  canSubmit: boolean;
  isLoadingBounds: boolean;
  isFeasible: boolean;
  selectedDate: Date | null;
  validFrom: Date | null;
  validTo: Date | null;
  reason: string;
  scheduleError: string | null;
}

