import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth.middleware";
import { requireTeacher } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as ctrl from "./analytics.controller";

const router = Router();
router.use(authenticate, requireTeacher);

const classSemesterParams = z.object({ classId: z.string().uuid(), semesterId: z.string().uuid() });
const classSubjectParams = z.object({ classId: z.string().uuid(), subjectId: z.string().uuid() });
const departmentSemesterParams = z.object({ department: z.string().min(1), semesterId: z.string().uuid() });

router.get(
  "/attendance-vs-marks/:classId/:semesterId",
  validate({ params: classSemesterParams }),
  ctrl.attendanceVsMarks
);
router.get(
  "/performance-trend/:classId/:subjectId",
  validate({ params: classSubjectParams }),
  ctrl.performanceTrend
);
router.get(
  "/subjects/:classId/:semesterId",
  validate({ params: classSemesterParams }),
  ctrl.weakStrongSubjects
);
router.get("/top-students/:classId/:semesterId", validate({ params: classSemesterParams }), ctrl.topStudents);
router.get(
  "/risk-students/:classId/:semesterId",
  validate({ params: classSemesterParams }),
  ctrl.riskStudents
);
router.get("/class/:classId/:semesterId", validate({ params: classSemesterParams }), ctrl.classAnalytics);
router.get(
  "/department/:department/:semesterId",
  validate({ params: departmentSemesterParams }),
  ctrl.departmentAnalytics
);

export default router;
