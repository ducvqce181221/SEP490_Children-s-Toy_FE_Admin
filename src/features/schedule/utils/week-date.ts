import { format, parseISO, startOfWeek, subWeeks } from "date-fns";

/** Monday of the ISO week containing `dateFilter` (YYYY-MM-DD). */
export function getWeekMondaysFromDateFilter(dateFilter: string): {
  sourceMonday: string;
  targetMonday: string;
} {
  const ref = parseISO(`${dateFilter}T12:00:00`);
  const targetMonday = startOfWeek(ref, { weekStartsOn: 1 });
  const sourceMonday = subWeeks(targetMonday, 1);

  return {
    sourceMonday: format(sourceMonday, "yyyy-MM-dd"),
    targetMonday: format(targetMonday, "yyyy-MM-dd"),
  };
}

export function formatWeekRange(mondayYmd: string): string {
  const start = parseISO(`${mondayYmd}T12:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${format(start, "dd/MM/yyyy")} – ${format(end, "dd/MM/yyyy")}`;
}
