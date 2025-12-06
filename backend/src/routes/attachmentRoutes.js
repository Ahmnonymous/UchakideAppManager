const express = require("express");
const router = express.Router();
const attachmentController = require("../controllers/attachmentController");

// Public endpoint - no authentication required for viewing attachments
router.get(
  "/projects/:projectId/attachments/:table/:id/:column",
  attachmentController.getAttachment,
);

module.exports = router;

