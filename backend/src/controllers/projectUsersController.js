const projectUsersModel = require("../models/projectUsersModel");
const { stripAutoId } = require("../utils/payloadUtils");

const getAuditName = (req) =>
  (req.user && (req.user.full_name || req.user.name)) ||
  req.user?.username ||
  "system";

const projectUsersController = {
  getAll: async (req, res) => {
    try {
      const data = await projectUsersModel.getAll();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const record = await projectUsersModel.getById(req.params.id);
      if (!record) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.json(record);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const auditName = getAuditName(req);
      const payload = { ...req.body };
      // map plain password to Password_Hash so DB trigger hashes it
      if (payload.password) {
        payload.password_hash = payload.password;
        delete payload.password;
      }
      payload.created_by = auditName;
      payload.updated_by = auditName;
      stripAutoId(payload);
      const created = await projectUsersModel.create(payload);
      return res.status(201).json(created);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const payload = { ...req.body };
      if (payload.password) {
        payload.password_hash = payload.password;
      }
      delete payload.password;
      payload.updated_by = getAuditName(req);
      delete payload.created_by;
      stripAutoId(payload);
      const updated = await projectUsersModel.update(req.params.id, payload);
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const deleted = await projectUsersModel.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.json({ message: "User deleted" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
};

module.exports = projectUsersController;

