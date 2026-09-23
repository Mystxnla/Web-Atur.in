import { createBrowserRouter, ScrollRestoration } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MarketingLayout from './layouts/MarketingLayout.jsx';
import CheckoutLayout from './layouts/CheckoutLayout.jsx';
import PortalLayout from './layouts/PortalLayout.jsx';
import PageSpinner from '../components/ui/PageSpinner.jsx';

const LandingPage = lazy(() => import('../pages/landing/LandingPage.jsx'));
const CheckoutPage = lazy(() => import('../pages/checkout/CheckoutPage.jsx'));
const PaymentPage = lazy(() => import('../pages/payment/PaymentPage.jsx'));
const DonePage = lazy(() => import('../pages/done/DonePage.jsx'));
const LookupPage = lazy(() => import('../pages/lookup/LookupPage.jsx'));
const OtpPage = lazy(() => import('../pages/otp/OtpPage.jsx'));
const OrderStatusPage = lazy(() => import('../pages/order-status/OrderStatusPage.jsx'));
const NotFoundPage = lazy(() => import('../pages/not-found/NotFoundPage.jsx'));

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
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
