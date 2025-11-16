const express = require("express");
const router = express.Router();
const projectPaymentsController = require("../controllers/projectPaymentsController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { MODULES } = require("../constants/rbacMatrix");

// Public inline image preview (no auth header needed for <img> tags)
router.get("/:id/attachment", projectPaymentsController.streamAttachment);

router.use(authMiddleware);
router.use(roleMiddleware({ module: MODULES.APPLICANTS }));

router.get("/", projectPaymentsController.getAll);
router.get("/:id", projectPaymentsController.getById);
router.post("/", projectPaymentsController.create);
router.put("/:id", projectPaymentsController.update);
router.delete("/:id", projectPaymentsController.delete);

module.exports = router;

