import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireTeacher, requireStudent, requireAnyRole, authorizeRoleOrPermission } from "../../middleware/rbac.middleware";
import { Role } from "@prisma/client";
import { validate } from "../../middleware/validate.middleware";
import * as schema from "./attendance.schema";
import * as ctrl from "./attendance.controller";

const router = Router();
router.use(authenticate);

// Student self-service
router.get("/me", requireStudent, validate({ query: schema.attendanceQuerySchema }), ctrl.getMyAttendance);
router.get("/me/stats", requireStudent, ctrl.getMyAttendanceStats);
router.get("/me/heatmap", requireStudent, ctrl.getMyAttendanceHeatmap);

// Teacher marking
router.post(
  "/mark",
  authorizeRoleOrPermission([Role.TEACHER], "attendance.mark"),
  validate({ body: schema.markAttendanceBulkSchema }),
  ctrl.markAttendanceBulk
);
router.patch(
  "/:id",
  requireTeacher,
  validate({ params: schema.idParamSchema, body: schema.updateAttendanceSchema }),
  ctrl.updateAttendanceRecord
);
router.get(
  "/section/:sectionId",
  requireTeacher,
  validate({ params: schema.sectionIdParamSchema, query: schema.sectionAttendanceQuerySchema }),
  ctrl.getSectionAttendanceForDate
);
router.get(
  "/low",
  requireTeacher,
  validate({ query: schema.lowAttendanceQuerySchema }),
  ctrl.getLowAttendanceStudents
);

// Per-student views (teacher/admin looking up a specific student)
router.get(
  "/student/:studentId",
  requireAnyRole,
  validate({ params: schema.studentIdParamSchema, query: schema.attendanceQuerySchema }),
  ctrl.getStudentAttendance
);
router.get(
  "/student/:studentId/stats",
  requireAnyRole,
  validate({ params: schema.studentIdParamSchema }),
  ctrl.getStudentAttendanceStats
);
router.get(
  "/student/:studentId/heatmap",
  requireAnyRole,
  validate({ params: schema.studentIdParamSchema }),
  ctrl.getAttendanceHeatmap
);

export default router;
