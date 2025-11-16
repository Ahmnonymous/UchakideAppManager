const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");

router.get("/", projectController.getAll);
router.get("/:id", projectController.getById);
router.get("/:id/summary", projectController.summary);
router.post("/", projectController.create);
router.put("/:id", projectController.update);
router.delete("/:id", projectController.delete);

module.exports = router;

