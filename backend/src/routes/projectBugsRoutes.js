const express = require("express");
const router = express.Router();
const projectBugsController = require("../controllers/projectBugsController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { MODULES } = require("../constants/rbacMatrix");

// Public inline image preview
router.get("/:id/attachment", projectBugsController.streamAttachment);

router.use(authMiddleware);
router.use(roleMiddleware({ module: MODULES.APPLICANTS }));

router.get("/", projectBugsController.getAll);
router.get("/:id", projectBugsController.getById);
router.post("/", projectBugsController.create);
router.put("/:id", projectBugsController.update);
router.delete("/:id", projectBugsController.delete);

module.exports = router;

