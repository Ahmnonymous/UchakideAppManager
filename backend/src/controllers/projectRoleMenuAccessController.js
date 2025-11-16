const model = require("../models/projectRoleMenuAccessModel");
const { stripAutoId } = require("../utils/payloadUtils");

const getAuditName = (req) =>
  (req.user && (req.user.full_name || req.user.name)) || req.user?.username || "system";

const normalizeAccessJson = (payload = {}) => {
  const key = "access_json";
  if (payload[key] == null) {
    payload[key] = "[]";
    return payload;
  }
  if (typeof payload[key] === "string") {
    try {
      const parsed = JSON.parse(payload[key] || "[]");
      payload[key] = Array.isArray(parsed) ? JSON.stringify(parsed) : "[]";
    } catch {
      payload[key] = "[]";
    }
    return payload;
  }
  if (Array.isArray(payload[key]) || typeof payload[key] === "object") {
    try {
      payload[key] = JSON.stringify(payload[key] || []);
    } catch {
      payload[key] = "[]";
    }
  }
  return payload;
};

const projectRoleMenuAccessController = {
  getAll: async (req, res) => {
    try {
      const { projectId, roleId } = req.query;
      if (projectId && roleId) {
        const row = await model.getByProjectAndRole(projectId, roleId);
        return res.json(row ? [row] : []);
      }
      if (projectId) {
        const data = await model.getByProject(projectId);
        return res.json(data);
      }
      const all = await model.getAll();
      return res.json(all);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  getById: async (req, res) => {
    try {
      const record = await model.getById(req.params.id);
      if (!record) return res.status(404).json({ error: "Access mapping not found" });
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  create: async (req, res) => {
    try {
      const payload = {
        ...req.body,
        created_by: getAuditName(req),
        updated_by: getAuditName(req),
      };
      normalizeAccessJson(payload);
      stripAutoId(payload);
      // Upsert by (Project_ID, Role_ID)
      const existing = await model.getByProjectAndRole(payload.project_id, payload.role_id);
      if (existing) {
        const updated = await model.update(existing.id, payload);
        return res.json(updated);
      }
      const created = await model.create(payload);
      return res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  update: async (req, res) => {
    try {
      const payload = {
        ...req.body,
        updated_by: getAuditName(req),
      };
      delete payload.created_by;
      normalizeAccessJson(payload);
      stripAutoId(payload);
      const updated = await model.update(req.params.id, payload);
      if (!updated) return res.status(404).json({ error: "Access mapping not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  delete: async (req, res) => {
    try {
      const deleted = await model.delete(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Access mapping not found" });
      res.json({ message: "Mapping deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = projectRoleMenuAccessController;


