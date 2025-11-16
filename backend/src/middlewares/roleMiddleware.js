const {
  MODULES,
  ROLE_RULES,
  ROLE_KEY_BY_ID,
  getModuleFromRoute,
  canAccessRoute,
  canPerformMethod,
  needsCenterRestriction,
  getReportScope,
  canMutatePolicy,
} = require("../constants/rbacMatrix");

const parseRoleId = (user = {}) => {
  const potential = [
    user.user_type,
    user.role_id,
    user.roleId,
    user.role,
  ];

  for (const value of potential) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && ROLE_RULES[value]) {
      return ROLE_RULES[value].id;
    }
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
};

const toOptionObject = (config) => {
  if (Array.isArray(config)) {
    return { allowedRoles: config.map((r) => parseInt(r, 10)).filter((r) => !Number.isNaN(r)) };
  }
  if (config && typeof config === "object") {
    return {
      allowedRoles: Array.isArray(config.allowedRoles)
        ? config.allowedRoles.map((r) => parseInt(r, 10)).filter((r) => !Number.isNaN(r))
        : undefined,
      moduleOverride: config.module || config.moduleOverride,
    };
  }
  return {};
};

const methodIsReadOnly = (method = "GET") => ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());

const isRbacDisabled = () => {
  const flag = process.env.DISABLE_RBAC || process.env.BYPASS_RBAC;
  if (flag === undefined) {
    // Default to disabling RBAC until explicitly re-enabled
    return true;
  }
  return ["1", "true", "yes"].includes(String(flag).toLowerCase());
};

module.exports = (config) => {
  const options = toOptionObject(config);

  return (req, res, next) => {
    const rawPath =
      options.moduleOverride ||
      req.baseUrl ||
      req.originalUrl ||
      req.path ||
      "";
    const moduleKey = getModuleFromRoute(rawPath);

    if (isRbacDisabled()) {
      req.accessScope = {
        roleId: null,
        roleKey: "BYPASS_RBAC",
        reportScope: "all",
        enforceCenterFilter: false,
        moduleKey,
      };
      return next();
    }

    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const roleId = parseRoleId(req.user);
    if (!roleId || !ROLE_KEY_BY_ID[roleId]) {
        return res.status(403).json({ 
        message: "Forbidden: unknown or missing role",
        });
    }
    
    if (options.allowedRoles && options.allowedRoles.length > 0 && !options.allowedRoles.includes(roleId)) {
      return res.status(403).json({ 
        message: "Forbidden: role not permitted for this resource",
        allowedRoles: options.allowedRoles,
        roleId,
        roleKey: ROLE_KEY_BY_ID[roleId],
      });
    }

    req.accessScope = {
      roleId,
      roleKey: ROLE_KEY_BY_ID[roleId],
      reportScope: getReportScope(roleId),
      enforceCenterFilter: needsCenterRestriction(roleId),
      moduleKey,
    };

    if (!canAccessRoute(roleId, rawPath)) {
          return res.status(403).json({ 
        message: "Forbidden: module access denied by RBAC rules",
        roleId,
        roleKey: ROLE_KEY_BY_ID[roleId],
        module: moduleKey,
        path: rawPath,
      });
    }

    if (!canPerformMethod(roleId, req.method, moduleKey)) {
      return res.status(403).json({
        message: "Forbidden: HTTP method not allowed for this role",
        roleId,
        roleKey: ROLE_KEY_BY_ID[roleId],
        module: moduleKey,
        method: req.method,
      });
    }

    if (
      moduleKey === MODULES.POLICY &&
      !canMutatePolicy(roleId) &&
      !methodIsReadOnly(req.method)
    ) {
      return res.status(403).json({
        message: "Forbidden: only AppAdmin and HQ can modify Policy & Procedure records",
        roleId,
        roleKey: ROLE_KEY_BY_ID[roleId],
        method: req.method,
      });
    }

    // Prevent center management for non privileged roles (defensive double check)
    if (
      moduleKey === MODULES.CENTERS &&
      !methodIsReadOnly(req.method) &&
      !["AppAdmin", "HQ"].includes(ROLE_KEY_BY_ID[roleId])
    ) {
        return res.status(403).json({ 
        message: "Forbidden: center management restricted to AppAdmin and HQ",
        roleId,
        roleKey: ROLE_KEY_BY_ID[roleId],
        method: req.method,
      });
    }

    return next();
  };
};
