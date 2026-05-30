/**
 * Map defaultActionTarget from API (usually store URL) → admin portal route.
 * Keep synced with CampaignDetailPage (View Details link).
 */
export function mapReferenceDefaultActionToAdminUrl(url: string): string {
  if (!url) return "#";
  let mapped = url;

  // Handle customer-facing Flash Sale deep-links (e.g., /?flashSale=123)
  if (mapped.startsWith("/?flashSale=") || mapped.includes("flashSale=")) {
    const match = mapped.match(/[?&]flashSale=([^&]+)/);
    const id = match ? match[1] : "";
    mapped = `/promotions/${id}`;
  }
  // Handle customer-facing Voucher deep-links (e.g., /profile/vouchers?code=GIFT100)
  else if (mapped.startsWith("/profile/vouchers") || mapped.includes("vouchers?code=")) {
    const match = mapped.match(/[?&]code=([^&]+)/);
    const code = match ? match[1] : "";
    mapped = `/vouchers?voucherCode=${code}`;
  }
  // Fallbacks for legacy/admin paths
  else if (mapped.startsWith("/sale/")) {
    mapped = mapped.replace("/sale/", "/promotions/");
  } else if (mapped.startsWith("/blog/")) {
    const parts = mapped.split("/").filter(Boolean);
    const id = parts[parts.length - 1];
    mapped = `/blogs?blogId=${id}`;
  } else if (mapped.startsWith("/vouchers/")) {
    const parts = mapped.split("/").filter(Boolean);
    const id = parts[parts.length - 1];
    mapped = `/vouchers?voucherCode=${id}`;
  } else if (mapped.startsWith("/products/")) {
    const parts = mapped.split("/").filter(Boolean);
    const id = parts[parts.length - 1];
    mapped = `/products?productId=${id}`;
  }

  if (mapped.startsWith("http://") || mapped.startsWith("https://")) return mapped;
  if (mapped.startsWith("/admin/")) return mapped;
  if (mapped.startsWith("/")) return `/admin${mapped}`;
  return `/admin/${mapped}`;
}
