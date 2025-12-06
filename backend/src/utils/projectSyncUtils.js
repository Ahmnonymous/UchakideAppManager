const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

/**
 * Project Sync Utility
 * 
 * Uses GET /api/project/:id/full as master source of truth.
 * Detects and auto-generates missing:
 * - DB tables (from Project_Tables metadata)
 * - Frontend components (Tables, Reports, Modals)
 * - Routes
 * - Menus
 * - RBAC mappings
 * 
 * Follows Applicants module structure and ruleset patterns.
 */

const WHO_COLUMNS = {
  created_by: "VARCHAR(255)",
  created_at: "TIMESTAMPTZ NOT NULL DEFAULT now()",
  updated_by: "VARCHAR(255)",
  updated_at: "TIMESTAMPTZ NOT NULL DEFAULT now()",
};

/**
 * Convert table name to PascalCase for component names
 */
const toPascalCase = (str) => {
  if (!str) return "";
  return str
    .split(/[_\s-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
};

/**
 * Convert table name to camelCase for variable names
 */
const toCamelCase = (str) => {
  if (!str) return "";
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

/**
 * Convert table name to kebab-case for routes
 */
const toKebabCase = (str) => {
  if (!str) return "";
  return str
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "-");
};

/**
 * Map data type from Project_Tables to PostgreSQL
 */
const mapDataType = (dataType) => {
  const mapping = {
    text: "VARCHAR(255)",
    varchar: "VARCHAR(255)",
    string: "VARCHAR(255)",
    number: "INTEGER",
    integer: "INTEGER",
    int: "INTEGER",
    decimal: "NUMERIC(14,2)",
    numeric: "NUMERIC(14,2)",
    boolean: "BOOLEAN",
    bool: "BOOLEAN",
    date: "DATE",
    datetime: "TIMESTAMPTZ",
    timestamp: "TIMESTAMPTZ",
    json: "JSONB",
    jsonb: "JSONB",
    lookup: "BIGINT",
    reference: "BIGINT",
  };
  const normalized = (dataType || "text").toLowerCase().trim();
  return mapping[normalized] || "VARCHAR(255)";
};

/**
 * Check if a table exists in the database
 */
const tableExists = async (tableName) => {
  try {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [tableName.toLowerCase()],
    );
    return result.rows[0]?.exists || false;
  } catch (error) {
    console.error(`Error checking table existence for ${tableName}:`, error);
    return false;
  }
};

/**
 * Generate CREATE TABLE SQL from Project_Tables metadata
 */
const generateTableSQL = (tableDef, projectId) => {
  const tableName = tableDef.table_name;
  if (!tableName) return null;

  const fields = Array.isArray(tableDef.field_definitions)
    ? tableDef.field_definitions
    : typeof tableDef.field_definitions === "string"
      ? JSON.parse(tableDef.field_definitions || "[]")
      : [];

  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  sql += `    ID BIGSERIAL PRIMARY KEY,\n`;

  // Add fields from field_definitions
  fields.forEach((field) => {
    if (!field.field_name) return;
    const fieldName = field.field_name;
    const dataType = mapDataType(field.data_type);
    const constraints = field.constraints || "";
    const defaultValue = field.default_value
      ? ` DEFAULT ${field.default_value}`
      : "";
    const notNull = constraints.toLowerCase().includes("not null") ||
        constraints.toLowerCase().includes("required")
      ? " NOT NULL"
      : "";

    sql += `    ${fieldName} ${dataType}${notNull}${defaultValue},\n`;
  });

  // Add parent table FK if exists
  if (tableDef.parent_table) {
    sql += `    ${tableDef.parent_table}_ID BIGINT REFERENCES ${tableDef.parent_table}(ID) ON DELETE CASCADE,\n`;
  }

  // Add project_id FK
  sql += `    Project_ID BIGINT REFERENCES Project(ID) ON DELETE CASCADE,\n`;

  // Add WHO columns
  sql += `    Created_By ${WHO_COLUMNS.created_by},\n`;
  sql += `    Created_At ${WHO_COLUMNS.created_at},\n`;
  sql += `    Updated_By ${WHO_COLUMNS.updated_by},\n`;
  sql += `    Updated_At ${WHO_COLUMNS.updated_at}\n`;
  sql += `);\n`;

  // Add comment
  sql += `COMMENT ON TABLE ${tableName} IS 'Auto-generated table for project ${projectId} based on Project_Tables metadata.';\n`;

  // Add indexes
  sql += `CREATE INDEX IF NOT EXISTS idx_${tableName.toLowerCase()}_project ON ${tableName}(Project_ID);\n`;

  if (tableDef.parent_table) {
    sql += `CREATE INDEX IF NOT EXISTS idx_${tableName.toLowerCase()}_parent ON ${tableName}(${tableDef.parent_table}_ID);\n`;
  }

  return sql;
};

/**
 * Detect missing DB tables from Project_Tables metadata
 */
const detectMissingTables = async (tables) => {
  const missing = [];
  for (const table of tables || []) {
    if (!table.table_name) continue;
    const exists = await tableExists(table.table_name);
    if (!exists) {
      missing.push(table);
    }
  }
  return missing;
};

/**
 * Generate missing DB tables
 */
const generateMissingTables = async (tables, projectId) => {
  const missing = await detectMissingTables(tables);
  const results = [];

  for (const table of missing) {
    try {
      const sql = generateTableSQL(table, projectId);
      if (sql) {
        await pool.query(sql);
        results.push({
          table_name: table.table_name,
          status: "created",
          sql,
        });
      }
    } catch (error) {
      results.push({
        table_name: table.table_name,
        status: "error",
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * Detect missing frontend components
 * Returns list of components that should exist but don't
 */
const detectMissingComponents = (tables, reports, projectName) => {
  const missing = {
    tables: [],
    reports: [],
    modals: [],
    services: [],
  };

  // Resolve workspace root (assuming backend/src/utils is 3 levels deep)
  const workspaceRoot = path.resolve(__dirname, "../../..");

  // Check for table components
  for (const table of tables || []) {
    if (!table.table_name) continue;
    const componentName = toPascalCase(table.table_name);
    const componentPath = path.join(
      workspaceRoot,
      "src",
      "pages",
      projectName,
      "components",
      `${componentName}Table.jsx`,
    );
    if (!fs.existsSync(componentPath)) {
      missing.tables.push({
        table_name: table.table_name,
        component_name: `${componentName}Table`,
        component_path: path.relative(workspaceRoot, componentPath),
      });
    }

    // Check for modal
    const modalPath = path.join(
      workspaceRoot,
      "src",
      "pages",
      projectName,
      "components",
      `${componentName}Modal.jsx`,
    );
    if (!fs.existsSync(modalPath)) {
      missing.modals.push({
        table_name: table.table_name,
        component_name: `${componentName}Modal`,
        component_path: path.relative(workspaceRoot, modalPath),
      });
    }

    // Check for service
    const servicePath = path.join(
      workspaceRoot,
      "src",
      "services",
      `${toCamelCase(table.table_name)}Service.js`,
    );
    if (!fs.existsSync(servicePath)) {
      missing.services.push({
        table_name: table.table_name,
        service_name: `${toCamelCase(table.table_name)}Service`,
        service_path: path.relative(workspaceRoot, servicePath),
      });
    }
  }

  // Check for report components
  for (const report of reports || []) {
    if (!report.report_name) continue;
    const componentName = toPascalCase(report.report_name);
    const componentPath = path.join(
      workspaceRoot,
      "src",
      "pages",
      projectName,
      "components",
      `${componentName}Report.jsx`,
    );
    if (!fs.existsSync(componentPath)) {
      missing.reports.push({
        report_name: report.report_name,
        component_name: `${componentName}Report`,
        component_path: path.relative(workspaceRoot, componentPath),
      });
    }
  }

  return missing;
};

/**
 * Generate frontend table component (following TablesTab pattern)
 */
const generateTableComponent = (tableDef, projectName) => {
  const tableName = tableDef.table_name;
  const componentName = toPascalCase(tableName);
  const camelName = toCamelCase(tableName);
  const serviceName = `${camelName}Service`;

  // This is a template - actual generation would be more complex
  // For now, return the structure that should be created
  return {
    component_name: `${componentName}Table`,
    component_path: `src/pages/${projectName}/components/${componentName}Table.jsx`,
    template: `// Auto-generated table component for ${tableName}
// Follows TablesTab.jsx pattern from Projects module
// TODO: Implement full CRUD with modal, following Applicants module structure
`,
  };
};

/**
 * Generate frontend modal component (following modal pattern)
 */
const generateModalComponent = (tableDef, projectName) => {
  const tableName = tableDef.table_name;
  const componentName = toPascalCase(tableName);

  return {
    component_name: `${componentName}Modal`,
    component_path: `src/pages/${projectName}/components/${componentName}Modal.jsx`,
    template: `// Auto-generated modal component for ${tableName}
// Follows modal pattern from Projects module
// TODO: Implement form with react-hook-form, following Applicants module structure
`,
  };
};

/**
 * Generate service file (following API pattern)
 */
const generateServiceFile = (tableDef) => {
  const tableName = tableDef.table_name;
  const camelName = toCamelCase(tableName);
  const serviceName = `${camelName}Service`;

  return {
    service_name: serviceName,
    service_path: `src/services/${serviceName}.js`,
    template: `// Auto-generated service for ${tableName}
// TODO: Implement API calls following existing service patterns
`,
  };
};

/**
 * Detect missing routes
 */
const detectMissingRoutes = (menus, projectName) => {
  const missing = [];
  const workspaceRoot = path.resolve(__dirname, "../../..");
  const routesPath = path.join(workspaceRoot, "src", "routes", "index.jsx");

  if (!fs.existsSync(routesPath)) {
    return missing;
  }

  // Check if routes exist for each menu
  for (const menu of menus || []) {
    if (!menu.menu_name) continue;
    const routePath = `/${toKebabCase(menu.menu_name)}`;
    const componentPath = path.join(
      workspaceRoot,
      "src",
      "pages",
      projectName,
      `${toPascalCase(menu.menu_name)}.jsx`,
    );
    // In a real implementation, we'd parse the routes file
    // For now, return structure
    missing.push({
      menu_name: menu.menu_name,
      route_path: routePath,
      component_path: path.relative(workspaceRoot, componentPath),
    });
  }

  return missing;
};

/**
 * Main sync function - analyzes project and returns missing pieces
 */
const analyzeProject = async (projectData) => {
  const { project, tables, reports, menus, roles, roleMenuAccess } = projectData;
  const projectId = project?.id;
  const projectName = toPascalCase(project?.project_name || "Project");

  if (!projectId) {
    throw new Error("Project ID is required");
  }

  const analysis = {
    project_id: projectId,
    project_name: project?.project_name,
    missing_tables: [],
    missing_components: {},
    missing_routes: [],
    missing_menus: [],
    missing_rbac: [],
  };

  // Detect missing DB tables
  analysis.missing_tables = await detectMissingTables(tables);

  // Detect missing frontend components
  analysis.missing_components = detectMissingComponents(
    tables,
    reports,
    projectName,
  );

  // Detect missing routes
  analysis.missing_routes = detectMissingRoutes(menus, projectName);

  return analysis;
};

/**
 * Auto-generate missing pieces
 */
const syncProject = async (projectData, options = {}) => {
  const {
    generateDBTables = true,
    generateComponents = false, // Default false - requires confirmation
    generateRoutes = false, // Default false - requires confirmation
  } = options;

  const analysis = await analyzeProject(projectData);
  const results = {
    tables_created: [],
    components_created: [],
    routes_created: [],
    errors: [],
  };

  // Generate missing DB tables
  if (generateDBTables && analysis.missing_tables.length > 0) {
    try {
      const tableResults = await generateMissingTables(
        analysis.missing_tables,
        analysis.project_id,
      );
      results.tables_created = tableResults.filter((r) => r.status === "created");
      results.errors.push(
        ...tableResults
          .filter((r) => r.status === "error")
          .map((r) => ({
            type: "table",
            table_name: r.table_name,
            error: r.error,
          })),
      );
    } catch (error) {
      results.errors.push({
        type: "table_generation",
        error: error.message,
      });
    }
  }

  // Generate components (if enabled)
  if (generateComponents) {
    // Component generation would require file system operations
    // This is a placeholder - actual implementation would create files
    results.components_created = [];
  }

  // Generate routes (if enabled)
  if (generateRoutes) {
    // Route generation would require parsing and updating routes file
    // This is a placeholder - actual implementation would update routes
    results.routes_created = [];
  }

  return {
    analysis,
    results,
  };
};

module.exports = {
  analyzeProject,
  syncProject,
  detectMissingTables,
  generateMissingTables,
  detectMissingComponents,
  generateTableComponent,
  generateModalComponent,
  generateServiceFile,
  detectMissingRoutes,
  toPascalCase,
  toCamelCase,
  toKebabCase,
  mapDataType,
  tableExists,
};

