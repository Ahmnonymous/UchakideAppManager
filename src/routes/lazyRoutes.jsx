/**
 * ============================================================
 * 🚀 LAZY LOADED ROUTES
 * ============================================================
 * Code splitting for better performance
 * Reduces initial bundle size by ~40-60%
 */

import { lazy } from "react";

// Lazy load pages
const ProjectsManagement = lazy(() => import("../pages/Projects/ProjectManagement"));
const UsersManagement = lazy(() => import("../pages/Users/UsersManagement"));
const ApplicantStatistics = lazy(() => import("../pages/ApplicantStatistics"));
const Login = lazy(() => import("../pages/Authentication/Login"));
const Logout = lazy(() => import("../pages/Authentication/Logout"));
const Register = lazy(() => import("../pages/Authentication/Register"));
const ForgetPwd = lazy(() => import("../pages/Authentication/ForgetPassword"));

export {
  ProjectsManagement,
  UsersManagement,
  ApplicantStatistics,
  Login,
  Logout,
  Register,
  ForgetPwd,
};

