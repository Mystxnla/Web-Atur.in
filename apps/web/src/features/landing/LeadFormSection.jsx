import { MessageCircle, Mail, Clock, ArrowUpRight } from 'lucide-react';
import { SITE } from '../../config/site.js';
import { waSupportLink } from '../../lib/wa.js';

export default function LeadFormSection() {
  const waHref = waSupportLink(
    SITE.supportWa,
    'Halo tim Atur.in, saya ingin tanya-tanya soal workspace untuk kelompok/organisasi kami.'
  );

  return (
    <section id="kontak" className="py-16 md:py-20 bg-gray-50 border-t border-gray-200/70">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-lg">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                Contact Person Atur.in
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                Ada pertanyaan? Tanya langsung tanpa isi form
              </h2>
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                Masih bingung pilih paket atau mau diskusi pembagian divisi kelompokmu? Hubungi tim kami langsung lewat WhatsApp atau email.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 pt-1">
                <Clock size={14} className="text-gray-400 flex-shrink-0" aria-hidden />
                <span>Jam balas cepat: setiap hari {SITE.operationalHours}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full md:w-72 flex-shrink-0">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white transition-colors flex items-center justify-between gap-3 shadow-xs"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={18} aria-hidden />
                  </span>
                  <span className="text-left min-w-0">
                    <span className="block text-sm font-semibold leading-tight">Chat WhatsApp</span>
                    <span className="block text-xs text-primary-100 truncate">{SITE.supportPhone}</span>
                  </span>
                </span>
                <ArrowUpRight size={16} className="text-primary-100 flex-shrink-0" aria-hidden />
              </a>

              <a
                href={`mailto:${SITE.supportEmail}?subject=Tanya%20Workspace%20Atur.in`}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 transition-colors flex items-center justify-between gap-3"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <Mail size={16} className="text-gray-600" aria-hidden />
                  </span>
                  <span className="text-left min-w-0">
                    <span className="block text-sm font-semibold leading-tight">Kirim Email</span>
                    <span className="block text-xs text-gray-500 truncate">{SITE.supportEmail}</span>
                  </span>
                </span>
                <ArrowUpRight size={16} className="text-gray-400 flex-shrink-0" aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
