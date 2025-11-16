const express = require("express");
const router = express.Router();
const projectTablesController = require("../controllers/projectTablesController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { MODULES } = require("../constants/rbacMatrix");

router.use(authMiddleware);
router.use(roleMiddleware({ module: MODULES.APPLICANTS }));

router.get("/", projectTablesController.getAll);
router.get("/:id", projectTablesController.getById);
router.post("/", projectTablesController.create);
router.put("/:id", projectTablesController.update);
router.delete("/:id", projectTablesController.delete);

module.exports = router;

