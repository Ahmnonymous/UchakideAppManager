/**
 * RBAC Matrix - Centralized Role-Based Access Control Definitions
 * Synced with Cursor RBAC ruleset.
 */

const METHODS = {
  READ_ONLY: ["GET", "HEAD", "OPTIONS"],
  FULL: ["GET", "POST", "PUT", "PATCH", "DELETE"],
};

const ROLES = {
  APP_ADMIN: 1,
  HQ: 2,
  ORG_ADMIN: 3,
  ORG_EXECUTIVE: 4,
  ORG_CASEWORKER: 5,
};

const ROLE_KEY_BY_ID = {
  [ROLES.APP_ADMIN]: "AppAdmin",
  [ROLES.HQ]: "HQ",
  [ROLES.ORG_ADMIN]: "OrgAdmin",
  [ROLES.ORG_EXECUTIVE]: "OrgExecutive",
  [ROLES.ORG_CASEWORKER]: "OrgCaseworker",
};

const MODULES = {
  DEFAULT: "default",
  AUTH: "auth",
  DASHBOARD: "dashboard",
  CENTERS: "centers",
  MEETINGS: "meetings",
  SUPPLIER: "supplier",
  INVENTORY: "inventory",
  APPLICANTS: "applicants",
  TASKS: "tasks",
  COMMENTS: "comments",
  RELATIONSHIPS: "relationships",
  HOME_VISITS: "homeVisits",
  FINANCIAL_ASSISTANCE: "financialAssistance",
  FOOD_ASSISTANCE: "foodAssistance",
  ATTACHMENTS: "attachments",
  PROGRAMS: "programs",
  FINANCIAL_ASSESSMENT: "financialAssessment",
  APPLICANT_INCOME: "applicantIncome",
  APPLICANT_EXPENSE: "applicantExpense",
  EMPLOYEE: "employee",
  TRAINING: "training",
  HSEQ: "hseq",
  POLICY: "policy",
  LOOKUP: "lookup",
  REPORTS: "reports",
  FILE_MANAGER: "fileManager",
  CHAT: "chat",
  PERSONAL_FILES: "personalFiles",
};

const MODULE_ROUTE_MAP = [
  { module: MODULES.AUTH, prefixes: ["/api/auth"] },
  { module: MODULES.DASHBOARD, prefixes: ["/api/dashboard"] },
  { module: MODULES.CENTERS, prefixes: ["/api/centerdetail", "/api/centeraudits"] },
  { module: MODULES.MEETINGS, prefixes: ["/api/meetings", "/api/hseqtoolboxmeeting", "/api/hseqtoolboxmeetingtasks"] },
  { module: MODULES.SUPPLIER, prefixes: ["/api/supplierdocument", "/api/supplierevaluation", "/api/supplierprofile", "/api/servicerating"] },
  { module: MODULES.INVENTORY, prefixes: ["/api/inventoryitems", "/api/inventorytransactions"] },
  {
    module: MODULES.APPLICANTS,
    prefixes: [
      "/api/applicantdetails",
      "/api/applicantincome",
      "/api/applicantexpense",
      "/api/financialassessment",
      "/api/attachments",
      "/api/programs",
      "/api/financialassistance",
      "/api/foodassistance",
      "/api/homevisit",
      "/api/relationships",
      "/api/comments",
    ],
  },
  { module: MODULES.TASKS, prefixes: ["/api/tasks"] },
  { module: MODULES.COMMENTS, prefixes: ["/api/comments"] },
  { module: MODULES.RELATIONSHIPS, prefixes: ["/api/relationships"] },
  { module: MODULES.HOME_VISITS, prefixes: ["/api/homevisit"] },
  { module: MODULES.FINANCIAL_ASSISTANCE, prefixes: ["/api/financialassistance"] },
  { module: MODULES.FOOD_ASSISTANCE, prefixes: ["/api/foodassistance"] },
  { module: MODULES.ATTACHMENTS, prefixes: ["/api/attachments"] },
  { module: MODULES.PROGRAMS, prefixes: ["/api/programs"] },
  { module: MODULES.FINANCIAL_ASSESSMENT, prefixes: ["/api/financialassessment"] },
  { module: MODULES.APPLICANT_INCOME, prefixes: ["/api/applicantincome"] },
  { module: MODULES.APPLICANT_EXPENSE, prefixes: ["/api/applicantexpense"] },
  {
    module: MODULES.EMPLOYEE,
    prefixes: ["/api/employee", "/api/employeeappraisal", "/api/employeeinitiative", "/api/employeeskills"],
  },
  { module: MODULES.TRAINING, prefixes: ["/api/traininginstitutions", "/api/trainingcourses"] },
  { module: MODULES.POLICY, prefixes: ["/api/policyandprocedure"] },
  { module: MODULES.LOOKUP, prefixes: ["/api/lookup"] },
  { module: MODULES.REPORTS, prefixes: ["/api/reports"] },
  { module: MODULES.FILE_MANAGER, prefixes: ["/api/folders", "/api/personalfiles"] },
  { module: MODULES.PERSONAL_FILES, prefixes: ["/api/personalfiles"] },
  { module: MODULES.CHAT, prefixes: ["/api/messages", "/api/conversations", "/api/conversationparticipants"] },
];

