// models/authModel.js
const pool = require("../config/db");

const normalizeAppManagerUser = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    password_hash: user.password_hash,
    user_type: "AppManager",
    center_id: null,
    name: user.name,
    full_name: user.name,
    surname: "",
  };
};

const fetchAppManagerUser = async (username) => {
  const result = await pool.query(
    `SELECT
        id,
        username,
        name,
        password_hash
     FROM Users
     WHERE username = $1`,
    [username],
  );
  return result.rows[0] ? normalizeAppManagerUser(result.rows[0]) : null;
};

const Auth = {
  findByUsername: async (username) => {
    return fetchAppManagerUser(username);
  },
};

module.exports = Auth;
