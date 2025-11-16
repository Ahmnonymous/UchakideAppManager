const projectRolesModel = require("../models/projectRolesModel");
const { stripAutoId } = require("../utils/payloadUtils");

const getAuditName = (req) =>
  (req.user && (req.user.full_name || req.user.name)) ||
  req.user?.username ||
  "system";

const projectRolesController = {
  getAll: async (req, res) => {
    try {
      const { projectId } = req.query;
      const data = projectId
        ? await projectRolesModel.getByProject(projectId)
        : await projectRolesModel.getAll();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const record = await projectRolesModel.getById(req.params.id);
      if (!record) {
        return res.status(404).json({ error: "Role not found" });
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
      stripAutoId(payload);
      const created = await projectRolesModel.create(payload);
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
      delete payload.created_by;
      stripAutoId(payload);
      const updated = await projectRolesModel.update(req.params.id, payload);
      if (!updated) {
        return res.status(404).json({ error: "Role not found" });
      }
      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const deleted = await projectRolesModel.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Role not found" });
      }
      return res.json({ message: "Role deleted" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
};

module.exports = projectRolesController;

