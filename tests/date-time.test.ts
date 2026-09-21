import { describe, expect, it } from "vitest";
import { dateInTimeZone, isQuietNow, timeInZone } from "../lib/date-time";

describe("Tehran date and quiet hours", () => {
  it("formats the date in Tehran instead of the machine timezone", () => {
    expect(dateInTimeZone("Asia/Tehran", new Date("2026-03-20T21:00:00Z"))).toBe("2026-03-21");
  });

  it("formats a stable local time", () => {
    expect(timeInZone("Asia/Tehran", new Date("2026-01-01T20:00:00Z"))).toBe("23:30");
  });

  it("handles quiet hours crossing midnight", () => {
    expect(isQuietNow("23:00", "08:00", "Asia/Tehran", new Date("2026-01-01T20:00:00Z"))).toBe(true);
    expect(isQuietNow("23:00", "08:00", "Asia/Tehran", new Date("2026-01-01T07:00:00Z"))).toBe(false);
  });

  it("handles quiet hours within one day", () => {
    expect(isQuietNow("13:00", "15:00", "Asia/Tehran", new Date("2026-01-01T10:30:00Z"))).toBe(true);
  });
});
