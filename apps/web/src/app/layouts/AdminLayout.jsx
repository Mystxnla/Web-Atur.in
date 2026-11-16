import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { authApi } from '../../services/api/auth.js';
import { toast } from 'sonner';
import {
  LayoutDashboard, ShoppingBag, Users, FileText,
  LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/cn.js';
import Logo from '../../components/ui/Logo.jsx';

const NAV = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/orders',    icon: ShoppingBag,     label: 'Pesanan' },
  { to: '/admin/users',     icon: Users,           label: 'Pengguna' },
  { to: '/admin/leads',     icon: FileText,        label: 'Leads' },
];

export default function AdminLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await authApi.logout().catch(() => {});
    clearAuth();
    toast.success('Berhasil logout.');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0 md:static md:flex'
      )}>
        {/* Brand */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path d="M4 13L9 5L14 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.5 10.5H11.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="text-xs text-gray-400 leading-tight">Atur.in</div>
              <div className="text-sm font-bold leading-tight">Admin Panel</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-gray-400 hover:text-white">
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon size={18} aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
          >
            <LogOut size={16} aria-hidden />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar mobile */}
        <header className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            aria-label="Buka sidebar"
          >
            <Menu size={20} aria-hidden />
          </button>
          <span className="font-bold text-gray-900">Atur.in Admin</span>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
