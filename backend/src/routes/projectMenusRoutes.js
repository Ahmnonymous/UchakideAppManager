const express = require("express");
const multer = require("multer");
const router = express.Router();
const roleMiddleware = require("../middlewares/roleMiddleware");
const controller = require("../controllers/projectMenusController");

const upload = multer({ storage: multer.memoryStorage() });

// Public inline image preview
router.get("/:id/attachment", controller.streamAttachment);

// RBAC is globally bypassed during development per middleware env flags
router.get("/", roleMiddleware("menus", "read"), controller.getAll);
router.get("/:id", roleMiddleware("menus", "read"), controller.getById);
router.post("/", roleMiddleware("menus", "write"), upload.single("file"), controller.create);
router.put("/:id", roleMiddleware("menus", "write"), upload.single("file"), controller.update);
router.delete("/:id", roleMiddleware("menus", "write"), controller.delete);

module.exports = router;


