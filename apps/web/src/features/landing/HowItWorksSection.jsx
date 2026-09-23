import Badge from '../../components/ui/Badge.jsx';
import IconBox from '../../components/ui/IconBox.jsx';
import { HOW_IT_WORKS_STEPS } from '../../content/steps.js';

export default function HowItWorksSection() {
  return (
    <section id="cara-kerja" className="py-16 md:py-20 bg-gray-50 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="success" className="mb-4">Alur Sederhana</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Cara Mudah Mulai Workspace Kelompokmu
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Empat langkah sederhana dari form kebutuhan sampai workspace siap dipakai seluruh tim.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {HOW_IT_WORKS_STEPS.map((step, idx) => (
            <div key={step.num} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative">
              <div className="absolute top-4 right-4 text-4xl font-extrabold text-gray-100 select-none">
                {step.num}
              </div>
              <IconBox icon={step.icon} color="primary" className="mb-4" />
              <h3 className="font-bold text-gray-800 text-sm mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
