import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireSuperAdmin } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { authRateLimiter } from "../../middleware/rateLimit.middleware";
import {
  requestResetSchema,
  rejectRequestSchema,
  completeResetSchema,
  listRequestsQuerySchema,
  idParamSchema,
} from "./password-reset.schema";
import * as ctrl from "./password-reset.controller";

const router = Router();

// Public — a user who cannot log in has no session yet.
router.post("/request", authRateLimiter, validate({ body: requestResetSchema }), ctrl.requestReset);
router.post("/complete", authRateLimiter, validate({ body: completeResetSchema }), ctrl.completeReset);

// Admin-only — identity verification for account recovery.
router.get("/", authenticate, requireSuperAdmin, validate({ query: listRequestsQuerySchema }), ctrl.listRequests);
router.post(
  "/:id/approve",
  authenticate,
  requireSuperAdmin,
  validate({ params: idParamSchema }),
  ctrl.approveRequest
);
router.post(
  "/:id/reject",
  authenticate,
  requireSuperAdmin,
  validate({ params: idParamSchema, body: rejectRequestSchema }),
  ctrl.rejectRequest
);

export default router;
