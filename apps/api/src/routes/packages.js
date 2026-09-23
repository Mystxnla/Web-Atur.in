import { Router } from 'express';
import { PACKAGES } from '@atur-in/shared';

const router = Router();

router.get('/', (req, res) => {
  const enablePro = process.env.ENABLE_PRO_PACKAGE === 'true';
  const list = enablePro ? PACKAGES : PACKAGES.filter((p) => !p.proOnly);
  res.json(list);
});

router.get('/:id', (req, res) => {
  const pkg = PACKAGES.find((p) => p.id === req.params.id);
  if (!pkg) return res.status(404).json({ error: 'Paket tidak ditemukan.' });
  res.json(pkg);
});

export default router;
