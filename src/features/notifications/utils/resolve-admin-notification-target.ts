/**
 * Resolves notification actionTarget to valid FE Admin routes.
 */
export function resolveAdminNotificationTarget(
  actionTarget?: string | null,
  notificationType?: string | null,
): string | null {
  if (!actionTarget) return null;

  const target = actionTarget.trim();
  if (!target) return null;

  if (target.startsWith("http")) return target;

  // Already an admin route
  if (target.startsWith("/admin/")) {
    return target;
  }

  // Blog related routes (customer format e.g. /blog/123, /blog/0#reply-1)
  if (target.startsWith("/blog") || notificationType === "BLOG") {
    if (
      target.includes("reply") ||
      target.includes("review") ||
      target.includes("comment")
    ) {
      return "/admin/blog-reviews";
    }
    return "/admin/blogs";
  }

  // Product review routes (customer format e.g. /products/review/123)
  if (
    target.startsWith("/products/review") ||
    target.startsWith("/product-reviews") ||
    target.startsWith("/reviews")
  ) {
    return "/admin/product-reviews";
  }

  // Orders route (customer format e.g. /orders/123)
  const orderMatch = target.match(/^\/orders?\/(\d+)/);
  if (orderMatch) {
    return `/admin/orders/${orderMatch[1]}`;
  }

  // Refunds route (customer format e.g. /refunds/123)
  const refundMatch = target.match(/^\/refunds?\/(\d+)/);
  if (refundMatch) {
    return `/admin/refunds/${refundMatch[1]}`;
  }

  // Products route (customer format e.g. /products/123)
  if (target.startsWith("/products") || target.startsWith("/product")) {
    return "/admin/products";
  }

  // Fallback for any other path starting with /
  if (target.startsWith("/")) {
    return target;
  }

  return null;
}
