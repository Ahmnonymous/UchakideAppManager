const pool = require("../config/db");
const {
  buildInsertFragments,
  buildUpdateFragments,
} = require("../utils/modelHelpers");

const tableName = "Project";

const projectModel = {
  getAll: async (pagination = {}) => {
    const { page = 1, limit = 50, offset = 0, sort = 'created_at', order = 'DESC', search = null } = pagination;
    const maxLimit = Math.min(limit, 200); // Cap at 200 items per page

    let baseQuery = `SELECT * FROM ${tableName}`;
    const values = [];
    let paramIndex = 1;
    const conditions = [];

    // Add search filter if provided
    if (search) {
      conditions.push(`(
        Project_Name ILIKE $${paramIndex} OR 
        Developer_Assigned ILIKE $${paramIndex} OR
        Project_Status ILIKE $${paramIndex}
      )`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }

    // Get total count for pagination
    const countQuery = baseQuery.replace(/SELECT[\s\S]*?FROM/i, 'SELECT COUNT(*) as total FROM');
    const countRes = await pool.query(countQuery, values);
    const total = parseInt(countRes.rows[0]?.total || 0);

    // Validate sort column to prevent SQL injection
    const sortColumnMap = {
      'id': 'ID',
      'project_name': 'Project_Name',
      'project_status': 'Project_Status',
      'start_date': 'Start_Date',
      'end_date': 'End_Date',
      'created_at': 'Created_At',
      'updated_at': 'Updated_At',
    };
    const safeSort = sortColumnMap[sort.toLowerCase()] || 'Created_At';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Add pagination and ordering
    const finalQuery = `
      ${baseQuery}
      ORDER BY "${safeSort}" ${safeOrder}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    const finalValues = [...values, maxLimit, offset];

    const res = await pool.query(finalQuery, finalValues);

    return {
      data: res.rows,
      pagination: {
        page,
        limit: maxLimit,
        total,
        totalPages: Math.ceil(total / maxLimit),
      },
    };
  },

  getById: async (id) => {
    const res = await pool.query(
      `SELECT * FROM ${tableName} WHERE id = $1 LIMIT 1`,
      [id],
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
    const existing = await projectModel.getById(id);
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
    const existing = await projectModel.getById(id);
    if (!existing) {
      return null;
    }
    const query = `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`;
    const res = await pool.query(query, [id]);
    return res.rows[0] || null;
  },
};

module.exports = projectModel;