const ROLE_RULES = {
  AppAdmin: {
    id: ROLES.APP_ADMIN,
    label: "App Admin",
    centerScoped: false,
    reportScope: "all",
    moduleAccess: {
      allow: "*",
      deny: [],
    },
    methodAccess: {
      default: METHODS.FULL,
      overrides: {},
    },
  },
  HQ: {
    id: ROLES.HQ,
    label: "HQ",
    centerScoped: false,
    reportScope: "all",
    moduleAccess: {
      allow: "*",
      deny: [MODULES.SUPPLIER, MODULES.INVENTORY],
    },
    methodAccess: {
      default: METHODS.FULL,
      overrides: {
        [MODULES.CENTERS]: METHODS.READ_ONLY, // cannot create/update centers
      },
    },
  },
  OrgAdmin: {
    id: ROLES.ORG_ADMIN,
    label: "Org Admin",
    centerScoped: true,
    reportScope: "own",
    moduleAccess: {
      allow: "*",
      deny: [MODULES.SUPPLIER, MODULES.INVENTORY, MODULES.CENTERS],
    },
    methodAccess: {
      default: METHODS.FULL,
      overrides: {
        [MODULES.POLICY]: METHODS.READ_ONLY,
      },
    },
  },
  OrgExecutive: {
    id: ROLES.ORG_EXECUTIVE,
    label: "Org Executive",
    centerScoped: true,
    reportScope: "own",
    moduleAccess: {
      allow: "*",
      deny: [
        MODULES.SUPPLIER,
        MODULES.INVENTORY,
        MODULES.CENTERS,
        MODULES.FILE_MANAGER,
        MODULES.PERSONAL_FILES,
        MODULES.CHAT,
        MODULES.MEETINGS,
      ],
    },
    methodAccess: {
      default: METHODS.READ_ONLY,
      overrides: {
        [MODULES.AUTH]: METHODS.FULL,
      },
    },
  },
  OrgCaseworker: {
    id: ROLES.ORG_CASEWORKER,
    label: "Org Caseworker",
    centerScoped: true,
    reportScope: "own",
    moduleAccess: {
      allow: [
        MODULES.DASHBOARD,
        MODULES.APPLICANTS,
        MODULES.TASKS,
        MODULES.COMMENTS,
        MODULES.RELATIONSHIPS,
        MODULES.HOME_VISITS,
        MODULES.FINANCIAL_ASSISTANCE,
        MODULES.FOOD_ASSISTANCE,
        MODULES.ATTACHMENTS,
        MODULES.PROGRAMS,
        MODULES.FINANCIAL_ASSESSMENT,
        MODULES.APPLICANT_INCOME,
        MODULES.APPLICANT_EXPENSE,
        MODULES.FILE_MANAGER,
        MODULES.CHAT,
        MODULES.POLICY,
        MODULES.REPORTS,
        MODULES.PERSONAL_FILES,
      MODULES.TRAINING,
      MODULES.EMPLOYEE,
        MODULES.LOOKUP,
        MODULES.AUTH,
      ],
      deny: [MODULES.SUPPLIER, MODULES.INVENTORY, MODULES.CENTERS, MODULES.MEETINGS],
    },
    methodAccess: {
      default: METHODS.FULL,
      overrides: {
        [MODULES.POLICY]: METHODS.READ_ONLY,
        [MODULES.REPORTS]: METHODS.READ_ONLY,
        [MODULES.LOOKUP]: METHODS.READ_ONLY,
      [MODULES.TRAINING]: METHODS.READ_ONLY,
      [MODULES.EMPLOYEE]: METHODS.READ_ONLY,
      },
    },
  },
};

