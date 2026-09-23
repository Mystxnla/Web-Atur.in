import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOrder, createPayment, fetchPayment } from '../../services/api/index.js';
import { useCheckoutStore } from '../../stores/checkoutStore.js';
import { ORDER_STATUSES, PAYMENT_METHODS } from '@atur-in/shared';
import Stepper from '../../components/ui/Stepper.jsx';
import PaymentMethodPicker from '../../features/payment/PaymentMethodPicker.jsx';
import QrisPanel from '../../features/payment/QrisPanel.jsx';
import VaPanel from '../../features/payment/VaPanel.jsx';
import PaymentTimer from '../../features/payment/PaymentTimer.jsx';
import OrderSummary from '../../features/payment/OrderSummary.jsx';
import ExpiredState from '../../features/payment/ExpiredState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Button from '../../components/ui/Button.jsx';
import { MessageCircle, ShieldCheck, Clock } from 'lucide-react';
import { toDisplayRef } from '../../lib/orderRef.js';
import CopyButton from '../../components/ui/CopyButton.jsx';
import { toast } from 'sonner';
import { waSupportLink } from '../../lib/wa.js';
import { SITE } from '../../config/site.js';

export default function PaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { paymentMethod, paymentId, setPaymentMethod, setPaymentId } = useCheckoutStore();

  const [payment, setPayment] = useState(null);
  const [creatingBill, setCreatingBill] = useState(false);
  const pollingRef = useRef(null);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId),
    refetchInterval: false,
  });

  // Create payment bill once order is loaded
  useEffect(() => {
    if (!order) return;
    if ([ORDER_STATUSES.DIBAYAR, ORDER_STATUSES.DIVERIFIKASI, ORDER_STATUSES.PROSES_SETUP, ORDER_STATUSES.SELESAI].includes(order.status)) {
      navigate(`/checkout/selesai/${orderId}`, { replace: true });
      return;
    }
    // Create initial bill if no paymentId
    if (!paymentId) {
      handleCreateBill(paymentMethod);
    } else {
      // Resume polling existing payment
      pollPayment(paymentId);
    }
  }, [order?.id]);

  const handleCreateBill = async (method) => {
    setCreatingBill(true);
    try {
      const p = await createPayment(orderId, method);
      setPayment(p);
      setPaymentId(p.id);
      pollPayment(p.id);
    } catch (err) {
      toast.error('Gagal membuat tagihan: ' + err.message);
    } finally {
      setCreatingBill(false);
    }
  };

  const pollPayment = (pid) => {
    clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const p = await fetchPayment(pid);
        setPayment(p);
        if (p.status === 'paid') {
          clearInterval(pollingRef.current);
          toast.success('Pembayaran berhasil! Mengarahkan...');
          setTimeout(() => navigate(`/checkout/selesai/${orderId}`), 1200);
        }
        if (p.status === 'expired') {
          clearInterval(pollingRef.current);
        }
      } catch {/* silent */}
    }, 3000);
  };

  useEffect(() => () => clearInterval(pollingRef.current), []);

  const handleMethodChange = async (method) => {
    clearInterval(pollingRef.current);
    setPaymentMethod(method);
    setPayment(null);
    setPaymentId(null);
    await handleCreateBill(method);
  };

  const handleCheckPayment = async () => {
    if (!paymentId) return;
    try {
      const p = await fetchPayment(paymentId);
      setPayment(p);
      if (p.status === 'paid') {
        navigate(`/checkout/selesai/${orderId}`);
      } else {
        toast.info('Pembayaran belum terdeteksi. Coba beberapa saat lagi.');
      }
    } catch {
      toast.error('Gagal memeriksa status pembayaran.');
    }
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (error) return <p className="text-danger-600 text-sm p-4">Pesanan tidak ditemukan.</p>;

  const isExpired = payment?.status === 'expired';

  return (
    <div className="space-y-5">
      <Stepper currentStep={3} />

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" aria-hidden />
          <span className="font-semibold text-gray-700">LANGKAH 3 DARI 4</span>
          {payment && !isExpired && (
            <span className="ml-auto flex items-center gap-1 text-warning-600 font-semibold">
              <Clock size={13} aria-hidden />
              Bayar dalam <PaymentTimer expiresAt={payment.expiresAt} onExpired={() => {
                setPayment((p) => p ? { ...p, status: 'expired' } : p);
              }} />
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold text-gray-900">Selesaikan Pembayaran</h1>
        {order && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>No. Tagihan:</span>
            <span className="font-semibold text-gray-800">{toDisplayRef(orderId)}</span>
            <CopyButton text={toDisplayRef(orderId)} />
          </div>
        )}
      </div>

      {isExpired ? (
        <ExpiredState onRenew={() => handleCreateBill(paymentMethod)} />
      ) : (
        <>
          {/* Method picker */}
          <PaymentMethodPicker value={paymentMethod} onChange={handleMethodChange} />

          {/* Payment display */}
          {creatingBill ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : payment?.metode === PAYMENT_METHODS.QRIS ? (
            <QrisPanel payment={payment} />
          ) : payment?.metode === PAYMENT_METHODS.VA ? (
            <VaPanel payment={payment} />
          ) : null}

          {/* Guide */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">3 Langkah Mudah Pembayaran:</h3>
            <ol className="space-y-2">
              {[
                'Buka aplikasi m-banking atau e-wallet pilihan Anda (BCA, GoPay, OVO, Livin\', dll).',
                'Pilih menu Scan QR, arahkan kamera ke kode di atas dan cek nominal tagihan.',
                'Masukkan PIN transaksi Anda dan simpan bukti konfirmasi pembayaran.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="w-5 h-5 bg-primary-100 text-primary-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Sticky CTA */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 -mx-4 px-4 py-3 space-y-2 -mb-6">
            <Button fullWidth size="lg" onClick={handleCheckPayment}>
              Saya Sudah Bayar
            </Button>
            <a
              href={waSupportLink(SITE.supportWa, toDisplayRef(orderId))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-success-600 font-medium hover:underline"
            >
              <MessageCircle size={14} aria-hidden />
              Butuh bantuan? Chat Arsitek via WhatsApp
            </a>
            <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
              <ShieldCheck size={12} aria-hidden />
              100% Pembayaran Aman &amp; Terenkripsi
            </p>
          </div>
        </>
      )}

      {/* Order summary */}
      {order && <OrderSummary order={order} />}

      <div className="pb-28" />
    </div>
  );
}
