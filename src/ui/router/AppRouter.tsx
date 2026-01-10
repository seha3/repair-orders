import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../auth/LoginPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { WorkshopOrdersPage } from "../workshop/WorkshopOrdersPage";
import { ClientOrdersPage } from "../client/ClientOrdersPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute allowed={["TALLER"]} />}>
        <Route path="/taller/ordenes" element={<WorkshopOrdersPage />} />
      </Route>

      <Route element={<ProtectedRoute allowed={["CLIENTE"]} />}>
        <Route path="/cliente/ordenes" element={<ClientOrdersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
