const projectTablesModel = require("../models/projectTablesModel");
const { stripAutoId } = require("../utils/payloadUtils");

const getAuditName = (req) =>
  (req.user && (req.user.full_name || req.user.name)) ||
  req.user?.username ||
  "system";

const parseFieldDefinitions = (payload = {}) => {
  if (payload.field_definitions === undefined || payload.field_definitions === null) {
    // Default to empty array JSON
    payload.field_definitions = "[]";
    return payload;
  }
  // If client sent array/object, stringify safely
  if (Array.isArray(payload.field_definitions) || typeof payload.field_definitions === "object") {
    try {
      payload.field_definitions = JSON.stringify(payload.field_definitions || []);
    } catch {
      payload.field_definitions = "[]";
    }
    return payload;
  }
  // If client sent string, validate it
  if (typeof payload.field_definitions === "string") {
    try {
      const parsed = JSON.parse(payload.field_definitions || "[]");
      payload.field_definitions = JSON.stringify(Array.isArray(parsed) ? parsed : []);
    } catch {
      payload.field_definitions = "[]";
    }
  }
  return payload;
};

const validateStatus = (status) => {
  const validStatuses = ["In progress", "Done", "In Review"];
  if (status && !validStatuses.includes(status)) {
    return "In progress"; // Default to "In progress" if invalid
  }
  return status || "In progress";
};

const projectTablesController = {
  getAll: async (req, res) => {
    try {
      const { projectId } = req.query;
      const data = projectId
        ? await projectTablesModel.getByProject(projectId)
        : await projectTablesModel.getAll();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const record = await projectTablesModel.getById(req.params.id);
      if (!record) {
        return res.status(404).json({ error: "Table metadata not found" });
      }
      return res.json(record);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const auditName = getAuditName(req);
      const payload = parseFieldDefinitions({
        ...req.body,
        status: validateStatus(req.body.status),
        created_by: auditName,
        updated_by: auditName,
      });
      stripAutoId(payload);
      const created = await projectTablesModel.create(payload);
      return res.status(201).json(created);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const payload = parseFieldDefinitions({
        ...req.body,
        status: validateStatus(req.body.status),
        updated_by: getAuditName(req),
      });
      delete payload.created_by;
      stripAutoId(payload);
      const updated = await projectTablesModel.update(req.params.id, payload);
      if (!updated) {
        return res.status(404).json({ error: "Table metadata not found" });
      }
      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const deleted = await projectTablesModel.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Table metadata not found" });
      }
      return res.json({ message: "Table metadata deleted" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
};

module.exports = projectTablesController;

