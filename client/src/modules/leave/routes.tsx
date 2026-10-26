import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router-dom";

const MyLeavePage = lazy(() => import("./pages/MyLeavePage"));
const BalancesPage = lazy(() => import("./pages/BalancesPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const AllRequestsPage = lazy(() => import("./pages/AllRequestsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

export const routes: RouteObject[] = [
  { index: true, element: <Navigate to="mine" replace /> },
  { path: "mine", element: <MyLeavePage /> },
  { path: "balances", element: <BalancesPage /> },
  { path: "tasks", element: <TasksPage /> },
  { path: "requests", element: <AllRequestsPage /> },
  { path: "admin", element: <AdminPage /> },
];
