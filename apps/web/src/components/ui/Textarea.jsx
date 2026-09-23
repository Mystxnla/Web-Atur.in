import { cn } from '../../lib/cn.js';
import { forwardRef } from 'react';

const Textarea = forwardRef(function Textarea(
  { label, error, hint, maxLength, value, className, id, required, ...props },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-danger-500 ml-0.5" aria-hidden>*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        maxLength={maxLength}
        value={value}
        aria-invalid={!!error}
        className={cn(
          'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 resize-none',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          error ? 'border-danger-400 focus:ring-danger-400' : 'border-gray-200',
          className
        )}
        {...props}
      />
      <div className="flex justify-between items-start">
        <div>
          {error && <p role="alert" className="text-xs text-danger-600">{error}</p>}
          {!error && hint && <p className="text-xs text-gray-500">{hint}</p>}
        </div>
        {maxLength && (
          <span className="text-xs text-gray-400 ml-auto">
            {(value ?? '').length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
});

export default Textarea;
