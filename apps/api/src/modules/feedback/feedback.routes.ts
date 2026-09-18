import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createFeedbackSchema, listFeedbackQuerySchema } from "./feedback.schema";
import * as ctrl from "./feedback.controller";

const router = Router();
router.use(authenticate);

router.post("/", validate({ body: createFeedbackSchema }), ctrl.sendFeedback);
router.get("/received", validate({ query: listFeedbackQuerySchema }), ctrl.listReceivedFeedback);
router.get("/sent", validate({ query: listFeedbackQuerySchema }), ctrl.listSentFeedback);

export default router;
