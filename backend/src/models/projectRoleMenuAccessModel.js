const pool = require("../config/db");
const { buildInsertFragments, buildUpdateFragments } = require("../utils/modelHelpers");

const tableName = "Project_Role_Menu_Access";

const projectRoleMenuAccessModel = {
  getAll: async () => {
    const res = await pool.query(`SELECT * FROM ${tableName} ORDER BY Created_At DESC`);
    return res.rows;
  },

  getById: async (id) => {
    const res = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1 LIMIT 1`, [id]);
    return res.rows[0] || null;
  },

  getByProject: async (projectId) => {
    const res = await pool.query(
      `SELECT * FROM ${tableName} WHERE project_id = $1 ORDER BY Role_ID ASC, Menu_ID ASC`,
      [projectId],
    );
    return res.rows;
  },

  getByProjectAndRole: async (projectId, roleId) => {
    const res = await pool.query(
      `SELECT * FROM ${tableName} WHERE project_id = $1 AND role_id = $2 LIMIT 1`,
      [projectId, roleId],
    );
    return res.rows[0] || null;
  },

  create: async (fields) => {
    const { columns, values, placeholders } = buildInsertFragments(fields);
    const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  update: async (id, fields) => {
    const existing = await projectRoleMenuAccessModel.getById(id);
    if (!existing) return null;
    const { setClause, values } = buildUpdateFragments(fields);
    const query = `UPDATE ${tableName} SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`;
    const res = await pool.query(query, [...values, id]);
    return res.rows[0] || null;
  },

  delete: async (id) => {
    const existing = await projectRoleMenuAccessModel.getById(id);
    if (!existing) return null;
    const res = await pool.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [id]);
    return res.rows[0] || null;
  },
};

module.exports = projectRoleMenuAccessModel;


