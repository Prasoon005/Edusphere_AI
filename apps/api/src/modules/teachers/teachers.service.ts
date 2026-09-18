import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { hashPassword } from "../../utils/password";
import { paginationMeta } from "../../utils/apiResponse";
import { PaginationQuery, toOrderBy, toSkipTake } from "../../utils/pagination";

const teacherInclude = {
  user: { select: { id: true, email: true, isActive: true, avatarUrl: true, lastLoginAt: true } },
  subjectAssignments: { include: { subject: true } },
} satisfies Prisma.TeacherInclude;

interface ListTeachersQuery extends PaginationQuery {
  department?: string;
}

export async function listTeachers(query: ListTeachersQuery) {
  const where: Prisma.TeacherWhereInput = {
    ...(query.department ? { department: query.department } : {}),
    ...(query.search
      ? {
          OR: [
            { fullName: { contains: query.search, mode: "insensitive" } },
            { employeeId: { contains: query.search, mode: "insensitive" } },
            { user: { email: { contains: query.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.teacher.findMany({
      where,
      include: teacherInclude,
      ...toSkipTake(query),
      orderBy: toOrderBy(query, ["fullName", "employeeId"], { fullName: "asc" }),
    }),
    prisma.teacher.count({ where }),
  ]);

  return { items, meta: paginationMeta(query.page, query.limit, total) };
}

export async function getTeacherById(id: string) {
  const teacher = await prisma.teacher.findUnique({ where: { id }, include: teacherInclude });
  if (!teacher) throw ApiError.notFound("Teacher not found");
  return teacher;
}

export async function getTeacherByUserId(userId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { userId }, include: teacherInclude });
  if (!teacher) throw ApiError.notFound("Teacher profile not found for this user");
  return teacher;
}

interface CreateTeacherInput {
  email: string;
  password?: string;
  employeeId: string;
  fullName: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  phone?: string;
  department?: string;
  designation?: string;
  qualification?: string;
  joiningDate?: Date;
  address?: string;
}

export async function createTeacher(input: CreateTeacherInput) {
  const existingEmail = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingEmail) throw ApiError.conflict("A user with this email already exists");

  const existingEmployee = await prisma.teacher.findUnique({ where: { employeeId: input.employeeId } });
  if (existingEmployee) throw ApiError.conflict("This employee ID is already in use");

  const passwordHash = await hashPassword(input.password ?? "Password@123");

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: Role.TEACHER,
      teacher: {
        create: {
          employeeId: input.employeeId,
          fullName: input.fullName,
          gender: input.gender,
          phone: input.phone,
          department: input.department,
          designation: input.designation,
          qualification: input.qualification,
          joiningDate: input.joiningDate,
          address: input.address,
        },
      },
    },
    include: { teacher: { include: teacherInclude } },
  });

  return user.teacher!;
}

export async function updateTeacher(
  id: string,
  data: Partial<Omit<CreateTeacherInput, "email" | "password" | "employeeId">>
) {
  const existing = await prisma.teacher.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Teacher not found");
  return prisma.teacher.update({ where: { id }, data, include: teacherInclude });
}

export async function deleteTeacher(id: string) {
  const existing = await prisma.teacher.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Teacher not found");
  await prisma.user.delete({ where: { id: existing.userId } });
}

export async function setTeacherActive(id: string, isActive: boolean) {
  const existing = await prisma.teacher.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Teacher not found");
  await prisma.user.update({ where: { id: existing.userId }, data: { isActive } });
  return getTeacherById(id);
}
