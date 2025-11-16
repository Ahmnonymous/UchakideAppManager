const express = require("express");
const router = express.Router();
const projectReportsController = require("../controllers/projectReportsController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { MODULES } = require("../constants/rbacMatrix");

router.use(authMiddleware);
router.use(roleMiddleware({ module: MODULES.APPLICANTS }));

router.get("/", projectReportsController.getAll);
router.get("/:id", projectReportsController.getById);
router.post("/", projectReportsController.create);
router.put("/:id", projectReportsController.update);
router.delete("/:id", projectReportsController.delete);

module.exports = router;

