import { useRef } from 'react';
import { cn } from '../../lib/cn.js';

export default function OtpInput({ value = '', onChange, length = 6, error }) {
  const inputsRef = useRef([]);

  const handleChange = (idx, e) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const arr = value.split('');
    arr[idx] = char;
    const next = arr.join('').slice(0, length);
    onChange(next);
    if (char && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < length - 1) inputsRef.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, length - 1);
    inputsRef.current[focusIdx]?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex gap-2 justify-center"
        role="group"
        aria-label="Masukkan kode OTP 6 digit"
      >
        {Array.from({ length }).map((_, idx) => (
          <input
            key={idx}
            ref={(el) => (inputsRef.current[idx] = el)}
            type="text"
            inputMode="numeric"
            pattern="\d"
            maxLength={1}
            value={value[idx] ?? ''}
            onChange={(e) => handleChange(idx, e)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            aria-label={`Digit ${idx + 1}`}
            className={cn(
              'w-11 h-12 text-center text-lg font-bold rounded-xl border-2 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              error ? 'border-danger-400' : value[idx] ? 'border-primary-500' : 'border-gray-200'
            )}
          />
        ))}
      </div>
      {error && <p role="alert" className="text-xs text-danger-600 text-center">{error}</p>}
    </div>
  );
}
