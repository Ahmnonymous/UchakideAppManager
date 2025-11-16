import React from "react";
import { Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import ProjectsManagement from "../pages/Projects/ProjectManagement";
import UsersManagement from "../pages/Users/UsersManagement";
import ApplicantStatistics from "../pages/ApplicantStatistics";
import Login from "../pages/Authentication/Login";
import Logout from "../pages/Authentication/Logout";
import Register from "../pages/Authentication/Register";
import ForgetPwd from "../pages/Authentication/ForgetPassword";

const authProtectedRoutes = [
  {
    path: "/",
    exact: true,
    component: (
      <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5, 6]}>
        <ApplicantStatistics />
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects",
    component: (
      <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5, 6]}>
        <ProjectsManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/users",
    component: (
      <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5, 6]}>
        <UsersManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    component: <Navigate to="/" />,
  },
];

const publicRoutes = [
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/forgot-password", component: <ForgetPwd /> },
  { path: "/register", component: <Register /> },
];

export { authProtectedRoutes, publicRoutes };

