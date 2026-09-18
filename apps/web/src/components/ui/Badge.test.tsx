import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>PUBLISHED</Badge>);
    expect(screen.getByText("PUBLISHED")).toBeInTheDocument();
  });

  it("applies the correct tone class", () => {
    render(<Badge tone="danger">Overdue</Badge>);
    expect(screen.getByText("Overdue")).toHaveClass("text-danger");
  });

  it("defaults to the neutral tone", () => {
    render(<Badge>Draft</Badge>);
    expect(screen.getByText("Draft")).toHaveClass("text-ink-muted");
  });
});
