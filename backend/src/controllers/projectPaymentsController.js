const projectPaymentsModel = require("../models/projectPaymentsModel");
const { stripAutoId } = require("../utils/payloadUtils");
const { applyBase64Attachment } = require("../utils/attachmentHelpers");

const getAuditName = (req) =>
  (req.user && (req.user.full_name || req.user.name)) ||
  req.user?.username ||
  "system";

const projectPaymentsController = {
  getAll: async (req, res) => {
    try {
      const { projectId } = req.query;
      const data = projectId
        ? await projectPaymentsModel.getByProject(projectId)
        : await projectPaymentsModel.getAll();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const record = await projectPaymentsModel.getById(req.params.id);
      if (!record) {
        return res.status(404).json({ error: "Payment not found" });
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
        created_by: auditName,
        updated_by: auditName,
      };
      // Ensure NOT NULL with default: if payment_date is empty/null, let DB default apply
      if (payload.payment_date === null || payload.payment_date === undefined || payload.payment_date === "") {
        delete payload.payment_date;
      }
      const attachmentError = applyBase64Attachment(payload, {
        bufferField: "attachment",
      });
      if (attachmentError) {
        return res.status(400).json({ error: attachmentError });
      }
      // Support images only
      if (payload.attachment && !(String(payload.attachment_mime || "").toLowerCase().startsWith("image/"))) {
        return res.status(415).json({ error: "Only image attachments are supported" });
      }
      stripAutoId(payload);
      const created = await projectPaymentsModel.create(payload);
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
      };
      // Do not force payment_date to NULL; if empty, omit so it remains unchanged
      if (payload.payment_date === null || payload.payment_date === undefined || payload.payment_date === "") {
        delete payload.payment_date;
      }
      delete payload.created_by;
      const attachmentError = applyBase64Attachment(payload, {
        bufferField: "attachment",
      });
      if (attachmentError) {
        return res.status(400).json({ error: attachmentError });
      }
      if (payload.attachment && !(String(payload.attachment_mime || "").toLowerCase().startsWith("image/"))) {
        return res.status(415).json({ error: "Only image attachments are supported" });
      }
      stripAutoId(payload);
      const updated = await projectPaymentsModel.update(
        req.params.id,
        payload,
      );
      if (!updated) {
        return res.status(404).json({ error: "Payment not found" });
      }
      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const deleted = await projectPaymentsModel.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Payment not found" });
      }
      return res.json({ message: "Payment deleted" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  streamAttachment: async (req, res) => {
    try {
      const record = await projectPaymentsModel.getById(req.params.id);
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

module.exports = projectPaymentsController;

