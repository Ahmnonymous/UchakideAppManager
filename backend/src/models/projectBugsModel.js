const pool = require("../config/db");
const {
  buildInsertFragments,
  buildUpdateFragments,
} = require("../utils/modelHelpers");

const tableName = "Project_Bugs";

const projectBugsModel = {
  getAll: async () => {
    const res = await pool.query(
      `SELECT b.*, pm.Menu_Name AS Menu_Name
       FROM ${tableName} b
       LEFT JOIN Project_Menus pm ON pm.ID = b.Menu_ID
       ORDER BY b.Created_At DESC`,
    );
    return res.rows;
  },

  getById: async (id) => {
    const res = await pool.query(
      `SELECT b.*, pm.Menu_Name AS Menu_Name
       FROM ${tableName} b
       LEFT JOIN Project_Menus pm ON pm.ID = b.Menu_ID
       WHERE b.ID = $1
       LIMIT 1`,
      [id],
    );
    return res.rows[0] || null;
  },

  getByProject: async (projectId) => {
    const res = await pool.query(
      `SELECT b.*, pm.Menu_Name AS Menu_Name
       FROM ${tableName} b
       LEFT JOIN Project_Menus pm ON pm.ID = b.Menu_ID
       WHERE b.Project_ID = $1
       ORDER BY b.Created_At DESC`,
      [projectId],
    );
    return res.rows;
  },

  create: async (fields) => {
    const { columns, values, placeholders } = buildInsertFragments(fields);
    const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  update: async (id, fields) => {
    const existing = await projectBugsModel.getById(id);
    if (!existing) {
      return null;
    }
    const { setClause, values } = buildUpdateFragments(fields);
    const query = `UPDATE ${tableName} SET ${setClause} WHERE id = $${
      values.length + 1
    } RETURNING *`;
    const res = await pool.query(query, [...values, id]);
    return res.rows[0] || null;
  },

  delete: async (id) => {
    const existing = await projectBugsModel.getById(id);
    if (!existing) {
      return null;
    }
    const query = `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`;
    const res = await pool.query(query, [id]);
    return res.rows[0] || null;
  },
};

module.exports = projectBugsModel;

