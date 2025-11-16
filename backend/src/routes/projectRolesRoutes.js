const express = require("express");
const router = express.Router();
const projectRolesController = require("../controllers/projectRolesController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { MODULES } = require("../constants/rbacMatrix");

router.use(authMiddleware);
router.use(roleMiddleware({ module: MODULES.APPLICANTS }));

router.get("/", projectRolesController.getAll);
router.get("/:id", projectRolesController.getById);
router.post("/", projectRolesController.create);
router.put("/:id", projectRolesController.update);
router.delete("/:id", projectRolesController.delete);

module.exports = router;

