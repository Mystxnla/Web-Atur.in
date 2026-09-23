/**
 * In-memory store for the mock API.
 * All data lives here during the session.
 */

import { ORDER_STATUSES } from '@atur-in/shared';

// --- seed data ---
const now = new Date();
const ref = 'DWA-2026-0001';

export const db = {
  packages: [], // populated from shared pricing at startup

  orders: [
    {
      id: ref,
      nomorReferensi: `#${ref}`,
      customerId: 'cust-seed-1',
      packageId: 'custom',
      jenisKebutuhan: 'tugas_kelompok',
      jumlahAnggota: '6-15',
      deskripsiKebutuhan: 'Workspace untuk kelompok skripsi 8 orang.',
      urlDokumenReferensi: null,
      status: ORDER_STATUSES.PROSES_SETUP,
      totalTagihan: 129000,
      metodePembayaran: 'qris',
      dibuatPada: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      accessToken: 'seed-token-001',
    },
  ],

  customers: [
    {
      id: 'cust-seed-1',
      namaLengkap: 'Budi Pratama',
      email: 'budi.pratama@techteam.id',
      noWhatsapp: '81298451230',
      namaKelompok: 'AI Research Hub & Project Labs',
      dibuatPada: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],

  payments: [],

  leads: [],

  otpRequests: [],

  statusLogs: [
    {
      id: 'log-seed-1',
      orderId: ref,
      status: ORDER_STATUSES.MENUNGGU_PEMBAYARAN,
      catatan: 'Pesanan dibuat.',
      diperbuatPada: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-seed-2',
      orderId: ref,
      status: ORDER_STATUSES.DIBAYAR,
      catatan: 'Pembayaran QRIS diterima.',
      diperbuatPada: new Date(now.getTime() - 1.9 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-seed-3',
      orderId: ref,
      status: ORDER_STATUSES.DIVERIFIKASI,
      catatan: 'Pembayaran diverifikasi otomatis.',
      diperbuatPada: new Date(now.getTime() - 1.8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-seed-4',
      orderId: ref,
      status: ORDER_STATUSES.PROSES_SETUP,
      catatan: 'Tim arsitek mulai mengerjakan workspace.',
      diperbuatPada: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};
