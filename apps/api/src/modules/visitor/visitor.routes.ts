import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireSuperAdmin } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { publicRateLimiter } from "../../middleware/rateLimit.middleware";
import { startSessionSchema, pageViewSchema, endSessionSchema } from "./visitor.schema";
import * as ctrl from "./visitor.controller";

const router = Router();

// Public, unauthenticated, anonymous-only surface — no access to any protected data.
router.post("/session", publicRateLimiter, validate({ body: startSessionSchema }), ctrl.startSession);
router.post("/pageview", publicRateLimiter, validate({ body: pageViewSchema }), ctrl.recordPageView);
router.post("/session/end", publicRateLimiter, validate({ body: endSessionSchema }), ctrl.endSession);

// Admin-only analytics read.
router.get("/analytics", authenticate, requireSuperAdmin, ctrl.getAnalytics);

export default router;
