/**
 * Matches ToyStore.Application.Services.Campaigns.CampaignLifecycleRules (validated during Schedule/Reschedule).
 * When creating/editing campaigns, only reference existence and status are validated; the rules below are applied when scheduling.
 */

/** Shown in UI / quick pick. Server MinLeadMinutes is often one minute less for UI↔server clock skew. */
export const SCHEDULE_MIN_LEAD_MINUTES = 30;
export const SCHEDULE_MAX_LEAD_DAYS = 30;
export const VOUCHER_END_BUFFER_HOURS = 2;
export const SALE_LEAD_HOURS_BEFORE_START = 24;
export const VOUCHER_EXPIRING_WARN_HOURS = 24;

export type ScheduleHintSection = { title: string; bullets: string[] };

export interface ScheduleHintLimits {
  maxFutureDays?: number;
  voucherEndBufferHours?: number;
  saleLeadWindowHours?: number;
}

function resolveLimits(limits?: ScheduleHintLimits) {
  return {
    /** User-facing lead time — always 30 min; server may validate at MinLeadMinutes−1 for clock skew. */
    minLeadMinutes: SCHEDULE_MIN_LEAD_MINUTES,
    maxFutureDays: limits?.maxFutureDays ?? SCHEDULE_MAX_LEAD_DAYS,
    voucherEndBufferHours: limits?.voucherEndBufferHours ?? VOUCHER_END_BUFFER_HOURS,
    saleLeadWindowHours: limits?.saleLeadWindowHours ?? SALE_LEAD_HOURS_BEFORE_START,
  };
}

/** 2–3 short bullets for wizard step 1 / form header. */
export function getCampaignScheduleShortSummary(
  referenceType: string | null | undefined,
  promotionType?: string | null,
  limits?: ScheduleHintLimits,
): string[] {
  const { minLeadMinutes, maxFutureDays, voucherEndBufferHours, saleLeadWindowHours } =
    resolveLimits(limits);
  const rt = (referenceType ?? "").trim().toUpperCase();
  const promo = (promotionType ?? "").trim().toUpperCase();

  const bullets: string[] = [
    `Send time must be at least ${minLeadMinutes} minutes from now and within ${maxFutureDays} days (server rules).`,
    "All times are shown in Vietnam Time (GMT+7).",
  ];

  if (rt === "VOUCHER") {
    bullets.push(
      `Voucher campaigns: send after voucher start and at least ${voucherEndBufferHours} hours before voucher end.`,
    );
  } else if (rt === "SALE") {
    if (promo === "FLASH_SALE") {
      bullets.push(
        `Flash sale: earliest send is ${saleLeadWindowHours}h before sale start; latest is ${voucherEndBufferHours}h before the last timeslot ends.`,
      );
    } else {
      bullets.push(
        `Sale campaigns: earliest send is ${saleLeadWindowHours}h before promotion start; latest is ${voucherEndBufferHours}h before promotion end.`,
      );
    }
  } else if (rt === "PRODUCT") {
    bullets.push("Coming Soon products: send time cannot be after the product launch date.");
  }

  return bullets;
}

function saleCommonBulletsDetailed(saleLeadHours: number): string[] {
  return [
    "On the system, the promotion must be in Active or Scheduled status at the time of scheduling; the promotion's EndDate must still be in the future relative to the reference attachment step when creating the campaign (specific rule).",
    `Earliest allowed send time: from (Promotion StartDate − ${saleLeadHours} hours), aligned with the promotion details view. Scheduling earlier will trigger a "too soon" error — preventing scheduling too far ahead of the sale opening (maximum ${saleLeadHours} hours before opening). E.g., if StartDate = 06/20, 10:00 → send time cannot be before 06/19, 10:00.`,
    "StartDate / EndDate in admin promotions are the overall boundaries of the program; FLASH_SALE also contains multiple specific timeslots (StartAt/EndAt per slot). The '2 hours before expiration' rule for flash sales is calculated from the end of the last timeslot, not the first.",
  ];
}

function saleRegularEndDetailed(bufferHours: number): string {
  return `For standard sales (DISCOUNT): Send time must be less than or equal to (Promotion EndDate − ${bufferHours} hours), aligned with the promotion view. E.g., if the promotion ends at 20:00 on June 18 → the latest allowed send time is 18:00 on June 18. Any time after that is considered too close to expiration.`;
}

function saleFlashEndDetailed(bufferHours: number): string {
  return `For FLASH_SALE: Calculated based on the latest end time among active timeslots (maximum EndAt). Send time must be less than or equal to (that mark − ${bufferHours} hours). You may choose a send time that falls between two timeslots, as long as it is at least ${bufferHours} hours before the last timeslot ends (not necessarily before the first slot). E.g., if the last slot ends at 15:00 → latest send time is around 13:00.`;
}

