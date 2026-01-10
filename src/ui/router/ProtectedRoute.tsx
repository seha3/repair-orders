import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../auth/auth.store";
import type { Role } from "../auth/auth.store";

export function ProtectedRoute({ allowed }: { allowed: Role[] }) {
  const role = useAuthStore((s) => s.role);

  if (!role) return <Navigate to="/login" replace />;
  if (!allowed.includes(role)) {
    // si se mete al lugar equivocado, mándalo a su home
    return <Navigate to={role === "TALLER" ? "/taller/ordenes" : "/cliente/ordenes"} replace />;
  }

  return <Outlet />;
}
