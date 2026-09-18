import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";

export async function listPermissions() {
  return prisma.permission.findMany({ orderBy: { code: "asc" } });
}

export async function createPermission(code: string, description?: string) {
  const existing = await prisma.permission.findUnique({ where: { code } });
  if (existing) throw ApiError.conflict(`Permission '${code}' already exists`);
  return prisma.permission.create({ data: { code, description } });
}

export async function deletePermission(id: string) {
  const existing = await prisma.permission.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Permission not found");
  await prisma.permission.delete({ where: { id } });
}

export async function listUsersWithRoles() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      permissions: { include: { permission: true } },
    },
    orderBy: { email: "asc" },
  });
}

export async function assignPermission(userId: string, permissionId: string) {
  const [user, permission] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.permission.findUnique({ where: { id: permissionId } }),
  ]);
  if (!user) throw ApiError.badRequest("User does not exist");
  if (!permission) throw ApiError.badRequest("Permission does not exist");

  const existing = await prisma.userPermission.findUnique({
    where: { userId_permissionId: { userId, permissionId } },
  });
  if (existing) throw ApiError.conflict("User already has this permission");

  return prisma.userPermission.create({
    data: { userId, permissionId },
    include: { permission: true },
  });
}

export async function revokePermission(userId: string, permissionId: string) {
  const existing = await prisma.userPermission.findUnique({
    where: { userId_permissionId: { userId, permissionId } },
  });
  if (!existing) throw ApiError.notFound("Grant not found");
  await prisma.userPermission.delete({ where: { id: existing.id } });
}
