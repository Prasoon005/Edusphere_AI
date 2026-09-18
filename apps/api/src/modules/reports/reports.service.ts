import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { env } from "../../config/env";
import { paginationMeta } from "../../utils/apiResponse";
import { PaginationQuery, toSkipTake } from "../../utils/pagination";
import { getStudentSemesterReport } from "../exams/marks.service";
import { getStudentAttendanceStats } from "../attendance/attendance.service";

const REPORTS_DIR = path.resolve(process.cwd(), env.UPLOAD_DIR, "reports");

function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function publicReportUrl(filename: string): string {
  return `/uploads/reports/${filename}`;
}

// ---------- Report Card (PDF) ----------

export async function generateReportCardPdf(studentId: string, semesterId: string, generatedById: string) {
  ensureReportsDir();

  const [report, attendanceStats, semester] = await Promise.all([
    getStudentSemesterReport(studentId, semesterId),
    getStudentAttendanceStats(studentId),
    prisma.semester.findUnique({ where: { id: semesterId }, include: { academicYear: true } }),
  ]);
  if (!semester) throw ApiError.notFound("Semester not found");

  const filename = `report-card-${studentId}-${uuidv4()}.pdf`;
  const filepath = path.join(REPORTS_DIR, filename);

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    doc.fontSize(20).text("EduSphere AI", { align: "center" });
    doc.fontSize(12).fillColor("#555").text("Official Semester Report Card", { align: "center" });
    doc.moveDown(1.5);

    doc.fillColor("#000").fontSize(11);
    doc.text(`Student: ${report.student.fullName}`);
    doc.text(`Roll Number: ${report.student.rollNumber}`);
    doc.text(`Semester: ${semester.name} (${semester.academicYear.name})`);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(13).text("Subject-wise Performance", { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const colX = { subject: 50, credits: 260, percent: 330, grade: 420, points: 490 };
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Subject", colX.subject, tableTop);
    doc.text("Credits", colX.credits, tableTop);
    doc.text("Score %", colX.percent, tableTop);
    doc.text("Grade", colX.grade, tableTop);
    doc.text("Points", colX.points, tableTop);
    doc.font("Helvetica");
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

    let y = tableTop + 22;
    for (const subject of report.subjects) {
      doc.text(`${subject.subjectName} (${subject.subjectCode})`, colX.subject, y, { width: 200 });
      doc.text(String(subject.credits), colX.credits, y);
      doc.text(`${subject.weightedPercentage}%`, colX.percent, y);
      doc.text(subject.grade, colX.grade, y);
      doc.text(String(subject.gradePoints), colX.points, y);
      y += 20;
    }

    doc.moveTo(50, y + 5).lineTo(545, y + 5).stroke();
    y += 20;

    doc.fontSize(12).text(`GPA: ${report.gpa}`, 50, y);
    doc.text(`Overall Percentage: ${report.overallPercentage}%`, 250, y);
    y += 20;
    doc.text(`Class Rank: ${report.rank ?? "N/A"} of ${report.classSize}`, 50, y);
    y += 30;

    doc.fontSize(13).text("Attendance Summary", 50, y, { underline: true });
    y += 20;
    doc.fontSize(11).text(`Overall Attendance: ${attendanceStats.overallPercentage}%`, 50, y);
    y += 15;
    doc.text(`Total Classes Recorded: ${attendanceStats.totalClasses}`, 50, y);

    doc.end();
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });

  const stats = fs.statSync(filepath);

  const dbReport = await prisma.report.create({
    data: {
      type: "REPORT_CARD",
      format: "PDF",
      title: `Report Card — ${report.student.fullName} — ${semester.name}`,
      fileUrl: publicReportUrl(filename),
      aboutStudentId: studentId,
      generatedById,
    },
  });

  return { ...dbReport, sizeBytes: stats.size };
}

// ---------- Class Marks Report (Excel) ----------

