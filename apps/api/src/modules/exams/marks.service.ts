import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { percentageToGrade, percentageToGradePoints } from "../../utils/grading";
import { createNotification, createNotificationForMany } from "../notifications/notifications.service";

interface MarkRecord {
  studentId: string;
  marksObtained: number;
  graceMarks?: number;
  remarks?: string;
}

export async function enterMarksBulk(enteredById: string, examId: string, records: MarkRecord[]) {
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) throw ApiError.notFound("Exam not found");

  for (const r of records) {
    const total = r.marksObtained + (r.graceMarks ?? 0);
    if (total > exam.maxMarks) {
      throw ApiError.badRequest(
        `Total marks (${total}) for a student exceed the exam's maximum of ${exam.maxMarks}`
      );
    }
  }

  const results = await prisma.$transaction(
    records.map((r) => {
      const percentage = ((r.marksObtained + (r.graceMarks ?? 0)) / exam.maxMarks) * 100;
      const grade = percentageToGrade(percentage);
      return prisma.mark.upsert({
        where: { studentId_examId: { studentId: r.studentId, examId } },
        create: {
          studentId: r.studentId,
          examId,
          subjectId: exam.subjectId,
          semesterId: exam.semesterId,
          marksObtained: r.marksObtained,
          graceMarks: r.graceMarks ?? 0,
          grade,
          remarks: r.remarks,
          enteredById,
        },
        update: {
          marksObtained: r.marksObtained,
          graceMarks: r.graceMarks ?? 0,
          grade,
          remarks: r.remarks,
          enteredById,
        },
      });
    })
  );

  const students = await prisma.student.findMany({
    where: { id: { in: records.map((r) => r.studentId) } },
    select: { userId: true },
  });
  await createNotificationForMany({
    userIds: students.map((s) => s.userId),
    type: "MARKS_PUBLISHED",
    title: `Marks published: ${exam.name}`,
    message: `Your marks for ${exam.name} have been published.`,
    link: `/marks`,
  });

  return results;
}

export async function updateMark(
  id: string,
  data: { marksObtained?: number; graceMarks?: number; remarks?: string }
) {
  const existing = await prisma.mark.findUnique({ where: { id }, include: { exam: true, student: true } });
  if (!existing) throw ApiError.notFound("Mark not found");

  const marksObtained = data.marksObtained ?? existing.marksObtained;
  const graceMarks = data.graceMarks ?? existing.graceMarks;
  const total = marksObtained + graceMarks;
  if (total > existing.exam.maxMarks) {
    throw ApiError.badRequest(`Total marks (${total}) exceed the exam's maximum of ${existing.exam.maxMarks}`);
  }
  const percentage = (total / existing.exam.maxMarks) * 100;
  const grade = percentageToGrade(percentage);

  const updated = await prisma.mark.update({
    where: { id },
    data: { marksObtained, graceMarks, grade, remarks: data.remarks ?? existing.remarks },
  });

  await createNotification({
    userId: existing.student.userId,
    type: "MARKS_PUBLISHED",
    title: "A mark was updated",
    message: `Your marks for ${existing.exam.name} were revised.`,
    link: `/marks`,
  });

  return updated;
}

export async function getStudentMarks(studentId: string, semesterId?: string) {
  return prisma.mark.findMany({
    where: { studentId, ...(semesterId ? { semesterId } : {}) },
    include: { exam: true, subject: true, semester: true },
    orderBy: { createdAt: "desc" },
  });
}

interface SubjectAggregate {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  credits: number;
  weightedPercentage: number;
  grade: string;
  gradePoints: number;
}