const normalizePath = (path = "") => path.toLowerCase();

const getModuleFromRoute = (routePath = "") => {
  const normalized = normalizePath(routePath);
  const entry =
    MODULE_ROUTE_MAP.find(({ prefixes }) =>
      prefixes.some((prefix) => normalized.startsWith(prefix))) || null;
  return entry ? entry.module : MODULES.DEFAULT;
};

const toRoleKey = (role) => {
  if (role === undefined || role === null) return null;
  if (typeof role === "string" && ROLE_RULES[role]) return role;
  const parsed = Number.parseInt(role, 10);
  return Number.isNaN(parsed) ? null : ROLE_KEY_BY_ID[parsed] || null;
};

const getRoleRule = (role) => {
  const roleKey = toRoleKey(role);
  return roleKey ? ROLE_RULES[roleKey] : null;
};

const isModuleAllowed = (role, moduleKey) => {
  const rule = getRoleRule(role);
  if (!rule) return false;

  const denySet = new Set(rule.moduleAccess?.deny || []);
  if (denySet.has(moduleKey)) return false;

  if (rule.moduleAccess?.allow === "*") return true;

  const allowList = new Set(rule.moduleAccess?.allow || []);
  return allowList.has(moduleKey);
};

const getAllowedMethods = (role, moduleKey) => {
  const rule = getRoleRule(role);
  if (!rule) return [];
  const overrides = rule.methodAccess?.overrides || {};
  return overrides[moduleKey] || rule.methodAccess?.default || [];
};

const normalizeMethod = (method = "GET") => method.toUpperCase();

const canAccessRoute = (role, routePath = "") => {
  const moduleKey = getModuleFromRoute(routePath);
  // Always allow lookups
  if (moduleKey === MODULES.LOOKUP) {
    return true;
  }
  return isModuleAllowed(role, moduleKey);
};

const canPerformMethod = (role, method, moduleKey = MODULES.DEFAULT) => {
  const allowed = getAllowedMethods(role, moduleKey);
  return allowed.includes(normalizeMethod(method));
};

const needsCenterRestriction = (role) => {
  const rule = getRoleRule(role);
  if (!rule) return true;
  return !!rule.centerScoped;
};

const getReportScope = (role) => {
  const rule = getRoleRule(role);
  return rule?.reportScope || "own";
};

const canMutatePolicy = (role) => {
  const roleKey = toRoleKey(role);
  return roleKey === "AppAdmin" || roleKey === "HQ";
};

module.exports = {
  METHODS,
  ROLES,
  ROLE_RULES,
  ROLE_KEY_BY_ID,
  MODULES,
  MODULE_ROUTE_MAP,
  getModuleFromRoute,
  getAllowedMethods,
  isModuleAllowed,
  canAccessRoute,
  canPerformMethod,
  needsCenterRestriction,
  getReportScope,
  canMutatePolicy,
};

