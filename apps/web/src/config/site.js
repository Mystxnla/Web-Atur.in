export const SITE = {
  name: 'Digital Workspace Architect',
  shortName: 'Atur.in',
  tagline: 'Setup workspace Notion & Trello untuk tim mahasiswa.',
  supportWa: import.meta.env.VITE_SUPPORT_WA ?? '6281200000000',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL ?? 'halo@workspacearchitect.id',
  supportPhone: '+62 812-9845-1230',
  operationalHours: '08.00 – 21.00 WIB',
  ppnRate: parseFloat(import.meta.env.VITE_PPN_RATE ?? '0.11'),
  enableDemoPanel: import.meta.env.VITE_ENABLE_DEMO_PANEL !== 'false',
  showPrototypeBadge: import.meta.env.VITE_SHOW_PROTOTYPE_BADGE !== 'false',
  enableProPackage: import.meta.env.VITE_ENABLE_PRO_PACKAGE === 'true',
};
