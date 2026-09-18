import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth.middleware";
import { requireSuperAdmin, requireTeacher } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  createStudentSchema,
  updateStudentSchema,
  listStudentsQuerySchema,
  idParamSchema,
} from "./students.schema";
import * as ctrl from "./students.controller";

const router = Router();
router.use(authenticate);

router.get("/me", ctrl.getMyStudentProfile);

router.get("/", requireTeacher, validate({ query: listStudentsQuerySchema }), ctrl.listStudents);
router.get("/:id", requireTeacher, validate({ params: idParamSchema }), ctrl.getStudent);

router.post("/", requireSuperAdmin, validate({ body: createStudentSchema }), ctrl.createStudent);
router.patch(
  "/:id",
  requireSuperAdmin,
  validate({ params: idParamSchema, body: updateStudentSchema }),
  ctrl.updateStudent
);
router.patch(
  "/:id/active",
  requireSuperAdmin,
  validate({ params: idParamSchema, body: z.object({ isActive: z.boolean() }) }),
  ctrl.setStudentActive
);
router.delete("/:id", requireSuperAdmin, validate({ params: idParamSchema }), ctrl.deleteStudent);

export default router;
