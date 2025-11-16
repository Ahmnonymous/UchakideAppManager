const express = require("express");
const router = express.Router();
const controller = require("../controllers/projectRoleMenuAccessController");
const roleMiddleware = require("../middlewares/roleMiddleware");

// RBAC enforcement is bypassed in dev via env; keep middleware for structure
router.get("/", roleMiddleware("rbac", "read"), controller.getAll);
router.get("/:id", roleMiddleware("rbac", "read"), controller.getById);
router.post("/", roleMiddleware("rbac", "write"), controller.create);
router.put("/:id", roleMiddleware("rbac", "write"), controller.update);
router.delete("/:id", roleMiddleware("rbac", "write"), controller.delete);

module.exports = router;


