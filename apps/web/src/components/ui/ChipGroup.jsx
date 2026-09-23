import { cn } from '../../lib/cn.js';

export default function ChipGroup({ label, options = [], value, onChange, error }) {
  return (
    <div className="flex flex-col gap-2" role="group" aria-label={label}>
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={selected}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium border transition-colors',
                selected
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:text-primary-700'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && <p role="alert" className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}
