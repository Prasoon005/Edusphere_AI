import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth.middleware";
import { requireSuperAdmin } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { upsertSettingSchema } from "./settings.schema";
import * as ctrl from "./settings.controller";

const router = Router();
router.use(authenticate, requireSuperAdmin);

router.get("/", ctrl.listSettings);
router.put("/", validate({ body: upsertSettingSchema }), ctrl.upsertSetting);
router.delete("/:key", validate({ params: z.object({ key: z.string().min(1) }) }), ctrl.deleteSetting);

router.post("/backups", ctrl.createBackup);
router.get("/backups", ctrl.listBackups);
router.get(
  "/backups/:filename",
  validate({ params: z.object({ filename: z.string().min(1) }) }),
  ctrl.downloadBackup
);

export default router;
