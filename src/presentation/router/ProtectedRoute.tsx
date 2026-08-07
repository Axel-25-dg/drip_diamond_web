import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/presentation/store/authStore";
import type { UserRole } from "@/domain/entities/User";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && user?.rol) {
    const userRol = user.rol.toLowerCase();
    const hasRole = allowedRoles.some((r) => r.toLowerCase() === userRol);
    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}
