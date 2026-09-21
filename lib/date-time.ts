export const TEHRAN_TIME_ZONE = "Asia/Tehran";

export function dateInTimeZone(timeZone = TEHRAN_TIME_ZONE, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function timeInZone(timeZone: string, now = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
}

export function isQuietNow(start: string | null, end: string | null, timeZone: string, now = new Date()) {
  if (!start || !end) return false;
  const current = timeInZone(timeZone, now);
  const from = start.slice(0, 5);
  const to = end.slice(0, 5);
  return from <= to ? current >= from && current < to : current >= from || current < to;
}
