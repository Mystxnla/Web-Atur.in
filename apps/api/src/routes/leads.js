import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../store/db.js';

const router = Router();

router.post('/', (req, res) => {
  const { namaPic, noWhatsapp, namaKelompok, jenisKebutuhan, estimasiAnggota, catatan } = req.body;

  if (!namaPic || !noWhatsapp || !namaKelompok) {
    return res.status(400).json({ error: 'Nama, WhatsApp, dan nama kelompok wajib diisi.' });
  }

  const lead = {
    id: nanoid(),
    namaPic,
    noWhatsapp: noWhatsapp.replace(/\D/g, '').replace(/^0/, '').replace(/^62/, ''),
    namaKelompok,
    jenisKebutuhan,
    estimasiAnggota,
    catatan,
    dibuatPada: new Date().toISOString(),
  };

  db.leads.push(lead);
  console.log(`[LEAD] New lead from ${namaPic} (${namaKelompok})`);

  res.status(201).json({ success: true, message: 'Terima kasih! Tim kami akan menghubungi kamu segera.' });
});

export default router;
