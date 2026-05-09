/** API gốc không có suffix /api — dùng cho SignalR /hubs/... */
export function getApiOrigin(): string {
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:7083/api";
  return base.replace(/\/api\/?$/i, "");
}

export function getNotificationHubUrl(): string {
  return `${getApiOrigin()}/hubs/notifications`;
}
