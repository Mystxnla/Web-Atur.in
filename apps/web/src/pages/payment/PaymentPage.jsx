import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOrder, createPayment, fetchPayment, simulatePaid } from '../../services/api/index.js';
import { useCheckoutStore } from '../../stores/checkoutStore.js';
import { ORDER_STATUSES, PAYMENT_METHODS } from '@atur-in/shared';
import Stepper from '../../components/ui/Stepper.jsx';
import PaymentMethodPicker from '../../features/payment/PaymentMethodPicker.jsx';
import QrisPanel from '../../features/payment/QrisPanel.jsx';
import VaPanel from '../../features/payment/VaPanel.jsx';
import EwalletPanel from '../../features/payment/EwalletPanel.jsx';
import PaymentTimer from '../../features/payment/PaymentTimer.jsx';
import OrderSummary from '../../features/payment/OrderSummary.jsx';
import ExpiredState from '../../features/payment/ExpiredState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Button from '../../components/ui/Button.jsx';
import { MessageCircle, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { toDisplayRef } from '../../lib/orderRef.js';
import CopyButton from '../../components/ui/CopyButton.jsx';
import { toast } from 'sonner';
import { waSupportLink } from '../../lib/wa.js';
import { SITE } from '../../config/site.js';

export default function PaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { paymentMethod, paymentId, setPaymentMethod, setPaymentId, setOrderId } = useCheckoutStore();

  const [payment, setPayment] = useState(null);
  const [creatingBill, setCreatingBill] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const pollingRef = useRef(null);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId),
    refetchInterval: false,
  });

  useEffect(() => {
    if (!order) return;
    setOrderId(order.id);
    const isAlreadyPaidNonTrial =
      !order.isTrial &&
      [ORDER_STATUSES.DIBAYAR, ORDER_STATUSES.DIVERIFIKASI, ORDER_STATUSES.PROSES_SETUP, ORDER_STATUSES.SELESAI].includes(order.status);

    if (isAlreadyPaidNonTrial) {
      navigate(`/checkout/selesai/${orderId}`, { replace: true });
      return;
    }

    if (!paymentId) {
      handleCreateBill(paymentMethod);
    } else {
      pollPayment(paymentId);
    }
  }, [order?.id]);

  function normalizePayment(p) {
    if (!p) return p;
    return {
      ...p,
      expiresAt:  p.expiresAt  ?? p.expires_at,
      qrPayload:  p.qrPayload  ?? p.qr_payload,
      vaNumber:   p.vaNumber   ?? p.va_number,
      orderId:    p.orderId    ?? p.order_id,
      metode:     p.metode     ?? p.method,
    };
  }

  const handleCreateBill = async (method) => {
    setCreatingBill(true);
    try {
      const raw = await createPayment(orderId, method);
      const p = normalizePayment(raw);
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
        const raw = await fetchPayment(pid);
        const p = normalizePayment(raw);
        setPayment(p);
        if (p.status === 'paid') {
          clearInterval(pollingRef.current);
          toast.success('Pembayaran berhasil! Mengarahkan...');
          setTimeout(() => navigate(`/checkout/selesai/${orderId}`), 1000);
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

  const handleSimulatePayNow = async () => {
    const pid = payment?.id ?? paymentId;
    if (!pid) {
      toast.info('Sedang menyiapkan tagihan...');
      return;
    }
    setSimulating(true);
    try {
      await simulatePaid(pid);
      clearInterval(pollingRef.current);
      toast.success('Pembayaran Demo Berhasil! Mengarahkan ke halaman konfirmasi...');
      setTimeout(() => navigate(`/checkout/selesai/${orderId}`), 800);
    } catch (err) {
      toast.error('Gagal simulasi bayar: ' + err.message);
    } finally {
      setSimulating(false);
    }
  };

  const handleCheckPayment = async () => {
    if (!paymentId) {
      toast.info('Membuat tagihan terlebih dahulu...');
      await handleCreateBill(paymentMethod);
      return;
    }
    try {
      const raw = await fetchPayment(paymentId);
      const p = normalizePayment(raw);
      setPayment(p);
      if (p.status === 'paid') {
        navigate(`/checkout/selesai/${orderId}`);
      } else {
        toast.info('Pembayaran belum terdeteksi. Klik tombol "Simulasikan Bayar Lunas (Demo)" di bawah untuk mencoba alur lunas.');
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
        <h1 className="text-xl font-bold text-gray-900">
          {order?.isTrial ? 'Aktivasi Langganan Penuh' : 'Selesaikan Pembayaran'}
        </h1>
        {order && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>No. Referensi:</span>
            <span className="font-semibold text-gray-800">{toDisplayRef(order.ref_number ?? orderId)}</span>
            <CopyButton text={toDisplayRef(order.ref_number ?? orderId)} />
          </div>
        )}
      </div>

      {isExpired ? (
        <ExpiredState onRenew={() => handleCreateBill(paymentMethod)} />
      ) : (
        <>
          <PaymentMethodPicker value={paymentMethod} onChange={handleMethodChange} />

          {creatingBill ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : (() => {
            const metode = payment?.metode ?? payment?.method ?? paymentMethod;
            if (metode === PAYMENT_METHODS.QRIS)    return <QrisPanel payment={payment} />;
            if (metode === PAYMENT_METHODS.VA)      return <VaPanel payment={payment} />;
            if (metode === PAYMENT_METHODS.EWALLET) return <EwalletPanel payment={payment} />;
            return null;
          })()}

          <div className="bg-gray-50 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">3 Langkah Mudah Pembayaran:</h3>
            <ol className="space-y-2">
              {[
                'Buka aplikasi m-banking atau e-wallet pilihan Anda (BCA, GoPay, OVO, Livin\', dll).',
                'Lakukan pembayaran sesuai metode di atas (Scan QRIS, Virtual Account, atau Nomor E-Wallet).',
                'Masukkan PIN transaksi Anda dan klik tombol konfirmasi di bawah.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="w-5 h-5 bg-primary-100 text-primary-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-100 -mx-4 px-4 py-3 space-y-2 -mb-6">
            <Button fullWidth size="lg" onClick={handleCheckPayment}>
              Saya Sudah Bayar
            </Button>

            {SITE.enableDemoPanel && (
              <button
                type="button"
                disabled={simulating || creatingBill}
                onClick={handleSimulatePayNow}
                className="w-full py-2.5 px-4 rounded-xl border border-success-300 bg-success-50 text-success-700 text-xs font-bold hover:bg-success-100 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 size={14} aria-hidden />
                {simulating ? 'Memproses Simulasi...' : 'Mode Prototype: Simulasikan Bayar Lunas (1-Klik)'}
              </button>
            )}

            <a
              href={waSupportLink(SITE.supportWa, toDisplayRef(order?.ref_number ?? orderId))}
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

      {order && <OrderSummary order={order} />}

      <div className="pb-28" />
    </div>
  );
}
