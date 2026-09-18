import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireSuperAdmin } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listAuditLogsQuerySchema } from "./audit.schema";
import * as ctrl from "./audit.controller";

const router = Router();
router.use(authenticate, requireSuperAdmin);

router.get("/", validate({ query: listAuditLogsQuerySchema }), ctrl.listAuditLogs);
router.get("/entities", ctrl.listEntities);

export default router;