/** User-facing hints aligned with backend validation. */
export function getCampaignScheduleHintSections(
  referenceType: string | null | undefined,
  /** SALE only: FLASH_SALE, DISCOUNT, … when known (e.g. from campaign detail API). */
  promotionType?: string | null,
  limits?: ScheduleHintLimits,
): ScheduleHintSection[] {
  const { minLeadMinutes, maxFutureDays, voucherEndBufferHours, saleLeadWindowHours } =
    resolveLimits(limits);
  const rt = (referenceType ?? "").trim().toUpperCase();
  const promo = (promotionType ?? "").trim().toUpperCase();

  const global: ScheduleHintSection = {
    title: "General Rules (All Campaigns — Schedule/Reschedule steps)",
    bullets: [
      `Send time compared to server "now": must be at least ${minLeadMinutes} minutes in the future and no further than ${maxFutureDays} days. The quick pick "In ${minLeadMinutes} minutes" already includes this ${minLeadMinutes}-minute buffer.`,
      "Optional 'Valid from / Valid to' window: only restricts the Send time (ScheduledAt) when both boundaries are entered and Valid From is earlier than Valid To. This represents the content validity period; it does not replace the voucher expiration date or promotion end date/timeslots.",
    ],
  };

  if (!rt || rt === "OTHER") {
    return [
      global,
      {
        title: "Unlinked Campaigns (OTHER / Empty Reference)",
        bullets: [
          "No additional scheduling constraints related to vouchers, sales, products, or blogs other than the general rules above.",
          "Content templates and recipient targets must still be valid as configured during campaign creation.",
        ],
      },
    ];
  }

  if (rt === "VOUCHER") {
    return [
      global,
      {
        title: "Voucher-Linked Campaigns",
        bullets: [
          "The linked voucher must be Active at the time of scheduling; the system reads the voucher's StartDate and EndDate.",
          `Send time cannot be earlier than the voucher's StartDate (the voucher must be active).`,
          `Send time must be at least ${voucherEndBufferHours} hours before the voucher expires (EndDate) to ensure delivery before expiration.`,
          `Example: If the voucher's EndDate is 17:00 on the 10th → the latest allowed send time is around 15:00 on the 10th, and must still be after the StartDate, at least ${minLeadMinutes} minutes in the future, and within the next ${maxFutureDays} days.`,
          `If (EndDate − Send time) < ~${VOUCHER_EXPIRING_WARN_HOURS} hours, the backend may return a WARN_VOUCHER_EXPIRING_SOON warning — verify if customers will have enough time to redeem the voucher.`,
        ],
      },
    ];
  }

  if (rt === "SALE") {
    const bullets: string[] = [...saleCommonBulletsDetailed(saleLeadWindowHours)];

    if (promo === "FLASH_SALE") {
      bullets.push(saleFlashEndDetailed(voucherEndBufferHours));
    } else if (promo === "DISCOUNT" || promo.length > 0) {
      bullets.push(saleRegularEndDetailed(voucherEndBufferHours));
    } else {
      bullets.push(
        saleRegularEndDetailed(voucherEndBufferHours),
        saleFlashEndDetailed(voucherEndBufferHours),
        "On the campaign list page, the specific type (DISCOUNT vs FLASH_SALE) might not be visible — open the campaign details page to view the promotionType in the resolved reference, or check the promotion itself to match the EndDate and timeslots.",
      );
    }

    return [
      global,
      {
        title: "Promotion-Linked Campaigns (SALE)",
        bullets,
      },
    ];
  }

  if (rt === "PRODUCT") {
    return [
      global,
      {
        title: "Product-Linked Campaigns (PRODUCT)",
        bullets: [
          "The product must exist and must not be Discontinued.",
          "If the status is ComingSoon and has a LaunchDate: the Send time cannot be after the LaunchDate (notifications must be scheduled before or exactly on the launch day).",
          "If the product is not ComingSoon: no additional scheduling constraints are applied other than the general rules.",
        ],
      },
    ];
  }

  if (rt === "BLOG") {
    return [
      global,
      {
        title: "Blog-Linked Campaigns (BLOG)",
        bullets: [
          "The article must be Published for the reference to be valid.",
          "No additional scheduling constraints are applied specifically for blogs (only the general lead time and maximum window apply, alongside optional Valid from/to boundaries).",
        ],
      },
    ];
  }

  return [global];
}
