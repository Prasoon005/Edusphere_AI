import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GradeRing } from "./GradeRing";

describe("GradeRing", () => {
  it("renders the rounded value and label", () => {
    render(<GradeRing value={87.6} label="Attendance" sublabel="%" />);
    expect(screen.getByText("88")).toBeInTheDocument();
    expect(screen.getByText("Attendance")).toBeInTheDocument();
    expect(screen.getByText("%")).toBeInTheDocument();
  });

  it("clamps values above 100", () => {
    render(<GradeRing value={150} label="Overshoot" />);
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("clamps negative values to zero", () => {
    render(<GradeRing value={-20} label="Undershoot" />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
