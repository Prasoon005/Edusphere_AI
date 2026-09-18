import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireSuperAdmin, requireAnyRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createNoticeSchema, updateNoticeSchema, listNoticesQuerySchema, idParamSchema } from "./notices.schema";
import * as ctrl from "./notices.controller";

const router = Router();
router.use(authenticate);

router.get("/", requireAnyRole, validate({ query: listNoticesQuerySchema }), ctrl.listNotices);
router.post("/", requireSuperAdmin, validate({ body: createNoticeSchema }), ctrl.createNotice);
router.patch("/:id", requireSuperAdmin, validate({ params: idParamSchema, body: updateNoticeSchema }), ctrl.updateNotice);
router.delete("/:id", requireSuperAdmin, validate({ params: idParamSchema }), ctrl.deleteNotice);

export default router;
