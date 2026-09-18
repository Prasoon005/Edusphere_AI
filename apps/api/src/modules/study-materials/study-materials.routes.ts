import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireTeacher, requireAnyRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { uploadMiddleware } from "../../middleware/upload.middleware";
import { createStudyMaterialSchema, listStudyMaterialsQuerySchema, idParamSchema } from "./study-materials.schema";
import * as ctrl from "./study-materials.controller";

const router = Router();
router.use(authenticate);

router.get("/", requireAnyRole, validate({ query: listStudyMaterialsQuerySchema }), ctrl.listStudyMaterials);

router.post(
  "/",
  requireTeacher,
  uploadMiddleware("materials").single("file"),
  validate({ body: createStudyMaterialSchema }),
  ctrl.uploadStudyMaterial
);

router.delete("/:id", requireTeacher, validate({ params: idParamSchema }), ctrl.deleteStudyMaterial);

export default router;
