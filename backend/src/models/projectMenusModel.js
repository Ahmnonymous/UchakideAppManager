const pool = require("../config/db");
const { buildInsertFragments, buildUpdateFragments } = require("../utils/modelHelpers");

const tableName = "Project_Menus";

const projectMenusModel = {
  getAll: async () => {
    const res = await pool.query(`SELECT * FROM ${tableName} ORDER BY Created_At DESC`);
    return res.rows;
  },

  getById: async (id) => {
    const res = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1 LIMIT 1`, [id]);
    return res.rows[0] || null;
  },

  getByProject: async (projectId, pagination = {}) => {
    const { page = 1, limit = 50, offset = 0 } = pagination;
    const maxLimit = Math.min(limit, 200); // Cap at 200 items per page

    // ✅ CRITICAL: Exclude 'Attachment' (BYTEA) column from list queries
    // Only fetch metadata - attachment fetched separately if needed
    const baseQuery = `
      SELECT 
        ID, Project_ID, Menu_Type, Menu_Name, Menu_Parent, Icon,
        Description, Sort_Order,
        Attachment_Filename, Attachment_Mime, Attachment_Size,
        Created_By, Created_At, Updated_By, Updated_At
      FROM ${tableName}
      WHERE Project_ID = $1
    `;

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM ${tableName} WHERE Project_ID = $1`;
    const countRes = await pool.query(countQuery, [projectId]);
    const total = parseInt(countRes.rows[0]?.total || 0);

    // Add pagination
    const finalQuery = `
      ${baseQuery}
      ORDER BY Sort_Order NULLS LAST, Menu_Name ASC
      LIMIT $2 OFFSET $3
    `;

    const res = await pool.query(finalQuery, [projectId, maxLimit, offset]);

    // Return metadata only (no attachment BLOB)
    const data = res.rows.map((row) => ({
      ...row,
      attachment: row.attachment_filename ? "exists" : null, // Indicate attachment exists without loading it
    }));

    return {
      data,
      pagination: {
        page,
        limit: maxLimit,
        total,
        totalPages: Math.ceil(total / maxLimit),
      },
    };
  },

  create: async (fields) => {
    const { columns, values, placeholders } = buildInsertFragments(fields);
    const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  update: async (id, fields) => {
    const existing = await projectMenusModel.getById(id);
    if (!existing) return null;
    const { setClause, values } = buildUpdateFragments(fields);
    const query = `UPDATE ${tableName} SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`;
    const res = await pool.query(query, [...values, id]);
    return res.rows[0] || null;
  },

  delete: async (id) => {
    const existing = await projectMenusModel.getById(id);
    if (!existing) return null;
    const res = await pool.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [id]);
    return res.rows[0] || null;
  },
};

module.exports = projectMenusModel;


