export interface GradeBand {
  min: number;
  grade: string;
  points: number;
}

/** Standard 10-point grading scale used across the system. */
export const GRADE_SCALE: GradeBand[] = [
  { min: 90, grade: "A+", points: 10 },
  { min: 80, grade: "A", points: 9 },
  { min: 75, grade: "B+", points: 8 },
  { min: 70, grade: "B", points: 7 },
  { min: 65, grade: "C+", points: 6 },
  { min: 60, grade: "C", points: 5 },
  { min: 50, grade: "D", points: 4 },
  { min: 0, grade: "F", points: 0 },
];

export function percentageToGrade(percentage: number): string {
  const band = GRADE_SCALE.find((b) => percentage >= b.min);
  return band?.grade ?? "F";
}

export function percentageToGradePoints(percentage: number): number {
  const band = GRADE_SCALE.find((b) => percentage >= b.min);
  return band?.points ?? 0;
}
