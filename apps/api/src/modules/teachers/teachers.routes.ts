import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth.middleware";
import { requireSuperAdmin, requireAnyRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  createTeacherSchema,
  updateTeacherSchema,
  listTeachersQuerySchema,
  idParamSchema,
} from "./teachers.schema";
import * as ctrl from "./teachers.controller";

const router = Router();
router.use(authenticate);

router.get("/me", ctrl.getMyTeacherProfile);

router.get("/", requireAnyRole, validate({ query: listTeachersQuerySchema }), ctrl.listTeachers);
router.get("/:id", requireAnyRole, validate({ params: idParamSchema }), ctrl.getTeacher);

router.post("/", requireSuperAdmin, validate({ body: createTeacherSchema }), ctrl.createTeacher);
router.patch(
  "/:id",
  requireSuperAdmin,
  validate({ params: idParamSchema, body: updateTeacherSchema }),
  ctrl.updateTeacher
);
router.patch(
  "/:id/active",
  requireSuperAdmin,
  validate({ params: idParamSchema, body: z.object({ isActive: z.boolean() }) }),
  ctrl.setTeacherActive
);
router.delete("/:id", requireSuperAdmin, validate({ params: idParamSchema }), ctrl.deleteTeacher);

export default router;
