import { Check } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export default function Timeline({ steps, currentIndex }) {
  // steps: [{ label, description, estimate? }]
  return (
    <ol className="space-y-0">
      {steps.map((step, idx) => {
        const done = idx < currentIndex;
        const active = idx === currentIndex;
        const isLast = idx === steps.length - 1;

        return (
          <li key={idx} className="flex gap-4">
            {/* Connector column */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 z-10 flex-shrink-0',
                  done && 'bg-success-600 border-success-600 text-white',
                  active && 'bg-primary-600 border-primary-600 text-white',
                  !done && !active && 'bg-white border-gray-200 text-gray-400'
                )}
                aria-label={`Langkah ${idx + 1}: ${step.label}${done ? ' (selesai)' : active ? ' (aktif)' : ''}`}
              >
                {done ? <Check size={14} aria-hidden /> : idx + 1}
              </div>
              {!isLast && (
                <div className={cn('w-0.5 flex-1 my-1', done ? 'bg-success-400' : 'bg-gray-200')} aria-hidden />
              )}
            </div>
            {/* Content */}
            <div className={cn('pb-6', isLast && 'pb-0')}>
              <p className={cn('text-sm font-semibold', active ? 'text-primary-700' : done ? 'text-success-700' : 'text-gray-500')}>
                {step.label}
              </p>
              {step.description && (
                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{step.description}</p>
              )}
              {step.estimate && (
                <p className="text-xs text-gray-400 mt-1">{step.estimate}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