async function computeSemesterSubjectAggregates(
  studentId: string,
  semesterId: string
): Promise<SubjectAggregate[]> {
  const marks = await prisma.mark.findMany({
    where: { studentId, semesterId },
    include: { exam: true, subject: true },
  });

  const bySubject = new Map<string, typeof marks>();
  for (const m of marks) {
    const list = bySubject.get(m.subjectId) ?? [];
    list.push(m);
    bySubject.set(m.subjectId, list);
  }

  const aggregates: SubjectAggregate[] = [];
  for (const [subjectId, subjectMarks] of bySubject) {
    let weightedSum = 0;
    let weightTotal = 0;
    for (const m of subjectMarks) {
      const percentage = ((m.marksObtained + m.graceMarks) / m.exam.maxMarks) * 100;
      weightedSum += percentage * m.exam.weightage;
      weightTotal += m.exam.weightage;
    }
    const weightedPercentage = weightTotal > 0 ? weightedSum / weightTotal : 0;
    aggregates.push({
      subjectId,
      subjectName: subjectMarks[0].subject.name,
      subjectCode: subjectMarks[0].subject.code,
      credits: subjectMarks[0].subject.credits,
      weightedPercentage: Number(weightedPercentage.toFixed(2)),
      grade: percentageToGrade(weightedPercentage),
      gradePoints: percentageToGradePoints(weightedPercentage),
    });
  }

  return aggregates;
}

function summarize(subjects: SubjectAggregate[]) {
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
  const weightedPoints = subjects.reduce((sum, s) => sum + s.gradePoints * s.credits, 0);
  const gpa = totalCredits > 0 ? Number((weightedPoints / totalCredits).toFixed(2)) : 0;
  const overallPercentage =
    subjects.length > 0
      ? Number((subjects.reduce((sum, s) => sum + s.weightedPercentage, 0) / subjects.length).toFixed(2))
      : 0;
  return { gpa, overallPercentage };
}

export async function getStudentSemesterReport(studentId: string, semesterId: string) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw ApiError.notFound("Student not found");

  const subjects = await computeSemesterSubjectAggregates(studentId, semesterId);
  const { gpa, overallPercentage } = summarize(subjects);
  const rank = await getStudentRankInSemester(studentId, semesterId);

  return {
    student: { id: student.id, fullName: student.fullName, rollNumber: student.rollNumber },
    subjects,
    gpa,
    overallPercentage,
    ...rank,
  };
}

export async function getStudentCGPA(studentId: string) {
  const semesters = await prisma.semester.findMany({
    where: { marks: { some: { studentId } } },
    orderBy: { startDate: "asc" },
  });

  const semesterGpas: Array<{ semesterId: string; semesterName: string; gpa: number }> = [];
  for (const semester of semesters) {
    const subjects = await computeSemesterSubjectAggregates(studentId, semester.id);
    const { gpa } = summarize(subjects);
    semesterGpas.push({ semesterId: semester.id, semesterName: semester.name, gpa });
  }

  const cgpa =
    semesterGpas.length > 0
      ? Number((semesterGpas.reduce((sum, s) => sum + s.gpa, 0) / semesterGpas.length).toFixed(2))
      : 0;

  return { cgpa, semesters: semesterGpas };
}

async function getStudentRankInSemester(studentId: string, semesterId: string) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student?.classId) return { rank: null as number | null, classSize: 0 };

  const classmates = await prisma.student.findMany({ where: { classId: student.classId } });

  const scored = await Promise.all(
    classmates.map(async (s) => {
      const subjects = await computeSemesterSubjectAggregates(s.id, semesterId);
      const { gpa } = summarize(subjects);
      return { studentId: s.id, gpa };
    })
  );

  scored.sort((a, b) => b.gpa - a.gpa);
  const rank = scored.findIndex((s) => s.studentId === studentId) + 1;

  return { rank: rank || null, classSize: scored.length };
}

export async function getClassRanking(classId: string, semesterId: string) {
  const students = await prisma.student.findMany({
    where: { classId },
    select: { id: true, fullName: true, rollNumber: true },
  });

  const ranked = await Promise.all(
    students.map(async (s) => {
      const subjects = await computeSemesterSubjectAggregates(s.id, semesterId);
      const { gpa, overallPercentage } = summarize(subjects);
      return { ...s, gpa, overallPercentage };
    })
  );

  ranked.sort((a, b) => b.gpa - a.gpa);
  return ranked.map((r, idx) => ({ ...r, rank: idx + 1 }));
}
