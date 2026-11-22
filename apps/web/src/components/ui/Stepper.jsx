import { Check } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const DEFAULT_STEPS = ['Paket', 'Info Tim', 'Bayar', 'Workspace'];

export default function Stepper({ currentStep, steps = DEFAULT_STEPS }) {
  // currentStep: 1-based
  return (
    <div className="flex items-center w-full" role="list" aria-label="Langkah aktivasi workspace">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const done = stepNum < currentStep;
        const active = stepNum === currentStep;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none" role="listitem">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors',
                  done && 'bg-success-600 border-success-600 text-white',
                  active && 'bg-primary-600 border-primary-600 text-white',
                  !done && !active && 'bg-white border-gray-300 text-gray-400'
                )}
                aria-label={`Langkah ${stepNum}: ${step}${done ? ' (selesai)' : active ? ' (aktif)' : ''}`}
              >
                {done ? <Check size={14} aria-hidden /> : stepNum}
              </div>
              <span
                className={cn(
                  'mt-1 text-xs font-medium whitespace-nowrap',
                  active ? 'text-primary-600' : done ? 'text-success-700' : 'text-gray-400'
                )}
              >
                {step}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-1.5 mb-5 transition-colors',
                  done ? 'bg-success-500' : 'bg-gray-200'
                )}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
