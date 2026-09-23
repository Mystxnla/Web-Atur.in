import { useState } from 'react';
import { Settings, X, ChevronRight, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { useDemoStore } from '../../stores/demoStore.js';
import { useCheckoutStore } from '../../stores/checkoutStore.js';
import { simulatePaid, simulateExpired, demoAdvanceOrder, demoReset } from '../../services/api/index.js';
import { toast } from 'sonner';
import { cn } from '../../lib/cn.js';
import SimulatedWhatsApp from './SimulatedWhatsApp.jsx';

export default function DemoPanel() {
  const { isPanelOpen, togglePanel, logs, addLog } = useDemoStore();
  const { orderId, paymentId } = useCheckoutStore();
  const [loading, setLoading] = useState(null);
  const [waMsg, setWaMsg] = useState(null);

  async function run(label, fn) {
    setLoading(label);
    try {
      const result = await fn();
      addLog({ type: 'success', label, data: result });
      toast.success(`Demo: ${label}`);
      return result;
    } catch (err) {
      addLog({ type: 'error', label, error: err.message });
      toast.error(`Demo error: ${err.message}`);
    } finally {
      setLoading(null);
    }
  }

  const actions = [
    {
      label: 'Simulasikan Pembayaran Berhasil',
      icon: CheckCircle,
      color: 'text-success-600',
      disabled: !paymentId,
      onClick: async () => {
        const result = await run('Bayar Berhasil', () => simulatePaid(paymentId));
        if (result) {
          setWaMsg({
            title: 'Pembayaran Diterima',
            body: `Pembayaran untuk pesanan #${result.order?.id ?? orderId} telah diterima dan diverifikasi. Tim kami akan menghubungi kamu dalam 1x24 jam.`,
          });
        }
      },
    },
    {
      label: 'Simulasikan Pembayaran Kedaluwarsa',
      icon: AlertCircle,
      color: 'text-warning-600',
      disabled: !paymentId,
      onClick: () => run('Bayar Kedaluwarsa', () => simulateExpired(paymentId)),
    },
    {
      label: 'Majukan Status Pesanan',
      icon: ChevronRight,
      color: 'text-primary-600',
      disabled: !orderId,
      onClick: async () => {
        const result = await run('Majukan Status', () => demoAdvanceOrder(orderId));
        if (result) {
          setWaMsg({
            title: 'Update Status Pesanan',
            body: `Status pesanan kamu diperbarui menjadi: ${result.nextStatus?.replace(/_/g, ' ')}.`,
          });
        }
      },
    },
    {
      label: 'Reset Demo Data',
      icon: RotateCcw,
      color: 'text-danger-600',
      disabled: false,
      onClick: () => run('Reset Demo', () => demoReset()),
    },
  ];

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={togglePanel}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
        aria-label="Buka Demo Panel"
        aria-expanded={isPanelOpen}
      >
        <Settings size={20} aria-hidden />
      </button>

      {/* Panel */}
      {isPanelOpen && (
        <div
          className="fixed bottom-20 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          role="dialog"
          aria-label="Demo Panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
            <div>
              <div className="text-sm font-bold">Demo Panel</div>
              <div className="text-xs text-gray-400">Mode Prototype — hanya tampil di demo</div>
            </div>
            <button onClick={togglePanel} className="p-1 hover:bg-gray-700 rounded" aria-label="Tutup panel">
              <X size={16} aria-hidden />
            </button>
          </div>

          {/* Context info */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-0.5">
            <div>Order ID: <span className="font-mono text-gray-800">{orderId ?? '—'}</span></div>
            <div>Payment ID: <span className="font-mono text-gray-800">{paymentId ?? '—'}</span></div>
          </div>

          {/* Actions */}
          <div className="p-3 space-y-2">
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                disabled={a.disabled || loading === a.label}
                onClick={a.onClick}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left',
                  a.color
                )}
              >
                <a.icon size={16} aria-hidden className="flex-shrink-0" />
                {loading === a.label ? 'Memproses...' : a.label}
              </button>
            ))}
          </div>

          {/* Log */}
          {logs.length > 0 && (
            <div className="border-t border-gray-100 max-h-32 overflow-y-auto">
              <div className="px-4 py-2 text-xs text-gray-400 font-semibold">Log Terbaru</div>
              {logs.slice(0, 5).map((l, i) => (
                <div key={i} className={cn('px-4 py-1 text-xs', l.type === 'error' ? 'text-danger-600' : 'text-gray-600')}>
                  {l.label} — {new Date(l.ts).toLocaleTimeString('id-ID')}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Simulated WA notification */}
      {waMsg && (
        <SimulatedWhatsApp
          title={waMsg.title}
          body={waMsg.body}
          onClose={() => setWaMsg(null)}
        />
      )}
    </>
  );
}
