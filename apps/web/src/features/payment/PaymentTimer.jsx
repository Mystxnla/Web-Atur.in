import { useState, useEffect } from 'react';
import { formatCountdown } from '../../lib/format.js';

export default function PaymentTimer({ expiresAt, onExpired }) {
  const [seconds, setSeconds] = useState(() => {
    const diff = Math.floor((new Date(expiresAt) - Date.now()) / 1000);
    return Math.max(diff, 0);
  });

  useEffect(() => {
    if (seconds <= 0) { onExpired?.(); return; }
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(t); onExpired?.(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return <span className="font-mono">{formatCountdown(seconds)}</span>;
}