export async function generateClassMarksExcel(classId: string, semesterId: string, generatedById: string) {
  ensureReportsDir();

  const [cls, students] = await Promise.all([
    prisma.class.findUnique({ where: { id: classId } }),
    prisma.student.findMany({ where: { classId }, orderBy: { rollNumber: "asc" } }),
  ]);
  if (!cls) throw ApiError.notFound("Class not found");

  const reports = await Promise.all(students.map((s) => getStudentSemesterReport(s.id, semesterId)));

  const subjectNames = [...new Set(reports.flatMap((r) => r.subjects.map((s) => s.subjectName)))];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "EduSphere AI";
  const sheet = workbook.addWorksheet("Marks Report");

  sheet.columns = [
    { header: "Roll No", key: "roll", width: 12 },
    { header: "Student Name", key: "name", width: 28 },
    ...subjectNames.map((name) => ({ header: name, key: name, width: 16 })),
    { header: "GPA", key: "gpa", width: 10 },
    { header: "Overall %", key: "overall", width: 12 },
    { header: "Rank", key: "rank", width: 8 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };

  reports.forEach((r) => {
    const row: Record<string, string | number> = { roll: r.student.rollNumber, name: r.student.fullName };
    for (const subjectName of subjectNames) {
      const subject = r.subjects.find((s) => s.subjectName === subjectName);
      row[subjectName] = subject ? `${subject.weightedPercentage}% (${subject.grade})` : "-";
    }
    row.gpa = r.gpa;
    row.overall = `${r.overallPercentage}%`;
    row.rank = r.rank ?? "-";
    sheet.addRow(row);
  });

  const filename = `marks-report-${classId}-${uuidv4()}.xlsx`;
  const filepath = path.join(REPORTS_DIR, filename);
  await workbook.xlsx.writeFile(filepath);

  const stats = fs.statSync(filepath);

  const dbReport = await prisma.report.create({
    data: {
      type: "MARKS_REPORT",
      format: "EXCEL",
      title: `Marks Report — ${cls.name}`,
      fileUrl: publicReportUrl(filename),
      generatedById,
    },
  });

  return { ...dbReport, sizeBytes: stats.size };
}

// ---------- Attendance Report (CSV) ----------

export async function generateAttendanceCsv(
  classId: string,
  filters: { subjectId?: string; from: Date; to: Date },
  generatedById: string
) {
  ensureReportsDir();

  const [cls, students] = await Promise.all([
    prisma.class.findUnique({ where: { id: classId } }),
    prisma.student.findMany({ where: { classId }, orderBy: { rollNumber: "asc" } }),
  ]);
  if (!cls) throw ApiError.notFound("Class not found");

  const rows: string[] = ["Roll No,Student Name,Total Classes,Present,Absent,Late,Excused,Percentage"];

  for (const student of students) {
    const records = await prisma.attendance.findMany({
      where: {
        studentId: student.id,
        ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
        date: { gte: filters.from, lte: filters.to },
      },
    });

    const present = records.filter((r) => r.status === "PRESENT").length;
    const absent = records.filter((r) => r.status === "ABSENT").length;
    const late = records.filter((r) => r.status === "LATE").length;
    const excused = records.filter((r) => r.status === "EXCUSED").length;
    const total = records.length;
    const percentage = total > 0 ? (((present + late) / total) * 100).toFixed(2) : "0.00";

    const safeName = student.fullName.includes(",") ? `"${student.fullName}"` : student.fullName;
    rows.push(`${student.rollNumber},${safeName},${total},${present},${absent},${late},${excused},${percentage}`);
  }

  const filename = `attendance-report-${classId}-${uuidv4()}.csv`;
  const filepath = path.join(REPORTS_DIR, filename);
  fs.writeFileSync(filepath, rows.join("\n"));

  const stats = fs.statSync(filepath);

  const dbReport = await prisma.report.create({
    data: {
      type: "ATTENDANCE_REPORT",
      format: "CSV",
      title: `Attendance Report — ${cls.name} (${filters.from.toDateString()} to ${filters.to.toDateString()})`,
      fileUrl: publicReportUrl(filename),
      generatedById,
    },
  });

  return { ...dbReport, sizeBytes: stats.size };
}

// ---------- Listing / retrieval ----------

export async function listReports(query: PaginationQuery, aboutStudentId?: string) {
  const where = aboutStudentId ? { aboutStudentId } : {};
  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: { generatedBy: { select: { email: true, role: true } }, aboutStudent: { select: { fullName: true } } },
      ...toSkipTake(query),
      orderBy: { createdAt: "desc" },
    }),
    prisma.report.count({ where }),
  ]);
  return { items, meta: paginationMeta(query.page, query.limit, total) };
}

export async function getReportById(id: string) {
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) throw ApiError.notFound("Report not found");
  return report;
}
