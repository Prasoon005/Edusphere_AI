import { describe, it, expect } from "vitest";
import { toSkipTake, toOrderBy, paginationQuerySchema } from "../utils/pagination";

describe("paginationQuerySchema defaults", () => {
  it("applies sensible defaults when nothing is provided", () => {
    const parsed = paginationQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
    expect(parsed.sortOrder).toBe("desc");
  });

  it("coerces string query params to numbers", () => {
    const parsed = paginationQuerySchema.parse({ page: "3", limit: "50" });
    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(50);
  });

  it("rejects a limit above the max", () => {
    expect(() => paginationQuerySchema.parse({ limit: "500" })).toThrow();
  });
});

describe("toSkipTake", () => {
  it("computes skip/take correctly for page 1", () => {
    expect(toSkipTake({ page: 1, limit: 20 })).toEqual({ skip: 0, take: 20 });
  });

  it("computes skip/take correctly for later pages", () => {
    expect(toSkipTake({ page: 3, limit: 10 })).toEqual({ skip: 20, take: 10 });
  });
});

describe("toOrderBy", () => {
  it("falls back to the default when sortBy is not in the allowed list", () => {
    const result = toOrderBy({ sortBy: "notAllowed", sortOrder: "asc" }, ["fullName"], { fullName: "asc" });
    expect(result).toEqual({ fullName: "asc" });
  });

  it("uses the requested field when it is allowed", () => {
    const result = toOrderBy({ sortBy: "rollNumber", sortOrder: "desc" }, ["fullName", "rollNumber"], {
      fullName: "asc",
    });
    expect(result).toEqual({ rollNumber: "desc" });
  });
});
