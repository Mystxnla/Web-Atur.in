import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';

export default function AdminGuard({ children }) {
  const { user, accessToken } = useAuthStore();
  if (!accessToken || !['admin', 'superadmin'].includes(user?.role)) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
