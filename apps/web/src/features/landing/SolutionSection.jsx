import Badge from '../../components/ui/Badge.jsx';
import IconBox from '../../components/ui/IconBox.jsx';
import { SOLUTIONS } from '../../content/solutions.js';

export default function SolutionSection() {
  return (
    <section id="solusi" className="py-16 md:py-20 bg-white px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="primary" className="mb-4">Arsitektur Terpadu</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Solusi Cerdas: Workspace All-in-One untuk Kelompok Mahasiswa
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Satu ekosistem yang menggantikan semua chat koordinasi yang berantakan dan file yang tercecer.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {SOLUTIONS.map((s) => (
            <div key={s.title} className="flex gap-4 bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <IconBox icon={s.icon} color={s.color} size="lg" className="mt-0.5" />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-gray-800">{s.title}</h3>
                  <Badge variant={s.badgeVariant} className="text-xs">{s.badge}</Badge>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
