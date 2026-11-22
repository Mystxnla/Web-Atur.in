---
name: ux-onboarding-flow
description: 'Standar UX & User Flow untuk Atur.in. Memastikan alur pengguna jelas, ringkas, bebas duplikasi tombol, dan cepat mencapai aha moment (Minimum Path to Value).'
---

# UX & Onboarding Flow Standards (Atur.in)

Gunakan skill ini setiap kali membangun, merapikan, atau mengevaluasi halaman landing, checkout, portal masuk, atau ruang kerja (workspace) di Atur.in.

## 1. Minimum Path to Value (MPTV)
- Pangkas setiap langkah, layar, atau field yang tidak wajib sebelum pengguna merasakan nilai inti produk.
- **Aturan Checkout**: Maksimal 5 field wajib dalam 1 kartu utama. Field opsional (jumlah anggota detail, deskripsi panjang, upload dokumen) harus disembunyikan di dalam accordion *"Detail tambahan (opsional)"* dengan nilai default yang aman.
- **Aturan Stepper**: Jumlah langkah pada Stepper wajib akurat sesuai paket yang dipilih (mis. Free Trial 7 Hari = 3 langkah: `Pilih Paket → Info Tim → Workspace Aktif`, tanpa menampilkan langkah Bayar).

## 2. Hick's Law & Progressive Disclosure
- Maksimal **3–4 pilihan utama** di setiap titik keputusan (decision point).
- Jangan menumpuk dua formulir yang bersaing di satu halaman (mis. form konsultasi panjang di halaman landing yang sudah memiliki tabel harga/checkout — gunakan kartu **Contact Person** langsung via WhatsApp/Email).
- Sembunyikan opsi lanjutan (login manual, lacak OTP, reset templat) di bawah aksi sekunder agar layar utama tetap tenang dan fokus.

## 3. One Source of Navigation (Anti-Redundancy)
- Setiap kontrol navigasi (mis. ganti identitas anggota, ganti divisi, ganti lingkup kerja) hanya boleh muncul **di satu tempat yang konsisten** (Sidebar).
- Dilarang menduplikasi bar switcher atau filter pill di atas kanvas utama jika navigasi yang sama sudah tersedia di Sidebar.

## 4. Endowed Progress & Guided First-Run
- Saat pengguna pertama kali masuk ke Workspace, tampilkan panduan cepat 3 langkah yang ringkas dan dapat ditutup (*dismissible*):
  1. Langkah pertama otomatis tercentang (*Endowed Progress*, mis. "Workspace siap digunakan").
  2. Dua langkah berikutnya tercentang otomatis saat pengguna melakukan aksi nyata di UI (memindahkan 1 tugas Kanban, berpindah ke Ruang Divisi / Meja Kerja Pribadi).

## 5. Konsistensi Bahasa & Palet Brand
- Gunakan 100% Bahasa Indonesia yang natural dan ringkas di seluruh label, header, dan tombol (hindari istilah Inggris campur seperti "Order Lookup").
- Jaga konsistensi palet brand Atur.in (`primary-600` Indigo `#4f46e5`, `primary-50` `#eef2ff`, permukaan netral `bg-white` / `bg-gray-50` / `border-gray-200`, tanpa emoji UI dan tanpa gradien ungu-pink).
