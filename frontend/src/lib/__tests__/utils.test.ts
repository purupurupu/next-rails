import { describe, it, expect } from "vitest";
import { cn, formatDate, formatDateTime, isOverdue, isDueToday, isDueSoon } from "../utils";

describe("cn", () => {
  it("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("should merge tailwind classes with conflict resolution", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});

describe("formatDate", () => {
  it("should format date in Japanese locale", () => {
    const result = formatDate("2024-01-15T00:00:00Z");
    expect(result).toContain("2024");
    expect(result).toContain("15");
  });
});

describe("formatDateTime", () => {
  it("should include time in formatted output", () => {
    const result = formatDateTime("2024-06-15T14:30:00Z");
    expect(result).toContain("2024");
  });
});

describe("isOverdue", () => {
  it("should return true for past dates", () => {
    expect(isOverdue("2020-01-01")).toBe(true);
  });

  it("should return false for future dates", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    expect(isOverdue(futureDate.toISOString())).toBe(false);
  });
});

describe("isDueToday", () => {
  it("should return true for today's date", () => {
    const today = new Date();
    expect(isDueToday(today.toISOString())).toBe(true);
  });

  it("should return false for yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isDueToday(yesterday.toISOString())).toBe(false);
  });
});

describe("isDueSoon", () => {
  it("should return true for a date within the threshold", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59);
    expect(isDueSoon(tomorrow.toISOString(), 3)).toBe(true);
  });

  it("should return false for a date beyond the threshold", () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 10);
    expect(isDueSoon(farFuture.toISOString(), 3)).toBe(false);
  });

  it("should return false for past dates", () => {
    expect(isDueSoon("2020-01-01", 3)).toBe(false);
  });
});
