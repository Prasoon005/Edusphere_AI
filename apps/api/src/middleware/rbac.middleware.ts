import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { ApiError } from "../utils/apiError";

/** Restricts a route to one or more roles. Must run after `authenticate`. */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(`Role '${req.user.role}' is not permitted to access this resource`)
      );
    }
    next();
  };
}

/** Convenience guards */
export const requireSuperAdmin = authorize(Role.SUPER_ADMIN);
export const requireTeacher = authorize(Role.TEACHER, Role.SUPER_ADMIN);
export const requireStudent = authorize(Role.STUDENT, Role.SUPER_ADMIN);
export const requireAnyRole = authorize(Role.SUPER_ADMIN, Role.TEACHER, Role.STUDENT);

/**
 * Fine-grained permission check against the UserPermission table, for
 * super-admin-configurable permissions layered on top of role checks.
 */
import { prisma } from "../lib/prisma";

export function requirePermission(code: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized("Authentication required");
      }
      // Super admins bypass granular permission checks.
      if (req.user.role === Role.SUPER_ADMIN) {
        return next();
      }
      const grant = await prisma.userPermission.findFirst({
        where: { userId: req.user.id, permission: { code } },
      });
      if (!grant) {
        throw ApiError.forbidden(`Missing required permission: ${code}`);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Additive-only extension of a role guard: passes if the user's role is already
 * allowed (identical to `authorize(...roles)`, so existing access never changes),
 * OR if the user holds the named granular permission grant. This is how permission
 * grants made in Roles & Permissions actually take effect without narrowing any
 * currently-working role-based access.
 */
export function authorizeRoleOrPermission(roles: Role[], code: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized("Authentication required");
      }
      if (roles.includes(req.user.role) || req.user.role === Role.SUPER_ADMIN) {
        return next();
      }
      const grant = await prisma.userPermission.findFirst({
        where: { userId: req.user.id, permission: { code } },
      });
      if (!grant) {
        throw ApiError.forbidden(`Role '${req.user.role}' is not permitted to access this resource`);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
