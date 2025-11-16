import { useMemo } from "react";
import {
  canAccessNav as canAccessNavUtil,
  canEdit as canEditModule,
  canManageCenters as canManageCentersUtil,
  canManagePolicy as canManagePolicyUtil,
  canSeeReports,
  canView as canViewModule,
  getReportScope as getReportScopeUtil,
  getRoleContext,
  getRoleName,
  isReadOnlyRole,
} from "./rbacUtils";

const ROLE_LABELS = {
  AppAdmin: "App Admin",
  HQ: "HQ",
  OrgAdmin: "Org Admin",
  OrgExecutive: "Org Executive",
  OrgCaseworker: "Caseworker",
  AppManager: "App Manager",
};

export const useRole = () => {
  const context = useMemo(() => getRoleContext(), []);
  const { roleKey, roleId, centerId, username, user } = context;

  const helpers = useMemo(() => {
    const numericRole = roleId ?? null;
    const hasRole = (roles) => {
      if (!numericRole) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(numericRole);
    };

    return {
      userType: numericRole,
      centerId,
      username,
      user,
      roleKey,
      roleName: ROLE_LABELS[roleKey] || getRoleName(roleKey),
      isAppAdmin: roleKey === "AppAdmin",
      isHQ: roleKey === "HQ",
      isOrgAdmin: roleKey === "OrgAdmin",
      isOrgExecutive: roleKey === "OrgExecutive",
      isCaseworker: roleKey === "OrgCaseworker",
      isGlobalAdmin: ["AppAdmin", "HQ"].includes(roleKey),
      hasRole,
      isAdmin: () => ["AppAdmin", "HQ", "OrgAdmin"].includes(roleKey),
      canManageEmployees: () => ["AppAdmin", "HQ", "OrgAdmin"].includes(roleKey),
      canManageCenters: () => canManageCentersUtil(roleKey),
      canViewAllCenters: () => ["AppAdmin", "HQ"].includes(roleKey),
      canWrite: () => !isReadOnlyRole(roleKey),
      canAccessModule: (module) => canViewModule(module, roleKey),
      canEditModule: (module) => canEditModule(module, roleKey),
      canAccessNav: (navItem) => canAccessNavUtil(navItem, roleKey),
      canManagePolicy: () => canManagePolicyUtil(roleKey),
      canViewReports: () => canSeeReports(roleKey),
      getRoleName: () => ROLE_LABELS[roleKey] || getRoleName(roleKey),
      getReportScope: () => getReportScopeUtil(roleKey),
      isReadOnly: isReadOnlyRole(roleKey),
    };
  }, [roleId, centerId, username, user, roleKey]);

  return helpers;
};

export const getCurrentUserRole = () => {
  const roleContext = getRoleContext();
  return roleContext.roleId ?? null;
};

export const hasRole = (roles) => {
  const currentRole = getCurrentUserRole();
  if (!currentRole) return false;
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(currentRole);
};

export const getCurrentCenterId = () => {
  const roleContext = getRoleContext();
  return roleContext.centerId || null;
};

