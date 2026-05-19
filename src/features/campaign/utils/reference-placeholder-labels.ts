import type { ResolvedReference } from "../types/campaign";

/** Normalize token {{PromotionName}} → readable display label instead of raw */
export function formatPlaceholderKeyForLabel(raw: string): string {
  const stripped = raw.replace(/\{\{|\}\}/g, "").trim();
  return stripped.replace(/([A-Z])/g, " $1").trim();
}

const KNOWN_KEYS: Record<string, string> = {
  PromotionName: "Promotion Name",
  StartDate: "Promo Start Date",
  EndDate: "Promo End Date",
  PromotionId: "Promotion ID",
  VoucherName: "Voucher Name",
  VoucherCode: "Voucher Code",
  ProductName: "Product Name",
  BlogTitle: "Blog Title",
  ExpiryDate: "Voucher Expiry",
};

export function humanizePlaceholderLabel(key: string): string {
  const inner = key.replace(/\{\{|\}\}/g, "").trim();
  if (KNOWN_KEYS[inner]) return KNOWN_KEYS[inner];
  return formatPlaceholderKeyForLabel(key);
}

const VN_DATE_OPTS: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

const VN_DATETIME_OPTS: Intl.DateTimeFormatOptions = {
  ...VN_DATE_OPTS,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

export function formatPlaceholderValueDisplay(
  key: string,
  value: string,
): { text: string; isLikelyDate: boolean } {
  const inner = key.replace(/\{\{|\}\}/g, "").trim();
  const looksLikeDateKey =
    /date/i.test(inner) || /at$/i.test(inner) || /time/i.test(inner);
  const vnWall =
    /^\d{1,2}\/\d{1,2}\/\d{4}(\s+\d{1,2}:\d{2})?$/.test(value.trim());
  if (looksLikeDateKey && vnWall) {
    return { text: value.trim(), isLikelyDate: true };
  }
  let dateString = value.trim();
  if (looksLikeDateKey) {
    dateString = dateString.replace(" ", "T");
    if (!dateString.includes("Z") && !dateString.includes("+")) {
      dateString += "Z";
    }
  }
  const d = new Date(dateString);
  const parseOk = !Number.isNaN(d.getTime()) && value.length >= 8;
  if (looksLikeDateKey && parseOk) {
    const hasTime =
      value.includes("T") || value.includes(":") || value.length > 12;
    return {
      text: d.toLocaleString("en-US", hasTime ? VN_DATETIME_OPTS : VN_DATE_OPTS),
      isLikelyDate: true,
    };
  }
  return { text: value, isLikelyDate: false };
}

export function shouldHighlightScheduleRow(
  key: string,
  resolved: ResolvedReference | null | undefined,
): boolean {
  const inner = key.replace(/\{\{|\}\}/g, "").trim();
  if (/^(StartDate|EndDate|ValidFrom|ValidTo|Start|End)$/i.test(inner)) return true;
  if (resolved?.promotionType && /date/i.test(inner)) return true;
  return false;
}

/** Matches FLASH_SALE, Flash Sale, etc. — synced with SaleResolver.IsFlashSalePromotionType. */
export function isFlashSalePromotionType(promotionType: string | null | undefined): boolean {
  if (!promotionType?.trim()) return false;
  const compact = promotionType.replace(/[\s_-]/g, "").toUpperCase();
  return compact === "FLASHSALE";
}

export type FlashSlotPhase = "live" | "upcoming" | "ended";

/** Compare based on current time — live slot first, then upcoming, then ended. */
export function getFlashSlotPhase(now: Date, start: Date, end: Date): FlashSlotPhase {
  if (now >= start && now <= end) return "live";
  if (now < start) return "upcoming";
  return "ended";
}

/** Display slot range in Vietnam timezone (UTC from API). */
export function formatFlashSlotRangeVi(startAtUtc: string | Date, endAtUtc: string | Date): string {
  const ensureUTCString = (dateStr: string): string => {
    let formatted = dateStr.trim().replace(" ", "T");
    if (!formatted.includes("Z") && !formatted.includes("+")) {
      formatted += "Z";
    }
    return formatted;
  };
  const s = typeof startAtUtc === "string" ? new Date(ensureUTCString(startAtUtc)) : startAtUtc;
  const e = typeof endAtUtc === "string" ? new Date(ensureUTCString(endAtUtc)) : endAtUtc;
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "—";
  return `${s.toLocaleString("en-US", VN_DATETIME_OPTS)} → ${e.toLocaleString("en-US", VN_DATETIME_OPTS)}`;
}
