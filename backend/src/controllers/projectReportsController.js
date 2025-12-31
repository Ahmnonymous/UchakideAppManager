const projectReportsModel = require("../models/projectReportsModel");
const { stripAutoId } = require("../utils/payloadUtils");

const getAuditName = (req) =>
  (req.user && (req.user.full_name || req.user.name)) ||
  req.user?.username ||
  "system";

const projectReportsController = {
  getAll: async (req, res) => {
    try {
      const { projectId } = req.query;
      const data = projectId
        ? await projectReportsModel.getByProject(projectId)
        : await projectReportsModel.getAll();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Normalize fields_displayed so Postgres JSON/JSONB always receives a valid JSON string
  _normalizeFieldsDisplayed(payload = {}) {
    if (payload.fields_displayed === undefined || payload.fields_displayed === null) {
      payload.fields_displayed = "[]";
      return payload;
    }
    if (Array.isArray(payload.fields_displayed) || typeof payload.fields_displayed === "object") {
      try {
        payload.fields_displayed = JSON.stringify(payload.fields_displayed || []);
      } catch {
        payload.fields_displayed = "[]";
      }
      return payload;
    }
    if (typeof payload.fields_displayed === "string") {
      try {
        const parsed = JSON.parse(payload.fields_displayed || "[]");
        payload.fields_displayed = JSON.stringify(Array.isArray(parsed) ? parsed : []);
      } catch {
        payload.fields_displayed = "[]";
      }
    }
    return payload;
  },

  _validateStatus(status) {
    const validStatuses = ["In progress", "Done", "In Review"];
    if (status && !validStatuses.includes(status)) {
      return "In progress"; // Default to "In progress" if invalid
    }
    return status || "In progress";
  },

  getById: async (req, res) => {
    try {
      const record = await projectReportsModel.getById(req.params.id);
      if (!record) {
        return res.status(404).json({ error: "Report not found" });
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
        status: projectReportsController._validateStatus(req.body.status),
        created_by: auditName,
        updated_by: auditName,
      };
      projectReportsController._normalizeFieldsDisplayed(payload);
      stripAutoId(payload);
      const created = await projectReportsModel.create(payload);
      return res.status(201).json(created);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const payload = {
        ...req.body,
        status: projectReportsController._validateStatus(req.body.status),
        updated_by: getAuditName(req),
      };
      delete payload.created_by;
      projectReportsController._normalizeFieldsDisplayed(payload);
      stripAutoId(payload);
      const updated = await projectReportsModel.update(
        req.params.id,
        payload,
      );
      if (!updated) {
        return res.status(404).json({ error: "Report not found" });
      }
      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const deleted = await projectReportsModel.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Report not found" });
      }
      return res.json({ message: "Report deleted" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
};

module.exports = projectReportsController;

