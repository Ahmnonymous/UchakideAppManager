const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { MODULES } = require("../constants/rbacMatrix");

// Public endpoints (no authentication required)
router.get("/:id/full", projectController.full);
router.get("/:id/analyze", projectController.analyze);
router.post("/:id/sync", projectController.sync);

// Protected endpoints (authentication required)
router.use(authMiddleware);
router.use(roleMiddleware({ module: MODULES.APPLICANTS }));

router.get("/", projectController.getAll);
router.get("/:id", projectController.getById);
router.get("/:id/summary", projectController.summary);
router.post("/", projectController.create);
router.put("/:id", projectController.update);
router.delete("/:id", projectController.delete);

module.exports = router;

