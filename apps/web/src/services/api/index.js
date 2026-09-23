import { api } from './client.js';

// Packages
export const fetchPackages = () => api.get('/packages');
export const fetchPackage = (id) => api.get(`/packages/${id}`);

// Orders
export const createOrder = (data) => api.post('/orders', data);
export const fetchOrder = (id) => api.get(`/orders/${id}`);
export const advanceOrderStatus = (id, status, catatan) =>
  api.patch(`/orders/${id}/status`, { status, catatan });

// Payments
export const createPayment = (orderId, metode) =>
  api.post(`/orders/${orderId}/payments`, { metode });
export const fetchPayment = (paymentId) => api.get(`/payments/${paymentId}`);
export const simulatePaid = (paymentId) => api.post(`/payments/${paymentId}/simulate-paid`);
export const simulateExpired = (paymentId) => api.post(`/payments/${paymentId}/simulate-expired`);

// Lookup / OTP
export const requestOtp = (noWhatsapp, nomorReferensi) =>
  api.post('/lookup/request-otp', { noWhatsapp, nomorReferensi });
export const verifyOtp = (requestId, otp) =>
  api.post('/lookup/verify-otp', { requestId, otp });

// Leads
export const submitLead = (data) => api.post('/leads', data);

// Upload
export const uploadReference = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/upload/reference', form);
};

// Demo
export const fetchDemoState = () => api.get('/demo/state');
export const demoAdvanceOrder = (id) => api.post(`/demo/advance-order/${id}`);
export const demoReset = () => api.post('/demo/reset');
