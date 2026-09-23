import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export default function CopyButton({ text, label = 'Salin', className }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Tersalin!' : label}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors',
        copied
          ? 'bg-success-100 text-success-700'
          : 'bg-primary-50 text-primary-700 hover:bg-primary-100',
        className
      )}
    >
      {copied ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
      {copied ? 'Tersalin!' : label}
    </button>
  );
}
