import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import { submitLead } from '../../services/api/index.js';
import { normalizePhone, isValidPhone } from '../../lib/phone.js';
import { toast } from 'sonner';
import { JENIS_KEBUTUHAN_OPTIONS, JUMLAH_ANGGOTA_OPTIONS } from '@atur-in/shared';
import { ShieldCheck } from 'lucide-react';

export default function LeadFormSection() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const deskripsi = watch('catatan', '');

  const onSubmit = async (data) => {
    const normalized = normalizePhone(data.noWhatsapp);
    if (!isValidPhone(normalized)) {
      toast.error('Format nomor WhatsApp belum valid.');
      return;
    }
    try {
      await submitLead({ ...data, noWhatsapp: normalized });
      setSubmitted(true);
      toast.success('Pesanan konsultasi berhasil dikirim!');
    } catch (err) {
      toast.error(err.message ?? 'Terjadi kesalahan.');
    }
  };

  if (submitted) {
    return (
      <section id="order" className="py-16 md:py-20 bg-primary-50 px-4 sm:px-6">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-success-600" aria-hidden />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Formulir Berhasil Dikirim!</h2>
          <p className="text-gray-500">Tim kami akan menghubungi kamu dalam 1x24 jam via WhatsApp. Terima kasih!</p>
        </div>
      </section>
    );
  }

  return (
    <section id="order" className="py-16 md:py-20 bg-primary-50 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <Badge variant="primary" className="mb-4">Formulir Pemesanan</Badge>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Siap Akhiri Drama WhatsApp Group?</h2>
          <p className="text-gray-500">Isi form di bawah dan tim kami akan menghubungimu untuk konsultasi gratis.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <Input
            label="Nama Lengkap Pemesan (PIC)"
            placeholder="Contoh: Budi Pratama"
            required
            error={errors.namaPic?.message}
            {...register('namaPic', { required: 'Nama wajib diisi.', minLength: { value: 3, message: 'Nama minimal 3 huruf.' } })}
          />

          <Input
            label="Nomor WhatsApp Aktif"
            placeholder="Contoh: 812-3456-7890"
            required
            prefix="+62"
            error={errors.noWhatsapp?.message}
            {...register('noWhatsapp', { required: 'Nomor WhatsApp wajib diisi.' })}
          />

          <Input
            label="Nama Kelompok / Mata Kuliah / UKM"
            placeholder="Contoh: Kelompok Skripsi Genap 2026"
            required
            error={errors.namaKelompok?.message}
            {...register('namaKelompok', { required: 'Nama kelompok wajib diisi.' })}
          />

          <Select
            label="Jenis Kebutuhan"
            placeholder="-- Pilih jenis kebutuhan --"
            options={JENIS_KEBUTUHAN_OPTIONS}
            error={errors.jenisKebutuhan?.message}
            {...register('jenisKebutuhan')}
          />

          <Select
            label="Estimasi Jumlah Anggota Kelompok"
            placeholder="-- Pilih jumlah anggota --"
            options={JUMLAH_ANGGOTA_OPTIONS}
            error={errors.estimasiAnggota?.message}
            {...register('estimasiAnggota')}
          />

          <Textarea
            label="Catatan Tambahan / Kendala Utama"
            placeholder="Ceritakan masalah utama tim kamu..."
            rows={3}
            maxLength={500}
            value={deskripsi}
            {...register('catatan')}
          />

          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            Ajukan Pesanan Workspace (Konsultasi Gratis Dulu)
          </Button>

          <p className="text-xs text-center text-gray-400">
            Data kamu aman dan hanya digunakan untuk keperluan koordinasi workspace. Tidak akan disebarkan.
          </p>
        </form>
      </div>
    </section>
  );
}
