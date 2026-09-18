import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listNotificationsQuerySchema, idParamSchema } from "./notifications.schema";
import * as ctrl from "./notifications.controller";

const router = Router();
router.use(authenticate);

router.get("/", validate({ query: listNotificationsQuerySchema }), ctrl.listMyNotifications);
router.patch("/:id/read", validate({ params: idParamSchema }), ctrl.markAsRead);
router.patch("/read-all", ctrl.markAllAsRead);
router.delete("/:id", validate({ params: idParamSchema }), ctrl.deleteNotification);

export default router;
