import { Router } from 'express';
import { nanoid } from 'nanoid';
import pool from '../store/database.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { namaPic, noWhatsapp, namaKelompok, jenisKebutuhan, estimasiAnggota, catatan } = req.body;

    if (!namaPic || !noWhatsapp || !namaKelompok) {
      return res.status(400).json({ error: 'Nama, WhatsApp, dan nama kelompok wajib diisi.' });
    }

    const id = `lead-${nanoid(10)}`;
    const normalizedWa = noWhatsapp.replace(/\D/g, '').replace(/^0/, '').replace(/^62/, '');
    const now = new Date().toISOString();

    await pool.query(
      `INSERT INTO leads (id, name, whatsapp, group_name, need_type, member_estimate, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        namaPic,
        normalizedWa,
        namaKelompok,
        jenisKebutuhan ?? null,
        estimasiAnggota ?? null,
        catatan ?? null,
        now,
      ]
    );

    console.log(`[LEAD] New lead saved to Supabase from ${namaPic} (${namaKelompok})`);

    res.status(201).json({
      id,
      success: true,
      message: 'Terima kasih! Tim kami akan menghubungi kamu segera.',
    });
  } catch (err) { next(err); }
});

export default router;
