import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireSuperAdmin } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createPermissionSchema, assignPermissionSchema, idParamSchema } from "./permissions.schema";
import * as ctrl from "./permissions.controller";

const router = Router();
router.use(authenticate, requireSuperAdmin);

router.get("/", ctrl.listPermissions);
router.post("/", validate({ body: createPermissionSchema }), ctrl.createPermission);
router.delete("/:id", validate({ params: idParamSchema }), ctrl.deletePermission);

router.get("/users", ctrl.listUsersWithRoles);
router.post("/assign", validate({ body: assignPermissionSchema }), ctrl.assignPermission);
router.post("/revoke", validate({ body: assignPermissionSchema }), ctrl.revokePermission);

export default router;
