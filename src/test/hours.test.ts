import { describe, expect, it } from "vitest";
import { calcHours } from "@/lib/hours";
describe("calcHours", () => {
  it("calculates 4.5 hours from 10:00 to 14:30", () => expect(calcHours("2026-10-05T10:00", "2026-10-05T14:30")).toBe(4.5));
  it("rejects end before start", () => expect(calcHours("2026-10-05T14:00", "2026-10-05T10:00")).toBeNull());
});
