import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCheckoutStore } from '../../stores/checkoutStore.js';
import { createOrder } from '../../services/api/index.js';
import { normalizePhone, isValidPhone } from '../../lib/phone.js';
import { JENIS_KEBUTUHAN_OPTIONS, JUMLAH_ANGGOTA_OPTIONS, getPackageById } from '@atur-in/shared';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import ChipGroup from '../../components/ui/ChipGroup.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import SelectedPlanCard from './SelectedPlanCard.jsx';
import TrustStrip from './TrustStrip.jsx';
import Dropzone from './Dropzone.jsx';
import { User, ChevronDown, ArrowRight } from 'lucide-react';

export default function OrderDetailForm() {
  const navigate = useNavigate();
  const { packageId, billingCycle, isTrial, setIsTrial, formData, setFormData, setOrderId } = useCheckoutStore();
  const currentPkg = getPackageById(packageId);
  const effectiveTrial = Boolean(currentPkg?.hasTrial && isTrial);
  const totalSteps = effectiveTrial ? 3 : 4;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: formData ?? {
      namaLengkap: '',
      email: '',
      noWhatsapp: '',
      namaKelompok: '',
      jenisKebutuhan: 'tugas_kelompok',
      jumlahAnggota: '6-15',
      deskripsiKebutuhan: '',
      urlDokumenReferensi: null,
    },
  });

  const deskripsi = watch('deskripsiKebutuhan', '');

  // Auto-save draft (debounced)
  const draftTimer = useRef(null);
  const allValues = watch();
  useEffect(() => {
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => setFormData(allValues), 300);
    return () => clearTimeout(draftTimer.current);
  }, [JSON.stringify(allValues)]);

  const onSubmit = async (data) => {
    const normalized = normalizePhone(data.noWhatsapp);
    if (!isValidPhone(normalized)) {
      toast.error('Format nomor WhatsApp belum valid. Contoh: 812-3456-7890');
      return;
    }
    try {
      const result = await createOrder({
        packageId,
        billingCycle,
        isTrial: effectiveTrial,
        namaLengkap: data.namaLengkap,
        email: data.email,
        noWhatsapp: normalized,
        namaKelompok: data.namaKelompok,
        jenisKebutuhan: data.jenisKebutuhan || 'tugas_kelompok',
        jumlahAnggota: data.jumlahAnggota || '6-15',
        deskripsiKebutuhan: data.deskripsiKebutuhan || '',
        urlDokumenReferensi: data.urlDokumenReferensi ?? null,
      });
      setOrderId(result.id);
      sessionStorage.setItem(`dwa.access.${result.id}`, result.accessToken);

      if (result.isTrial) {
        toast.success('Ruang kerja Free Trial 7 Hari siap! Membuka ruang kerja...');
        navigate(`/workspace/${result.id}?welcome=1`);
      } else {
        navigate(`/checkout/pembayaran/${result.id}`);
      }
    } catch (err) {
      if (err.status === 409 || err.code === 'trial_already_used') {
        toast.error(err.message || 'Nomor WA/Email sudah pernah klaim Free Trial. Mengalihkan ke mode berlangganan.');
        setIsTrial(false);
      } else {
        toast.error(err.message ?? 'Gagal membuat pesanan. Coba lagi.');
      }
    }
  };

  const handleQuickFillDemo = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setValue('namaLengkap', 'Noya Pratama', { shouldValidate: true });
    setValue('email', `kelompok.${rand}@kampus.ac.id`, { shouldValidate: true });
    setValue('noWhatsapp', `8129845${rand}`, { shouldValidate: true });
    setValue('namaKelompok', 'Kelompok Capstone Sistem Informasi', { shouldValidate: true });
    setValue('jenisKebutuhan', 'tugas_kelompok', { shouldValidate: true });
    setValue('jumlahAnggota', '6-15', { shouldValidate: true });
    toast.success('Data contoh berhasil diisi — tinggal klik tombol lanjut di bawah');
  };

  return (
    <div className="space-y-5">
      {/* Compact Header + 1-Click Quick Fill */}
      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-primary-600 font-semibold mb-0.5">
            Langkah 2 dari {totalSteps}
          </div>
          <h1 className="text-xl font-bold text-gray-900">Info Singkat Tim Kamu</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Cukup isi 5 data inti di bawah agar ruang kerja &amp; divisi langsung dibuat otomatis.
          </p>
        </div>
        <button
          type="button"
          onClick={handleQuickFillDemo}
          className="px-3.5 py-2 rounded-xl bg-white border border-primary-200 text-primary-700 text-xs font-semibold hover:bg-primary-100/50 transition-colors flex-shrink-0 self-start sm:self-center"
        >
          Isi Cepat (Data Contoh)
        </button>
      </div>

      {/* Selected Plan Summary on top so user sees what they're activating */}
      <SelectedPlanCard packageId={packageId} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Single Clean Core Form Card (5 Essential Fields Only) */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
              <User size={16} className="text-primary-600" aria-hidden />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Data Ketua / Pembuat Workspace</h2>
              <p className="text-xs text-gray-500">Digunakan untuk membuat ruang kerja &amp; akses email tim.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Nama Lengkap"
              placeholder="Contoh: Budi Pratama"
              required
              error={errors.namaLengkap?.message}
              {...register('namaLengkap', {
                required: 'Nama wajib diisi.',
                minLength: { value: 3, message: 'Nama minimal 3 huruf.' },
                maxLength: { value: 80, message: 'Nama maksimal 80 karakter.' },
              })}
            />

            <Input
              label="Email Aktif"
              type="email"
              placeholder="nama@kampus.ac.id"
              required
              error={errors.email?.message}
              {...register('email', {
                required: 'Email wajib diisi.',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Format email belum benar, contoh: nama@domain.com.',
                },
              })}
            />

            <Input
              label="No. WhatsApp"
              placeholder="81298451230"
              required
              prefix="+62"
              error={errors.noWhatsapp?.message}
              {...register('noWhatsapp', { required: 'Nomor WhatsApp wajib diisi.' })}
            />

            <Input
              label="Nama Kelompok / Organisasi"
              placeholder="Contoh: Kelompok Skripsi SI / Panitia Dies Natalis"
              required
              error={errors.namaKelompok?.message}
              {...register('namaKelompok', {
                required: 'Nama kelompok atau organisasi wajib diisi.',
                minLength: { value: 2, message: 'Minimal 2 karakter.' },
              })}
            />

            <Select
              label="Jenis Ruang Kerja"
              placeholder="-- Pilih jenis ruang kerja --"
              options={JENIS_KEBUTUHAN_OPTIONS}
              required
              error={errors.jenisKebutuhan?.message}
              {...register('jenisKebutuhan', { required: 'Pilih jenis ruang kerja.' })}
            />
          </div>
        </Card>

        {/* Progressive Disclosure: Optional Details Hidden in Accordion */}
        <details className="bg-white rounded-2xl border border-gray-200 overflow-hidden group">
          <summary className="px-5 py-3.5 text-sm font-medium text-gray-700 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors list-none">
            <span>Detail tambahan (opsional — boleh dilewati)</span>
            <ChevronDown size={16} className="text-gray-400 group-open:rotate-180 transition-transform" aria-hidden />
          </summary>
          <div className="px-5 pb-5 pt-2 border-t border-gray-100 space-y-4">
            <Controller
              name="jumlahAnggota"
              control={control}
              render={({ field }) => (
                <ChipGroup
                  label="Perkiraan Jumlah Anggota"
                  options={JUMLAH_ANGGOTA_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            <Textarea
              label="Catatan Khusus (opsional)"
              placeholder="Mis. nama divisi khusus atau integrasi Google Drive yang diinginkan."
              rows={3}
              maxLength={500}
              value={deskripsi}
              {...register('deskripsiKebutuhan')}
            />

            <Dropzone onChange={(url) => setValue('urlDokumenReferensi', url)} />
          </div>
        </details>

        <TrustStrip />

        {/* Sticky Primary CTA */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-200 -mx-4 px-4 py-3 -mb-6">
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            <span className="flex items-center justify-center gap-2">
              {effectiveTrial ? 'Buat & Buka Workspace Gratis (7 Hari)' : 'Lanjut ke Pembayaran'}
              <ArrowRight size={16} aria-hidden />
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}
