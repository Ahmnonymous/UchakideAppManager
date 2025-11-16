const projectMenusModel = require("../models/projectMenusModel");
const { stripAutoId } = require("../utils/payloadUtils");

const getAuditName = (req) =>
  (req.user && (req.user.full_name || req.user.name)) || req.user?.username || "system";

const normalizeStatus = (value) => value; // placeholder if needed later

const normalizeSortOrder = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const projectMenusController = {
  getAll: async (req, res) => {
    try {
      const { projectId } = req.query;
      const data = projectId
        ? await projectMenusModel.getByProject(projectId)
        : await projectMenusModel.getAll();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const record = await projectMenusModel.getById(req.params.id);
      if (!record) {
        return res.status(404).json({ error: "Menu not found" });
      }
      return res.json(record);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const auditName = getAuditName(req);
      const payload = {
        ...req.body,
        sort_order: normalizeSortOrder(req.body?.sort_order),
        created_by: auditName,
        updated_by: auditName,
      };

      // Map multer file -> attachment fields
      if (req.file) {
        if (!String(req.file.mimetype || "").toLowerCase().startsWith("image/")) {
          return res.status(415).json({ error: "Only image attachments are supported" });
        }
        payload.attachment = req.file.buffer;
        payload.attachment_mime = req.file.mimetype;
        payload.attachment_size = req.file.size || null;
        if (!payload.attachment_filename) {
          payload.attachment_filename = req.file.originalname;
        }
      }

      stripAutoId(payload);
      const created = await projectMenusModel.create(payload);
      return res.status(201).json(created);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const payload = {
        ...req.body,
        updated_by: getAuditName(req),
        sort_order: normalizeSortOrder(req.body?.sort_order),
      };
      delete payload.created_by;

      // Map multer file -> attachment fields (optional replace)
      if (req.file) {
        if (!String(req.file.mimetype || "").toLowerCase().startsWith("image/")) {
          return res.status(415).json({ error: "Only image attachments are supported" });
        }
        payload.attachment = req.file.buffer;
        payload.attachment_mime = req.file.mimetype;
        payload.attachment_size = req.file.size || null;
        if (!payload.attachment_filename) {
          payload.attachment_filename = req.file.originalname;
        }
      }

      stripAutoId(payload);
      const updated = await projectMenusModel.update(
        req.params.id,
        payload,
      );
      if (!updated) {
        return res.status(404).json({ error: "Menu not found" });
      }
      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const deleted = await projectMenusModel.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Menu not found" });
      }
      return res.json({ message: "Menu deleted" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  streamAttachment: async (req, res) => {
    try {
      const record = await projectMenusModel.getById(req.params.id);
      if (!record || !record.attachment) {
        return res.status(404).json({ error: "Attachment not found" });
      }
      const mime = record.attachment_mime || "application/octet-stream";
      if (!String(mime).toLowerCase().startsWith("image/")) {
        return res.status(415).json({ error: "Unsupported media type for inline preview" });
      }
      res.status(200);
      res.setHeader("Content-Type", mime);
      if (record.attachment?.length) {
        res.setHeader("Content-Length", record.attachment.length);
      }
      if (record.attachment_filename) {
        res.setHeader("Content-Disposition", `inline; filename="${record.attachment_filename}"`);
      }
      return res.end(record.attachment);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
};

module.exports = projectMenusController;


