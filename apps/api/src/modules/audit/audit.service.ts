import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { paginationMeta } from "../../utils/apiResponse";
import { PaginationQuery, toSkipTake } from "../../utils/pagination";

const SENSITIVE_KEYS = ["password", "currentPassword", "newPassword", "passwordHash", "token", "refreshToken", "accessToken"];

/** Strips sensitive fields from arbitrary metadata before it is persisted. */
function sanitizeMetadata(metadata?: Record<string, unknown>): Prisma.InputJsonValue | undefined {
  if (!metadata) return undefined;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) continue;
    clean[key] = value;
  }
  return clean as Prisma.InputJsonValue;
}

export interface LogActionInput {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/** Reusable audit-log helper. Call this from any module after a sensitive/important action. */
export async function logAction(input: LogActionInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? undefined,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        metadata: sanitizeMetadata(input.metadata),
        ipAddress: input.ipAddress,
      },
    });
  } catch {
    // Audit logging must never break the primary request flow.
  }
}

interface ListQuery extends PaginationQuery {
  action?: string;
  entity?: string;
  userId?: string;
  from?: Date;
  to?: Date;
}

export async function listAuditLogs(query: ListQuery) {
  const where: Prisma.AuditLogWhereInput = {
    ...(query.action ? { action: { contains: query.action, mode: "insensitive" } } : {}),
    ...(query.entity ? { entity: query.entity } : {}),
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          },
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { action: { contains: query.search, mode: "insensitive" } },
            { entity: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, email: true, role: true } } },
      ...toSkipTake(query),
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, meta: paginationMeta(query.page, query.limit, total) };
}

export async function getDistinctEntities() {
  const rows = await prisma.auditLog.findMany({
    distinct: ["entity"],
    select: { entity: true },
    orderBy: { entity: "asc" },
  });
  return rows.map((r) => r.entity);
}
