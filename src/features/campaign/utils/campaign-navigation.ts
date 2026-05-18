import type { CampaignListItem } from "../types/campaign";

/** Supports camelCase and PascalCase JSON from the API. */
export function resolveCampaignListItemId(
  item: CampaignListItem | Record<string, unknown>,
): number | null {
  const raw =
    (item as CampaignListItem).campaignId ??
    (item as { CampaignId?: unknown }).CampaignId;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === "string") {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

export function campaignDetailPath(campaignId: number): string {
  return `/admin/campaigns/${campaignId}`;
}

export function campaignSchedulePath(
  campaignId: number,
  mode: "schedule" | "reschedule" = "schedule",
): string {
  const q = mode === "reschedule" ? "?mode=reschedule" : "";
  return `/admin/campaigns/${campaignId}/schedule${q}`;
}
