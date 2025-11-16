const express = require("express");
const router = express.Router();
const projectUsersController = require("../controllers/projectUsersController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { MODULES } = require("../constants/rbacMatrix");

router.use(authMiddleware);
router.use(roleMiddleware({ module: MODULES.APPLICANTS }));

router.get("/", projectUsersController.getAll);
router.get("/:id", projectUsersController.getById);
router.post("/", projectUsersController.create);
router.put("/:id", projectUsersController.update);
router.delete("/:id", projectUsersController.delete);

module.exports = router;

