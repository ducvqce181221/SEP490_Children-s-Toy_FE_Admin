import type { AccountInfo } from "@/features/auth/types/auth";

const ROLE_ID = {
  ADMIN: 2,
  STAFF: 3,
  MERCHANDISE: 4,
} as const;

const STAFF_ALLOWED_PREFIXES = [
  "/admin/customers",
  "/admin/promotions",
  "/admin/vouchers",
  "/admin/product-reviews",
  "/admin/blog-reviews",
  "/admin/wallets",
  "/admin/blogs",
  "/admin/orders",
  "/admin/order-queue",
  "/admin/refunds",
  "/admin/profile",
  "/admin/notifications",
  "/admin/campaigns",
  "/admin/blog-review-permissions",
  "/admin/schedules",
  "/admin/shifts",
] as const;

const MERCH_ALLOWED_PREFIXES = [
  "/admin/products",
  "/admin/super-categories",
  "/admin/categories",
  "/admin/brands",
  "/admin/profile",
  "/admin/notifications",
  "/admin/orders",
  "/admin/order-queue",
  "/admin/refunds",
  "/admin/schedules",
  "/admin/shifts",
] as const;

function normalizeRoleName(roleName?: string): string {
  return (roleName ?? "").trim().toLowerCase();
}

function isAdmin(account: AccountInfo): boolean {
  return account.roleId === ROLE_ID.ADMIN || normalizeRoleName(account.roleName) === "admin";
}

function isStaff(account: AccountInfo): boolean {
  return account.roleId === ROLE_ID.STAFF || normalizeRoleName(account.roleName) === "staff";
}

function isMerchandise(account: AccountInfo): boolean {
  return account.roleId === ROLE_ID.MERCHANDISE || normalizeRoleName(account.roleName) === "merchandise";
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isAllowedAdminPath(account: AccountInfo | null, pathname: string): boolean {
  if (!pathname.startsWith("/admin")) {
    return true;
  }

  if (pathname === "/admin/login") {
    return true;
  }

  if (!account) {
    return false;
  }

  if (isAdmin(account)) {
    return true;
  }

  if (pathname === "/admin") {
    return isStaff(account) || isMerchandise(account);
  }

  if (isStaff(account)) {
    return STAFF_ALLOWED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
  }

  if (isMerchandise(account)) {
    return MERCH_ALLOWED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
  }

  return false;
}

export function getDefaultAdminPath(account: AccountInfo | null): string {
  if (!account) {
    return "/admin/login";
  }

  if (isAdmin(account) || isStaff(account) || isMerchandise(account)) {
    return "/admin";
  }

  return "/admin/login";
}

/**
 * Validates and returns a safe `returnTo` URL for admin login redirect.
 * Prevents open redirects by enforcing /admin prefix and checking role access.
 */
export function getSafeAdminReturnTo(
  returnTo: string | null | undefined,
  account: AccountInfo | null,
): string {
  if (!returnTo) return "/admin";
  try {
    const decoded = decodeURIComponent(returnTo);
    if (!decoded.startsWith("/admin")) return "/admin";
    if (decoded === "/admin/login" || decoded.startsWith("/admin/login?")) return "/admin";
    if (account && !isAllowedAdminPath(account, decoded.split("?")[0])) {
      return getDefaultAdminPath(account);
    }
    return decoded;
  } catch {
    return "/admin";
  }
}

export function canAccessAdminDashboardAnalytics(account: AccountInfo | null): boolean {
  if (!account) {
    return false;
  }

  return isAdmin(account) || isStaff(account) || isMerchandise(account);
}
