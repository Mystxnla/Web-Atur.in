import { createBrowserRouter, ScrollRestoration, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MarketingLayout from './layouts/MarketingLayout.jsx';
import CheckoutLayout from './layouts/CheckoutLayout.jsx';
import PortalLayout from './layouts/PortalLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import AdminGuard from '../pages/admin/AdminGuard.jsx';
import PageSpinner from '../components/ui/PageSpinner.jsx';

const LandingPage     = lazy(() => import('../pages/landing/LandingPage.jsx'));
const CheckoutPage    = lazy(() => import('../pages/checkout/CheckoutPage.jsx'));
const PaymentPage     = lazy(() => import('../pages/payment/PaymentPage.jsx'));
const DonePage        = lazy(() => import('../pages/done/DonePage.jsx'));
const LookupPage      = lazy(() => import('../pages/lookup/LookupPage.jsx'));
const OtpPage         = lazy(() => import('../pages/otp/OtpPage.jsx'));
const OrderStatusPage = lazy(() => import('../pages/order-status/OrderStatusPage.jsx'));
const DemoSandboxPage = lazy(() => import('../pages/demo/DemoSandboxPage.jsx'));
const NotFoundPage    = lazy(() => import('../pages/not-found/NotFoundPage.jsx'));

// Admin
const AdminLoginPage   = lazy(() => import('../pages/admin/AdminLoginPage.jsx'));
const DashboardPage    = lazy(() => import('../pages/admin/DashboardPage.jsx'));
const OrdersPage       = lazy(() => import('../pages/admin/OrdersPage.jsx'));
const OrderDetailPage  = lazy(() => import('../pages/admin/OrderDetailPage.jsx'));
const UsersPage        = lazy(() => import('../pages/admin/UsersPage.jsx'));
const LeadsPage        = lazy(() => import('../pages/admin/LeadsPage.jsx'));

function Wrap({ children }) {
  return (
    <Suspense fallback={<PageSpinner />}>
      {children}
      <ScrollRestoration />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    element: <Wrap><MarketingLayout /></Wrap>,
    children: [
      { path: '/', element: <LandingPage /> },
    ],
  },
  {
    element: <Wrap><CheckoutLayout /></Wrap>,
    children: [
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/checkout/pembayaran/:orderId', element: <PaymentPage /> },
      { path: '/checkout/selesai/:orderId', element: <DonePage /> },
    ],
  },
  {
    element: <Wrap><PortalLayout /></Wrap>,
    children: [
      { path: '/lacak-pesanan', element: <LookupPage /> },
      { path: '/lacak-pesanan/verifikasi', element: <OtpPage /> },
      { path: '/lacak-pesanan/:orderId', element: <OrderStatusPage /> },
    ],
  },
  {
    path: '/demo',
    element: <Wrap><DemoSandboxPage /></Wrap>,
  },
  {
    path: '/workspace/:orderId',
    element: <Navigate to="/demo" replace />,
  },
  // ─── Admin ────────────────────────────────────────────────────
  {
    path: '/admin/login',
    element: <Wrap><AdminLoginPage /></Wrap>,
  },
  {
    element: (
      <Wrap>
        <AdminGuard>
          <AdminLayout />
        </AdminGuard>
      </Wrap>
    ),
    children: [
      { path: '/admin',                element: <Navigate to="/admin/dashboard" replace /> },
      { path: '/admin/dashboard',      element: <DashboardPage /> },
      { path: '/admin/orders',         element: <OrdersPage /> },
      { path: '/admin/orders/:id',     element: <OrderDetailPage /> },
      { path: '/admin/users',          element: <UsersPage /> },
      { path: '/admin/leads',          element: <LeadsPage /> },
    ],
  },
  {
    path: '*',
    element: <Wrap><NotFoundPage /></Wrap>,
  },
]);
