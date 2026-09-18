import { describe, it, expect } from "vitest";
import { expiryToDate } from "../utils/jwt";

describe("expiryToDate", () => {
  it("parses seconds correctly", () => {
    const before = Date.now();
    const result = expiryToDate("30s");
    const after = Date.now();
    expect(result.getTime()).toBeGreaterThanOrEqual(before + 30_000);
    expect(result.getTime()).toBeLessThanOrEqual(after + 30_000);
  });

  it("parses minutes correctly", () => {
    const result = expiryToDate("15m");
    const expectedMs = 15 * 60 * 1000;
    expect(result.getTime() - Date.now()).toBeGreaterThan(expectedMs - 1000);
    expect(result.getTime() - Date.now()).toBeLessThanOrEqual(expectedMs);
  });

  it("parses days correctly", () => {
    const result = expiryToDate("7d");
    const expectedMs = 7 * 24 * 60 * 60 * 1000;
    expect(result.getTime() - Date.now()).toBeGreaterThan(expectedMs - 1000);
    expect(result.getTime() - Date.now()).toBeLessThanOrEqual(expectedMs);
  });

  it("throws on an invalid format", () => {
    expect(() => expiryToDate("banana")).toThrow();
    expect(() => expiryToDate("10")).toThrow();
    expect(() => expiryToDate("10x")).toThrow();
  });
});
