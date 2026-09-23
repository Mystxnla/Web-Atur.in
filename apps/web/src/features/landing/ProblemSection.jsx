import Badge from '../../components/ui/Badge.jsx';
import IconBox from '../../components/ui/IconBox.jsx';
import { PROBLEMS } from '../../content/problems.js';

export default function ProblemSection() {
  return (
    <section id="masalah" className="py-16 md:py-20 bg-gray-50 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="warning" className="mb-4">Realita Mahasiswa</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Kenapa Koordinasi Lewat WhatsApp Group Selalu Bikin Stres?
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Kita tidak melihat itu tiap hari, tapi masalah ini lebih sering dan lebih dalam daripada yang kamu sadari.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PROBLEMS.map((p) => (
            <div key={p.title} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <IconBox icon={p.icon} color={p.color} className="mb-4" />
              <h3 className="font-bold text-gray-800 mb-2 text-sm">{p.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
