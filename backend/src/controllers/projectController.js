const projectModel = require("../models/projectModel");
const projectPaymentsModel = require("../models/projectPaymentsModel");
const projectBugsModel = require("../models/projectBugsModel");
const projectReportsModel = require("../models/projectReportsModel");
const projectRolesModel = require("../models/projectRolesModel");
const projectTablesModel = require("../models/projectTablesModel");
const { stripAutoId } = require("../utils/payloadUtils");

const getAuditName = (req) =>
  (req.user && (req.user.full_name || req.user.name)) ||
  req.user?.username ||
  "system";

const projectController = {
  getAll: async (req, res) => {
    try {
      const data = await projectModel.getAll();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const project = await projectModel.getById(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      return res.json(project);
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
      const created = await projectModel.create(payload);
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
      const updated = await projectModel.update(req.params.id, payload);
      if (!updated) {
        return res.status(404).json({ error: "Project not found" });
      }
      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const deleted = await projectModel.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Project not found" });
      }
      return res.json({ message: "Project deleted" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  summary: async (req, res) => {
    try {
      const project = await projectModel.getById(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const [
        payments,
        bugs,
        reports,
        tables,
        menus,
        roleMenuAccess,
        roles,
      ] = await Promise.all([
        projectPaymentsModel.getByProject(req.params.id),
        projectBugsModel.getByProject(req.params.id),
        projectReportsModel.getByProject(req.params.id),
        projectTablesModel.getByProject(req.params.id),
        // Menus
        require("../models/projectMenusModel").getByProject(req.params.id).catch(() => []),
        // Role-Menu Access
        require("../models/projectRoleMenuAccessModel").getByProject(req.params.id).catch(() => []),
        // Roles
        projectRolesModel.getByProject(req.params.id).catch(() => []),
      ]);

      const totalPayments = payments.reduce(
        (total, payment) =>
          total + Number.parseFloat(payment.payment_amount || 0),
        0,
      );
      const openBugs = bugs.filter(
        (bug) => (bug.status || "").toLowerCase() !== "closed",
      ).length;

      return res.json({
        project,
        metrics: {
          payment_count: payments.length,
          total_payments: totalPayments,
          open_bugs: openBugs,
          report_count: reports.length,
          attachment_count: 0,
          table_count: tables.length,
          menu_count: menus.length,
          access_map_count: roleMenuAccess.length,
          role_count: roles.length,
        },
        payments,
        bugs,
        reports,
        tables,
        menus,
        roleMenuAccess,
        roles,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
};

module.exports = projectController;

