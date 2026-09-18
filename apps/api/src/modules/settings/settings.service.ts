import fs from "fs";
import path from "path";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";

export async function listSettings() {
  return prisma.systemSetting.findMany({ orderBy: { key: "asc" } });
}

export async function upsertSetting(key: string, value: string) {
  return prisma.systemSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function deleteSetting(key: string) {
  await prisma.systemSetting.deleteMany({ where: { key } });
}

const BACKUP_DIR = path.resolve(process.cwd(), env.UPLOAD_DIR, "backups");

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Portable, dependency-free backup: exports all core tables to a single JSON
 * file. Works regardless of whether `pg_dump` is available in the runtime
 * environment, and is trivially restorable via a scripted `prisma.$transaction`
 * of `createMany` calls in dependency order.
 */
export async function createBackup(): Promise<{ filename: string; sizeBytes: number }> {
  ensureBackupDir();

  const [
    users,
    admins,
    teachers,
    students,
    academicYears,
    semesters,
    classes,
    sections,
    subjects,
    classSubjects,
    teacherSubjects,
    timetableSlots,
    attendance,
    assignments,
    assignmentSubmissions,
    exams,
    marks,
    studyMaterials,
    queries,
    queryReplies,
    feedback,
    notices,
    notifications,
    reports,
    systemSettings,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.admin.findMany(),
    prisma.teacher.findMany(),
    prisma.student.findMany(),
    prisma.academicYear.findMany(),
    prisma.semester.findMany(),
    prisma.class.findMany(),
    prisma.section.findMany(),
    prisma.subject.findMany(),
    prisma.classSubject.findMany(),
    prisma.teacherSubject.findMany(),
    prisma.timetableSlot.findMany(),
    prisma.attendance.findMany(),
    prisma.assignment.findMany(),
    prisma.assignmentSubmission.findMany(),
    prisma.exam.findMany(),
    prisma.mark.findMany(),
    prisma.studyMaterial.findMany(),
    prisma.query.findMany(),
    prisma.queryReply.findMany(),
    prisma.feedback.findMany(),
    prisma.notice.findMany(),
    prisma.notification.findMany(),
    prisma.report.findMany(),
    prisma.systemSetting.findMany(),
  ]);

  const payload = {
    meta: { createdAt: new Date().toISOString(), version: 1 },
    data: {
      users,
      admins,
      teachers,
      students,
      academicYears,
      semesters,
      classes,
      sections,
      subjects,
      classSubjects,
      teacherSubjects,
      timetableSlots,
      attendance,
      assignments,
      assignmentSubmissions,
      exams,
      marks,
      studyMaterials,
      queries,
      queryReplies,
      feedback,
      notices,
      notifications,
      reports,
      systemSettings,
    },
  };

  const filename = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const filepath = path.join(BACKUP_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(payload, null, 2));

  const stats = fs.statSync(filepath);
  return { filename, sizeBytes: stats.size };
}

export function listBackups() {
  ensureBackupDir();
  return fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((filename) => {
      const stats = fs.statSync(path.join(BACKUP_DIR, filename));
      return { filename, sizeBytes: stats.size, createdAt: stats.birthtime };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getBackupFilePath(filename: string): string | null {
  // Prevent path traversal — only allow bare filenames we generated ourselves.
  if (filename.includes("/") || filename.includes("..")) return null;
  const filepath = path.join(BACKUP_DIR, filename);
  return fs.existsSync(filepath) ? filepath : null;
}
