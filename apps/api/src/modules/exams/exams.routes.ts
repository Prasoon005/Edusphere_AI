import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth.middleware";
import { requireTeacher, requireStudent, requireAnyRole, authorizeRoleOrPermission } from "../../middleware/rbac.middleware";
import { Role } from "@prisma/client";
import { validate } from "../../middleware/validate.middleware";
import * as schema from "./exams.schema";
import * as ctrl from "./exams.controller";

const router = Router();
router.use(authenticate);

const classSemesterParamSchema = z.object({ classId: z.string().uuid(), semesterId: z.string().uuid() });
const examsQuerySchema = z.object({
  subjectId: z.string().uuid().optional(),
  semesterId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
});
const studentMarksQuerySchema = z.object({ semesterId: z.string().uuid().optional() });

// Student self-service (defined before /:id routes to avoid collision)
router.get("/marks/me", requireStudent, validate({ query: studentMarksQuerySchema }), ctrl.getMyMarks);
router.get(
  "/report/me/:semesterId",
  requireStudent,
  validate({ params: schema.semesterIdParamSchema }),
  ctrl.getMySemesterReport
);
router.get("/cgpa/me", requireStudent, ctrl.getMyCGPA);

// Exams
router.get("/", requireAnyRole, validate({ query: examsQuerySchema }), ctrl.listExams);
router.get("/:id", requireAnyRole, validate({ params: schema.idParamSchema }), ctrl.getExam);
router.post("/", requireTeacher, validate({ body: schema.createExamSchema }), ctrl.createExam);
router.patch(
  "/:id",
  requireTeacher,
  validate({ params: schema.idParamSchema, body: schema.updateExamSchema }),
  ctrl.updateExam
);
router.delete("/:id", requireTeacher, validate({ params: schema.idParamSchema }), ctrl.deleteExam);

// Marks entry
router.post(
  "/marks/bulk",
  authorizeRoleOrPermission([Role.TEACHER], "marks.enter"),
  validate({ body: schema.enterMarksBulkSchema }),
  ctrl.enterMarksBulk
);
router.patch(
  "/marks/:id",
  requireTeacher,
  validate({ params: schema.idParamSchema, body: schema.updateMarkSchema }),
  ctrl.updateMark
);

// Marks / reports for a specific student (teacher/admin lookup)
router.get(
  "/marks/student/:studentId",
  requireAnyRole,
  validate({ params: schema.studentIdParamSchema, query: studentMarksQuerySchema }),
  ctrl.getStudentMarks
);
router.get(
  "/report/student/:studentId/:semesterId",
  requireAnyRole,
  validate({ params: schema.studentIdParamSchema.merge(schema.semesterIdParamSchema) }),
  ctrl.getStudentSemesterReport
);
router.get(
  "/cgpa/student/:studentId",
  requireAnyRole,
  validate({ params: schema.studentIdParamSchema }),
  ctrl.getStudentCGPA
);

// Class ranking
router.get(
  "/ranking/:classId/:semesterId",
  requireAnyRole,
  validate({ params: classSemesterParamSchema }),
  ctrl.getClassRanking
);

export default router;
