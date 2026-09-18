import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { hashPassword } from "../../utils/password";
import { paginationMeta } from "../../utils/apiResponse";
import { PaginationQuery, toOrderBy, toSkipTake } from "../../utils/pagination";

const studentInclude = {
  user: { select: { id: true, email: true, isActive: true, avatarUrl: true, lastLoginAt: true } },
  class: true,
  section: true,
} satisfies Prisma.StudentInclude;

interface ListStudentsQuery extends PaginationQuery {
  classId?: string;
  sectionId?: string;
}

export async function listStudents(query: ListStudentsQuery) {
  const where: Prisma.StudentWhereInput = {
    ...(query.classId ? { classId: query.classId } : {}),
    ...(query.sectionId ? { sectionId: query.sectionId } : {}),
    ...(query.search
      ? {
          OR: [
            { fullName: { contains: query.search, mode: "insensitive" } },
            { admissionNumber: { contains: query.search, mode: "insensitive" } },
            { rollNumber: { contains: query.search, mode: "insensitive" } },
            { user: { email: { contains: query.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: studentInclude,
      ...toSkipTake(query),
      orderBy: toOrderBy(query, ["fullName", "rollNumber", "admissionDate"], { fullName: "asc" }),
    }),
    prisma.student.count({ where }),
  ]);

  return { items, meta: paginationMeta(query.page, query.limit, total) };
}

export async function getStudentById(id: string) {
  const student = await prisma.student.findUnique({ where: { id }, include: studentInclude });
  if (!student) throw ApiError.notFound("Student not found");
  return student;
}

export async function getStudentByUserId(userId: string) {
  const student = await prisma.student.findUnique({ where: { userId }, include: studentInclude });
  if (!student) throw ApiError.notFound("Student profile not found for this user");
  return student;
}

interface CreateStudentInput {
  email: string;
  password?: string;
  admissionNumber: string;
  rollNumber: string;
  fullName: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: Date;
  phone?: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  classId?: string;
  sectionId?: string;
}

export async function createStudent(input: CreateStudentInput) {
  const existingEmail = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingEmail) throw ApiError.conflict("A user with this email already exists");

  const existingAdmission = await prisma.student.findUnique({
    where: { admissionNumber: input.admissionNumber },
  });
  if (existingAdmission) throw ApiError.conflict("This admission number is already in use");

  const passwordHash = await hashPassword(input.password ?? "Password@123");

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: Role.STUDENT,
      student: {
        create: {
          admissionNumber: input.admissionNumber,
          rollNumber: input.rollNumber,
          fullName: input.fullName,
          gender: input.gender,
          dateOfBirth: input.dateOfBirth,
          phone: input.phone,
          guardianName: input.guardianName,
          guardianPhone: input.guardianPhone,
          address: input.address,
          classId: input.classId,
          sectionId: input.sectionId,
        },
      },
    },
    include: { student: { include: studentInclude } },
  });

  return user.student!;
}

export async function updateStudent(id: string, data: Partial<Omit<CreateStudentInput, "email" | "password" | "admissionNumber">>) {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Student not found");

  return prisma.student.update({ where: { id }, data, include: studentInclude });
}

export async function deleteStudent(id: string) {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Student not found");
  // Cascades to delete the underlying User via the Student -> User relation's onDelete: Cascade
  // is defined the other direction (User owns Student), so remove the User instead to cascade cleanly.
  await prisma.user.delete({ where: { id: existing.userId } });
}

export async function setStudentActive(id: string, isActive: boolean) {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Student not found");
  await prisma.user.update({ where: { id: existing.userId }, data: { isActive } });
  return getStudentById(id);
}
