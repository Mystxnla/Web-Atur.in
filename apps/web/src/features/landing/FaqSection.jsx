import Badge from '../../components/ui/Badge.jsx';
import { Accordion } from '../../components/ui/Accordion.jsx';
import { FAQ_ITEMS } from '../../content/faq.js';

export default function FaqSection() {
  return (
    <section id="faq" className="py-16 md:py-20 bg-white px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <Badge variant="gray" className="mb-4">Tanya Jawab</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Pertanyaan yang Sering Diajukan
          </h2>
        </div>
        <Accordion items={FAQ_ITEMS} />
      </div>
    </section>
  );
}
