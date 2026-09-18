import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth.middleware";
import { requireTeacher, requireAnyRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as schema from "./reports.schema";
import * as ctrl from "./reports.controller";

const router = Router();
router.use(authenticate);

router.get("/", requireAnyRole, validate({ query: schema.listReportsQuerySchema }), ctrl.listReports);
router.get("/:id", requireAnyRole, validate({ params: z.object({ id: z.string().uuid() }) }), ctrl.getReport);

router.post(
  "/report-card/:studentId/:semesterId",
  requireTeacher,
  validate({ params: schema.reportCardParamsSchema }),
  ctrl.generateReportCard
);
router.post(
  "/class-marks/:classId/:semesterId",
  requireTeacher,
  validate({ params: schema.classMarksReportParamsSchema }),
  ctrl.generateClassMarksReport
);
router.post(
  "/attendance",
  requireTeacher,
  validate({ query: schema.attendanceReportQuerySchema }),
  ctrl.generateAttendanceReport
);

export default router;
