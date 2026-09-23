import { useEffect, useRef, useState } from 'react';
import Badge from '../../components/ui/Badge.jsx';
import { STATS, STATS_SOURCE } from '../../content/stats.js';

function CountUp({ target, suffix, duration = 1800 }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(parseFloat((eased * target).toFixed(1)));
            if (progress < 1) requestAnimationFrame(tick);
            else setValue(target);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {value.toFixed(1)}{suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="py-16 md:py-20 bg-primary-700 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto text-center">
        <Badge variant="dark" className="mb-5">Divalidasi oleh Data Riset Mahasiswa</Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">
          Krisis Manajemen Tugas Nyata Adanya
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-5xl md:text-6xl font-extrabold text-success-400 mb-3">
                <CountUp target={s.value} suffix={s.suffix} />
              </div>
              <p className="text-primary-100 text-sm leading-relaxed">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-xs text-primary-300">{STATS_SOURCE}</p>
      </div>
    </section>
  );
}
