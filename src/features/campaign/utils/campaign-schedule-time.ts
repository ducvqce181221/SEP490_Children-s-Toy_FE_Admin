/** Admin campaign scheduling displays Vietnam Time (GMT+7, no DST). */
export const CAMPAIGN_SCHEDULE_TZ = "Asia/Ho_Chi_Minh";

export function formatCampaignScheduleDisplay(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return String(date);
  return d.toLocaleString("en-US", {
    timeZone: CAMPAIGN_SCHEDULE_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function getVnDateParts(date: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CAMPAIGN_SCHEDULE_TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);

  const pick = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour"),
    minute: pick("minute"),
  };
}

/** Convert Vietnam local wall-clock to UTC Date (VN = UTC+7). */
export function vnLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  return new Date(Date.UTC(year, month - 1, day, hour - 7, minute, 0, 0));
}

export function addMinutesUtc(from: Date, minutes: number): Date {
  return new Date(from.getTime() + minutes * 60 * 1000);
}

export function addHoursUtc(from: Date, hours: number): Date {
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

/** Next calendar day at 09:00 Vietnam Time. */
export function getTomorrowNineAmVn(from: Date = new Date()): Date {
  const midnightVn = vnLocalToUtc(
    getVnDateParts(from).year,
    getVnDateParts(from).month,
    getVnDateParts(from).day,
    0,
    0,
  );
  const nextMidnight = new Date(midnightVn.getTime() + 24 * 60 * 60 * 1000);
  const np = getVnDateParts(nextMidnight);
  return vnLocalToUtc(np.year, np.month, np.day, 9, 0);
}

export function clampDate(d: Date, min: Date, max: Date): Date {
  const t = d.getTime();
  if (t < min.getTime()) return new Date(min);
  if (t > max.getTime()) return new Date(max);
  return d;
}

export function isDateWithinRange(date: Date, min: Date, max: Date): boolean {
  const t = date.getTime();
  return t >= min.getTime() && t <= max.getTime();
}
