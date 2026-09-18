import { describe, it, expect } from "vitest";
import { percentageToGrade, percentageToGradePoints, GRADE_SCALE } from "../utils/grading";

describe("percentageToGrade", () => {
  it("maps boundary values to the correct letter grade", () => {
    expect(percentageToGrade(100)).toBe("A+");
    expect(percentageToGrade(90)).toBe("A+");
    expect(percentageToGrade(89.99)).toBe("A");
    expect(percentageToGrade(80)).toBe("A");
    expect(percentageToGrade(75)).toBe("B+");
    expect(percentageToGrade(70)).toBe("B");
    expect(percentageToGrade(65)).toBe("C+");
    expect(percentageToGrade(60)).toBe("C");
    expect(percentageToGrade(50)).toBe("D");
    expect(percentageToGrade(49.99)).toBe("F");
    expect(percentageToGrade(0)).toBe("F");
  });

  it("never returns undefined for any value in [0, 100]", () => {
    for (let p = 0; p <= 100; p += 5) {
      expect(GRADE_SCALE.map((b) => b.grade)).toContain(percentageToGrade(p));
    }
  });
});

describe("percentageToGradePoints", () => {
  it("maps grades to the correct 10-point scale", () => {
    expect(percentageToGradePoints(95)).toBe(10);
    expect(percentageToGradePoints(85)).toBe(9);
    expect(percentageToGradePoints(30)).toBe(0);
  });

  it("is monotonically non-decreasing as percentage increases", () => {
    let prev = -1;
    for (let p = 0; p <= 100; p += 1) {
      const points = percentageToGradePoints(p);
      expect(points).toBeGreaterThanOrEqual(prev);
      prev = points;
    }
  });
});
