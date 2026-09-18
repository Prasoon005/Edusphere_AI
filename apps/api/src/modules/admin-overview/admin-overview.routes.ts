import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireSuperAdmin } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  attendanceOverviewQuerySchema,
  assignmentOverviewQuerySchema,
  examOverviewQuerySchema,
} from "./admin-overview.schema";
import * as ctrl from "./admin-overview.controller";

const router = Router();
router.use(authenticate, requireSuperAdmin);

router.get("/attendance", validate({ query: attendanceOverviewQuerySchema }), ctrl.attendanceOverview);
router.get("/assignments", validate({ query: assignmentOverviewQuerySchema }), ctrl.assignmentOverview);
router.get("/exams", validate({ query: examOverviewQuerySchema }), ctrl.examOverview);

export default router;
