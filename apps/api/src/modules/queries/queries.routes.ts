import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireStudent, requireTeacher } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as schema from "./queries.schema";
import * as ctrl from "./queries.controller";

const router = Router();
router.use(authenticate);

router.get("/me", requireStudent, validate({ query: schema.listQueriesQuerySchema }), ctrl.listMyQueries);
router.post("/", requireStudent, validate({ body: schema.createQuerySchema }), ctrl.createQuery);

router.get(
  "/teacher",
  requireTeacher,
  validate({ query: schema.listQueriesQuerySchema }),
  ctrl.listQueriesForTeacher
);

router.get("/:id", validate({ params: schema.idParamSchema }), ctrl.getQuery);
router.post(
  "/:id/reply",
  requireTeacher,
  validate({ params: schema.idParamSchema, body: schema.replyToQuerySchema }),
  ctrl.replyToQuery
);
router.patch(
  "/:id/status",
  requireTeacher,
  validate({ params: schema.idParamSchema, body: schema.updateQueryStatusSchema }),
  ctrl.updateQueryStatus
);

export default router;
