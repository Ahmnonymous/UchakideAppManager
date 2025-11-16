const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ✅ Middlewares
app.use(cors());
// Increase body size limits to support base64 attachments
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Route imports

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const projectPaymentsRoutes = require("./routes/projectPaymentsRoutes");
const projectBugsRoutes = require("./routes/projectBugsRoutes");
const projectReportsRoutes = require("./routes/projectReportsRoutes");
const projectTablesRoutes = require("./routes/projectTablesRoutes");
const projectRolesRoutes = require("./routes/projectRolesRoutes");
const projectUsersRoutes = require("./routes/projectUsersRoutes");
const projectRoleMenuAccessRoutes = require("./routes/projectRoleMenuAccessRoutes");
const projectMenusRoutes = require("./routes/projectMenusRoutes");

// Route registration

app.use("/api/auth", authRoutes);
app.use("/api/appManager/projects", projectRoutes);
app.use("/api/appManager/payments", projectPaymentsRoutes);
app.use("/api/appManager/bugs", projectBugsRoutes);
app.use("/api/appManager/reports", projectReportsRoutes);
app.use("/api/appManager/tables", projectTablesRoutes);
app.use("/api/appManager/roles", projectRolesRoutes);
app.use("/api/appManager/users", projectUsersRoutes);
app.use("/api/appManager/role-menu-access", projectRoleMenuAccessRoutes);
app.use("/api/appManager/menus", projectMenusRoutes);

// ✅ Export app for testing
module.exports = app;

// ✅ Server Start (only if not in test environment)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}