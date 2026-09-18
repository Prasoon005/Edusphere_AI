import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth.middleware";
import { requireTeacher, requireStudent, requireAnyRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { uploadMiddleware } from "../../middleware/upload.middleware";
import * as schema from "./assignments.schema";
import * as ctrl from "./assignments.controller";

const router = Router();
router.use(authenticate);

const submissionIdParamSchema = z.object({ submissionId: z.string().uuid() });

router.get("/", requireAnyRole, validate({ query: schema.listAssignmentsQuerySchema }), ctrl.listAssignments);
router.get("/:id", requireAnyRole, validate({ params: schema.idParamSchema }), ctrl.getAssignment);

router.post(
  "/",
  requireTeacher,
  validate({ body: schema.createAssignmentSchema }),
  ctrl.createAssignment
);
router.patch(
  "/:id",
  requireTeacher,
  validate({ params: schema.idParamSchema, body: schema.updateAssignmentSchema }),
  ctrl.updateAssignment
);
router.delete("/:id", requireTeacher, validate({ params: schema.idParamSchema }), ctrl.deleteAssignment);

router.get(
  "/:id/submissions",
  requireTeacher,
  validate({ params: schema.idParamSchema }),
  ctrl.listSubmissions
);
router.patch(
  "/submissions/:submissionId/grade",
  requireTeacher,
  validate({ params: submissionIdParamSchema, body: schema.gradeSubmissionSchema }),
  ctrl.gradeSubmission
);

router.get(
  "/:id/my-submission",
  requireStudent,
  validate({ params: schema.idParamSchema }),
  ctrl.getMySubmission
);
router.post(
  "/:id/submit",
  requireStudent,
  validate({ params: schema.idParamSchema }),
  uploadMiddleware("assignments").single("file"),
  ctrl.submitAssignment
);

export default router;
