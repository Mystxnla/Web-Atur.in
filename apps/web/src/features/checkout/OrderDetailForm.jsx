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
import Badge from '../../components/ui/Badge.jsx';
import { Card } from '../../components/ui/Card.jsx';
import SelectedPlanCard from './SelectedPlanCard.jsx';
import TrustStrip from './TrustStrip.jsx';
import Dropzone from './Dropzone.jsx';
import { User, Settings2, Image, ChevronDown, Sparkles } from 'lucide-react';

export default function OrderDetailForm() {
  const navigate = useNavigate();
  const { packageId, billingCycle, isTrial, setIsTrial, formData, setFormData, setOrderId } = useCheckoutStore();
  const currentPkg = getPackageById(packageId);
  const effectiveTrial = Boolean(currentPkg?.hasTrial && isTrial);

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
      jenisKebutuhan: '',
      jumlahAnggota: '',
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
        jenisKebutuhan: data.jenisKebutuhan,
        jumlahAnggota: data.jumlahAnggota,
        deskripsiKebutuhan: data.deskripsiKebutuhan,
        urlDokumenReferensi: data.urlDokumenReferensi ?? null,
      });
      setOrderId(result.id);
      sessionStorage.setItem(`dwa.access.${result.id}`, result.accessToken);

      if (result.isTrial) {
        toast.success('Free Trial 7 Hari berhasil diaktifkan!');
        navigate(`/checkout/selesai/${result.id}`);
      } else {
        navigate(`/checkout/pembayaran/${result.id}`);
      }
    } catch (err) {
      if (err.status === 409 || err.code === 'trial_already_used') {
        toast.error(err.message || 'Nomor WA/Email sudah pernah klaim Free Trial. Mengalihkan ke mode Langsung Berlangganan.');
        setIsTrial(false);
      } else {
        toast.error(err.message ?? 'Gagal membuat pesanan. Coba lagi.');
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4">
        <div className="text-xs text-primary-600 font-semibold mb-1">Langkah 2 dari 4</div>
        <h1 className="text-xl font-bold text-gray-900">Lengkapi Detail Pesanan</h1>
        <p className="text-sm text-gray-500 mt-1">Beri tahu kami detail tim dan kebutuhan arsitektur ruang kerja digital Anda.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Informasi Pemesan */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <User size={16} className="text-primary-600" aria-hidden />
            </div>
            <h2 className="font-bold text-gray-800">Informasi Pemesan</h2>
            <Badge variant="warning" className="ml-auto">Wajib Diisi</Badge>
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
              label="Alamat Email Aktif"
              type="email"
              placeholder="nama@domain.com"
              required
              hint="Detail akses & link undangan blueprint akan dikirimkan ke email ini."
              error={errors.email?.message}
              {...register('email', {
                required: 'Email wajib diisi.',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Format email belum benar, contoh: nama@domain.com.' },
              })}
            />

            <Input
              label="No. WhatsApp"
              placeholder="81298451230"
              required
              prefix="+62"
              hint="Penting untuk koordinasi setup & invite tim secara real-time."
              error={errors.noWhatsapp?.message}
              {...register('noWhatsapp', { required: 'Nomor WhatsApp wajib diisi.' })}
            />

            <Input
              label="Nama Kelompok / Organisasi"
              placeholder="Contoh: AI Research Hub & Project Labs"
              required
              error={errors.namaKelompok?.message}
              {...register('namaKelompok', {
                required: 'Nama kelompok atau organisasi wajib diisi.',
                minLength: { value: 2, message: 'Minimal 2 karakter.' },
              })}
            />
          </div>
        </Card>

        {/* Spesifikasi Arsitektur */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Settings2 size={16} className="text-purple-600" aria-hidden />
            </div>
            <h2 className="font-bold text-gray-800">Spesifikasi Arsitektur</h2>
          </div>

          <div className="space-y-5">
            <Select
              label="Jenis Kebutuhan Workspace"
              placeholder="-- Pilih jenis kebutuhan --"
              options={JENIS_KEBUTUHAN_OPTIONS}
              required
              error={errors.jenisKebutuhan?.message}
              {...register('jenisKebutuhan', { required: 'Pilih jenis kebutuhan workspace.' })}
            />

            <Controller
              name="jumlahAnggota"
              control={control}
              rules={{ required: 'Pilih perkiraan jumlah anggota.' }}
              render={({ field }) => (
                <ChipGroup
                  label="Jumlah Anggota Tim"
                  options={JUMLAH_ANGGOTA_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.jumlahAnggota?.message}
                />
              )}
            />

            <Textarea
              label="Deskripsi Kebutuhan & Integrasi Tools"
              placeholder="Ceritakan kebutuhan workspace timmu. Makin detail, makin pas hasilnya."
              rows={4}
              maxLength={500}
              value={deskripsi}
              hint="Semakin detail, setup semakin akurat."
              {...register('deskripsiKebutuhan')}
            />

            <Dropzone onChange={(url) => setValue('urlDokumenReferensi', url)} />
          </div>
        </Card>

        {/* Pratinjau Hasil */}
        <ArchitecturePreview />

        {/* Paket terpilih */}
        <SelectedPlanCard packageId={packageId} />

        <TrustStrip />

        {/* Mini FAQ */}
        <details className="bg-white rounded-2xl border border-gray-100 p-4">
          <summary className="text-sm font-semibold text-gray-700 cursor-pointer flex items-center justify-between">
            Bagaimana cara kerja Free Trial 7 Hari?
            <ChevronDown size={16} className="text-gray-400" aria-hidden />
          </summary>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Selama 7 hari pertama, kamu tidak dikenakan biaya apapun (Rp 0). Tim arsitek langsung menyiapkan workspace tim kamu. Sebelum masa trial berakhir, kamu bisa membayar tagihan langganan bulanan atau semesteran lewat halaman Lacak Pesanan.
          </p>
        </details>

        {/* Sticky CTA */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 -mx-4 px-4 py-3 -mb-6">
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            {effectiveTrial ? (
              <span className="flex items-center justify-center gap-2">
                <Sparkles size={16} aria-hidden />
                Aktifkan 7 Hari Free Trial — Rp 0
              </span>
            ) : (
              'Lanjut ke Pembayaran Langganan'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ArchitecturePreview() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-primary-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
            <Image size={12} className="text-white" aria-hidden />
          </div>
          <span className="text-sm font-semibold text-white">Pratinjau Hasil Arsitektur</span>
        </div>
        <Badge variant="success">Siap Pakai</Badge>
      </div>
      <div className="p-4">
        <div className="bg-gray-100 rounded-xl h-32 flex items-center justify-center mb-4" aria-hidden="true">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-xl mx-auto mb-2 flex items-center justify-center">
              <Settings2 size={20} className="text-primary-600" aria-hidden />
            </div>
            <p className="text-xs text-gray-400">Blueprint Workspace Notion + Drive otomatis terstruktur dengan hak akses spesifik.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { title: 'Sprint Kanban', desc: 'Task distribution' },
            { title: 'SOP & Database', desc: 'Role-based access' },
          ].map((item) => (
            <div key={item.title} className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Settings2 size={12} className="text-primary-600" aria-hidden />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-700">{item.title}</div>
                <div className="text-xs text-gray-400">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
