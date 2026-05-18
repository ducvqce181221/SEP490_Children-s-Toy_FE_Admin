import type {
  Campaign,
  ResolvedFlashProductLine,
  ResolvedFlashTimeSlot,
  ResolvedReference,
} from "../types/campaign";

/** Reads camelCase or PascalCase field (legacy JSON / serializer config). */
function pick<T>(obj: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  const v = obj[camel] ?? obj[pascal];
  return v as T | undefined;
}

function normalizeFlashProductLine(raw: unknown): ResolvedFlashProductLine {
  const l = raw as Record<string, unknown>;
  const discount = pick<number | null>(l, "discountPercent", "DiscountPercent");
  return {
    slotProductId: Number(pick(l, "slotProductId", "SlotProductId") ?? 0),
    productId: Number(pick(l, "productId", "ProductId") ?? 0),
    productName: String(pick(l, "productName", "ProductName") ?? ""),
    salePrice: Number(pick(l, "salePrice", "SalePrice") ?? 0),
    discountPercent: discount === undefined ? null : discount,
    saleQuantity: Number(pick(l, "saleQuantity", "SaleQuantity") ?? 0),
    soldQuantity: Number(pick(l, "soldQuantity", "SoldQuantity") ?? 0),
    reservedQuantity: Number(pick(l, "reservedQuantity", "ReservedQuantity") ?? 0),
    isActive: Boolean(pick(l, "isActive", "IsActive") ?? true),
  };
}

function normalizeFlashTimeSlot(raw: unknown): ResolvedFlashTimeSlot {
  const s = raw as Record<string, unknown>;
  const linesRaw = pick<unknown[]>(s, "productLines", "ProductLines");
  const productLines: ResolvedFlashProductLine[] = Array.isArray(linesRaw)
    ? linesRaw.map(normalizeFlashProductLine)
    : [];

  const start = pick(s, "startAtUtc", "StartAtUtc");
  const end = pick(s, "endAtUtc", "EndAtUtc");
  return {
    timeSlotId: Number(pick(s, "timeSlotId", "TimeSlotId") ?? 0),
    startAtUtc: typeof start === "string" || typeof start === "number" ? String(start) : String(start ?? ""),
    endAtUtc: typeof end === "string" || typeof end === "number" ? String(end) : String(end ?? ""),
    status: String(pick(s, "status", "Status") ?? ""),
    productLines,
  };
}

/**
 * GET /campaigns/:id sometimes returns `resolvedReference` with `FlashTimeSlots` / `StartAtUtc` (PascalCase)
 * depending on JSON configuration; UI only reads camelCase → merge into a single shape.
 */
export function normalizeCampaignFromApi(campaign: Campaign): Campaign {
  const top = campaign as unknown as Record<string, unknown>;
  const rrRaw = (campaign.resolvedReference ?? top.ResolvedReference) as ResolvedReference | null | undefined;
  if (!rrRaw) return campaign;

  const rr = rrRaw as unknown as Record<string, unknown>;
  const slotsRaw = pick<unknown[]>(rr, "flashTimeSlots", "FlashTimeSlots");
  if (!Array.isArray(slotsRaw)) {
    const merged: ResolvedReference = {
      ...rrRaw,
      displayName: pick(rr, "displayName", "DisplayName") ?? rrRaw.displayName,
      promotionType: pick(rr, "promotionType", "PromotionType") ?? rrRaw.promotionType,
      placeholders:
        (pick<Record<string, string>>(rr, "placeholders", "Placeholders") as Record<string, string>) ??
        rrRaw.placeholders ??
        {},
      defaultActionTarget:
        pick(rr, "defaultActionTarget", "DefaultActionTarget") ?? rrRaw.defaultActionTarget,
      /** Legacy API / error payload might return null or object — fall back to empty slots. */
      flashTimeSlots: [],
    };
    return { ...campaign, resolvedReference: merged };
  }

  const flashTimeSlots = slotsRaw.map(normalizeFlashTimeSlot);

  const resolvedReference: ResolvedReference = {
    ...rrRaw,
    displayName: pick(rr, "displayName", "DisplayName") ?? rrRaw.displayName,
    promotionType: pick(rr, "promotionType", "PromotionType") ?? rrRaw.promotionType,
    placeholders:
      (pick<Record<string, string>>(rr, "placeholders", "Placeholders") as Record<string, string>) ??
      rrRaw.placeholders ??
      {},
    defaultActionTarget: pick(rr, "defaultActionTarget", "DefaultActionTarget") ?? rrRaw.defaultActionTarget,
    flashTimeSlots,
  };

  return { ...campaign, resolvedReference };
}
