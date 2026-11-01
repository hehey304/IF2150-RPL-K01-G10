import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { HOME_BY_ROLE, type Role } from '../types';

export default function ProtectedRoute({ roles }: { roles: Role[] }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!roles.includes(user.role)) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
  return <Outlet />;
}