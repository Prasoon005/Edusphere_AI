import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth.middleware";
import { requireSuperAdmin, requireAnyRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { idParamSchema } from "./academic.schema";
import * as schema from "./academic.schema";
import * as ctrl from "./academic.controller";

const router = Router();
router.use(authenticate);

const sectionIdParamSchema = z.object({ sectionId: z.string().uuid() });

// Academic Years
router.get("/academic-years", requireAnyRole, ctrl.listAcademicYears);
router.post(
  "/academic-years",
  requireSuperAdmin,
  validate({ body: schema.createAcademicYearSchema }),
  ctrl.createAcademicYear
);
router.patch(
  "/academic-years/:id",
  requireSuperAdmin,
  validate({ params: idParamSchema, body: schema.updateAcademicYearSchema }),
  ctrl.updateAcademicYear
);
router.delete(
  "/academic-years/:id",
  requireSuperAdmin,
  validate({ params: idParamSchema }),
  ctrl.deleteAcademicYear
);

// Semesters
router.get("/semesters", requireAnyRole, ctrl.listSemesters);
router.post(
  "/semesters",
  requireSuperAdmin,
  validate({ body: schema.createSemesterSchema }),
  ctrl.createSemester
);
router.patch(
  "/semesters/:id",
  requireSuperAdmin,
  validate({ params: idParamSchema, body: schema.updateSemesterSchema }),
  ctrl.updateSemester
);
router.delete(
  "/semesters/:id",
  requireSuperAdmin,
  validate({ params: idParamSchema }),
  ctrl.deleteSemester
);

// Subjects
router.get("/subjects", requireAnyRole, ctrl.listSubjects);
router.post(
  "/subjects",
  requireSuperAdmin,
  validate({ body: schema.createSubjectSchema }),
  ctrl.createSubject
);
router.patch(
  "/subjects/:id",
  requireSuperAdmin,
  validate({ params: idParamSchema, body: schema.updateSubjectSchema }),
  ctrl.updateSubject
);
router.delete(
  "/subjects/:id",
  requireSuperAdmin,
  validate({ params: idParamSchema }),
  ctrl.deleteSubject
);

// Classes
router.get("/classes", requireAnyRole, ctrl.listClasses);
router.get("/classes/:id", requireAnyRole, validate({ params: idParamSchema }), ctrl.getClass);
router.post(
  "/classes",
  requireSuperAdmin,
  validate({ body: schema.createClassSchema }),
  ctrl.createClass
);
router.patch(
  "/classes/:id",
  requireSuperAdmin,
  validate({ params: idParamSchema, body: schema.updateClassSchema }),
  ctrl.updateClass
);
router.delete(
  "/classes/:id",
  requireSuperAdmin,
  validate({ params: idParamSchema }),
  ctrl.deleteClass
);

// Sections
router.get("/sections", requireAnyRole, ctrl.listSections);
router.post(
  "/sections",
  requireSuperAdmin,
  validate({ body: schema.createSectionSchema }),
  ctrl.createSection
);
router.patch(
  "/sections/:id",
  requireSuperAdmin,
  validate({ params: idParamSchema, body: schema.updateSectionSchema }),
  ctrl.updateSection
);
router.delete(
  "/sections/:id",
  requireSuperAdmin,
  validate({ params: idParamSchema }),
  ctrl.deleteSection
);

// Teacher <-> Subject assignment
router.post(
  "/teacher-subjects",
  requireSuperAdmin,
  validate({ body: schema.assignTeacherSubjectSchema }),
  ctrl.assignTeacherSubject
);
router.delete(
  "/teacher-subjects",
  requireSuperAdmin,
  validate({ body: schema.assignTeacherSubjectSchema }),
  ctrl.unassignTeacherSubject
);

// Timetable
router.get(
  "/timetable/section/:sectionId",
  requireAnyRole,
  validate({ params: sectionIdParamSchema }),
  ctrl.getSectionTimetable
);
router.get("/timetable/me", requireAnyRole, ctrl.getMyTimetable);
router.post(
  "/timetable",
  requireSuperAdmin,
  validate({ body: schema.createTimetableSlotSchema }),
  ctrl.createTimetableSlot
);
router.delete(
  "/timetable/:id",
  requireSuperAdmin,
  validate({ params: idParamSchema }),
  ctrl.deleteTimetableSlot
);

export default router;
