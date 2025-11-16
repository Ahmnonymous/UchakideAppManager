// routes/ProtectedRoute.jsx
// Component to protect routes based on user roles
// Redirects unauthorized users to login or unauthorized page
//
// ✅ CORRECTED Role IDs:
// 1 = App Admin (SuperAdmin)
// 2 = HQ
// 3 = Org Admin
// 4 = Org Executives (VIEW ONLY)
// 5 = Org Caseworkers (Applicants/Tasks only)

import React from "react";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useRole } from "../helpers/useRole";

/**
 * Protected Route Component
 * Restricts access to routes based on user roles
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component to render if authorized
 * @param {number[]} props.allowedRoles - Array of role IDs that can access this route
 * @param {string} props.redirectTo - Path to redirect if unauthorized (default: /login)
 */
const ProtectedRoute = ({ children, allowedRoles, redirectTo = "/unauthorized" }) => {
  try {
    const { roleKey, userType, isAppAdmin } = useRole();
    const authToken = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    // Require authentication
    if (!authToken || !roleKey) {
      return <Navigate to="/login" replace />;
    }

    // If no specific roles provided, only authentication is required
    if (!allowedRoles || allowedRoles.length === 0) {
      return children;
    }

    const allowedRoleInts = allowedRoles.map((role) => parseInt(role, 10));

    // App Admin bypass other restrictions
    if (isAppAdmin) {
      return children;
    }

    if (userType && allowedRoleInts.includes(userType)) {
      return children;
    }

    return <Navigate to={redirectTo} replace />;
  } catch (error) {
    console.error("❌ ProtectedRoute error:", error);
    return <Navigate to="/login" replace />;
  }
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])),
  redirectTo: PropTypes.string,
};

ProtectedRoute.defaultProps = {
  allowedRoles: [],
  redirectTo: "/unauthorized",
};

export default ProtectedRoute;

/**
 * ✅ CORRECTED Example usage in routes:
 * 
 * // Centers - App Admin ONLY
 * <Route path="/centers" element={
 *   <ProtectedRoute allowedRoles={[1]}>
 *     <CenterManagement />
 *   </ProtectedRoute>
 * } />
 * 
 * // Employees - App Admin, HQ, Org Admin only
 * <Route path="/employees" element={
 *   <ProtectedRoute allowedRoles={[1, 2, 3]}>
 *     <Employees />
 *   </ProtectedRoute>
 * } />
 * 
 * // Inventory - All staff roles
 * <Route path="/inventory" element={
 *   <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5]}>
 *     <Inventory />
 *   </ProtectedRoute>
 * } />
 * 
 * // Reports - App Admin, HQ, Org Admin, Org Executives (no Caseworkers)
 * <Route path="/reports" element={
 *   <ProtectedRoute allowedRoles={[1, 2, 3, 4]}>
 *     <Reports />
 *   </ProtectedRoute>
 * } />
 * 
 * // Applicants - All staff roles
 * <Route path="/applicants" element={
 *   <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5]}>
 *     <Applicants />
 *   </ProtectedRoute>
 * } />
 */

