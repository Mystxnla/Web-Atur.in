import { Router } from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter(req, file, cb) {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format tidak didukung. Gunakan PDF, PNG, atau JPG.'));
    }
  },
});

// POST /api/upload/reference
router.post('/reference', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File tidak ditemukan.' });

  const fakeUrl = `/api/uploads/${nanoid()}-${req.file.originalname}`;
  res.json({ url: fakeUrl, originalName: req.file.originalname, size: req.file.size });
});

export default router;
