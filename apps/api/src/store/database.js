import pg from 'pg';
import bcrypt from 'bcryptjs';
import { getPackageById, ORDER_STATUSES } from '@atur-in/shared';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.warn('[db] WARNING: DATABASE_URL tidak ditemukan di environment variables!');
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL?.includes('supabase.com') ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

/**
 * Normalisasi row `orders` dari PostgreSQL supaya kompatibel dengan:
 * 1. Halaman Publik / Portal (camelCase / bahasa Indonesia: packageId, nomorReferensi, totalTagihan, dibuatPada, customer, statusLogs, isTrial, trialEndsAt, billingCycle, recurringTotal)
 * 2. Halaman Admin (snake_case: ref_number, package_id, total, created_at, name, email, whatsapp, group_name)
 */
export function formatOrder(row, logs = null, payments = null) {
  if (!row) return null;

  const pkg = getPackageById(row.package_id);
  const createdAtIso = row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at;
  const updatedAtIso = row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at;
  const trialEndsAtIso = row.trial_ends_at instanceof Date ? row.trial_ends_at.toISOString() : (row.trial_ends_at ?? null);
  const subEndsAtIso = row.subscription_ends_at instanceof Date ? row.subscription_ends_at.toISOString() : (row.subscription_ends_at ?? null);

  const formattedLogs = Array.isArray(logs)
    ? logs.map((l) => {
        const logCreated = l.created_at instanceof Date ? l.created_at.toISOString() : l.created_at;
        return {
          ...l,
          orderId: l.order_id,
          catatan: l.note,
          diperbuatPada: logCreated,
          created_at: logCreated,
        };
      })
    : undefined;

  const formattedPayments = Array.isArray(payments)
    ? payments.map(formatPayment)
    : undefined;

  return {
    ...row,
    created_at: createdAtIso,
    updated_at: updatedAtIso,
    trial_ends_at: trialEndsAtIso,
    subscription_ends_at: subEndsAtIso,

    // CamelCase & Indonesian properties for public frontend
    nomorReferensi: `#${row.ref_number}`,
    packageId: row.package_id,
    package: pkg,
    billingCycle: row.billing_cycle ?? 'monthly',
    isTrial: Boolean(row.is_trial),
    trialEndsAt: trialEndsAtIso,
    subscriptionEndsAt: subEndsAtIso,
    recurringTotal: Number(row.recurring_total ?? row.total ?? 0),
    total: Number(row.total ?? 0),
    totalTagihan: Number(row.total ?? 0),
    metodePembayaran: row.payment_method ?? formattedPayments?.[0]?.method ?? 'qris',
    jenisKebutuhan: row.need_type,
    jumlahAnggota: row.member_count,
    deskripsiKebutuhan: row.description,
    urlDokumenReferensi: row.doc_url,
    dibuatPada: createdAtIso,
    accessToken: row.access_token,
    customer: {
      id: row.user_id ?? `cust-${row.id}`,
      namaLengkap: row.name,
      email: row.email,
      noWhatsapp: row.whatsapp,
      namaKelompok: row.group_name,
    },
    ...(formattedLogs ? { statusLogs: formattedLogs } : {}),
    ...(formattedPayments ? { payments: formattedPayments } : {}),
  };
}

export function formatPayment(p) {
  if (!p) return null;
  const createdAtIso = p.created_at instanceof Date ? p.created_at.toISOString() : p.created_at;
  const expiresAtIso = p.expires_at instanceof Date ? p.expires_at.toISOString() : p.expires_at;
  const paidAtIso = p.paid_at instanceof Date ? p.paid_at.toISOString() : (p.paid_at ?? null);

  return {
    ...p,
    created_at: createdAtIso,
    expires_at: expiresAtIso,
    paid_at: paidAtIso,
    orderId: p.order_id,
    metode: p.method,
    nomorTagihan: p.bill_number,
    qrPayload: p.qr_payload,
    vaNumber: p.va_number,
    expiresAt: expiresAtIso,
    paidAt: paidAtIso,
  };
}

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          TEXT PRIMARY KEY,
        email       TEXT UNIQUE NOT NULL,
        password    TEXT NOT NULL,
        name        TEXT NOT NULL,
        role        TEXT NOT NULL DEFAULT 'user',
        is_active   INTEGER NOT NULL DEFAULT 1,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash  TEXT NOT NULL,
        device_info TEXT,
        expires_at  TIMESTAMPTZ NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id                    TEXT PRIMARY KEY,
        ref_number            TEXT UNIQUE NOT NULL,
        user_id               TEXT REFERENCES users(id) ON DELETE SET NULL,
        package_id            TEXT NOT NULL,
        billing_cycle         TEXT NOT NULL DEFAULT 'monthly',
        is_trial              BOOLEAN NOT NULL DEFAULT FALSE,
        trial_ends_at         TIMESTAMPTZ,
        subscription_ends_at  TIMESTAMPTZ,
        recurring_total       INTEGER NOT NULL DEFAULT 0,
        name                  TEXT NOT NULL,
        email                 TEXT NOT NULL,
        whatsapp              TEXT NOT NULL,
        group_name            TEXT NOT NULL,
        need_type             TEXT,
        member_count          TEXT,
        description           TEXT,
        doc_url               TEXT,
        status                TEXT NOT NULL DEFAULT 'menunggu_pembayaran',
        total                 INTEGER NOT NULL,
        payment_method        TEXT DEFAULT 'qris',
        access_token          TEXT,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id            TEXT PRIMARY KEY,
        order_id      TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        method        TEXT NOT NULL,
        bill_number   TEXT NOT NULL,
        status        TEXT NOT NULL DEFAULT 'pending',
        qr_payload    TEXT,
        va_number     TEXT,
        amount        INTEGER,
        expires_at    TIMESTAMPTZ NOT NULL,
        paid_at       TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS order_logs (
        id          TEXT PRIMARY KEY,
        order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        status      TEXT NOT NULL,
        note        TEXT,
        changed_by  TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS leads (
        id              TEXT PRIMARY KEY,
        name            TEXT NOT NULL,
        whatsapp        TEXT NOT NULL,
        group_name      TEXT NOT NULL,
        need_type       TEXT,
        member_estimate TEXT,
        note            TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS otp_requests (
        request_id      TEXT PRIMARY KEY,
        no_whatsapp     TEXT NOT NULL,
        nomor_referensi TEXT,
        otp             TEXT NOT NULL,
        verified        BOOLEAN NOT NULL DEFAULT FALSE,
        expires_at      TIMESTAMPTZ NOT NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS workspaces (
        id              TEXT PRIMARY KEY,
        order_id        TEXT UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        title           TEXT NOT NULL,
        icon            TEXT NOT NULL DEFAULT '🚀',
        cover_gradient  TEXT NOT NULL DEFAULT 'from-indigo-600 via-primary-600 to-purple-600',
        divisions_json  JSONB NOT NULL DEFAULT '[]'::jsonb,
        pages_json      JSONB NOT NULL DEFAULT '[]'::jsonb,
        tasks_json      JSONB NOT NULL DEFAULT '[]'::jsonb,
        members_json    JSONB NOT NULL DEFAULT '[]'::jsonb,
        links_json      JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Pastikan kolom baru tetap ada jika tabel orders/workspaces sudah pernah dibuat sebelumnya
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_trial BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS recurring_total INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'qris';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS access_token TEXT;
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount INTEGER;
      ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS divisions_json JSONB NOT NULL DEFAULT '[]'::jsonb;
    `);

    await seedAdmin(client);
    await seedSampleOrder(client);

    console.log('[db] Connected to Supabase PostgreSQL & schema verified.');
  } finally {
    client.release();
  }
}

async function seedAdmin(client) {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@atur-in.id').toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? 'Admin1234!';
  const name = process.env.ADMIN_NAME ?? 'Super Admin';

  const { rows } = await client.query('SELECT id FROM users WHERE email = $1', [email]);
  if (rows.length > 0) return;

  const hash = await bcrypt.hash(password, 12);
  const id = `admin-${Date.now()}`;

  await client.query(
    `INSERT INTO users (id, email, password, name, role, is_active)
     VALUES ($1, $2, $3, $4, 'superadmin', 1)`,
    [id, email, hash, name]
  );

  console.log(`[db] Admin seeded in Supabase: ${email}`);
}

export async function seedSampleOrder(client = pool) {
  const ref = 'DWA-2026-0001';
  const { rows } = await client.query('SELECT id FROM orders WHERE ref_number = $1 OR id = $1', [ref]);
  if (rows.length === 0) {
    const now = Date.now();
    const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();
    const onePointNineDaysAgo = new Date(now - 1.9 * 24 * 60 * 60 * 1000).toISOString();
    const onePointEightDaysAgo = new Date(now - 1.8 * 24 * 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString();
    const subEnds = new Date(now + 28 * 24 * 60 * 60 * 1000).toISOString();

    await client.query(
      `INSERT INTO orders (
        id, ref_number, user_id, package_id, billing_cycle, is_trial, trial_ends_at, subscription_ends_at,
        recurring_total, name, email, whatsapp, group_name, need_type, member_count, description,
        doc_url, status, total, payment_method, access_token, created_at, updated_at
      ) VALUES (
        $1, $2, NULL, 'custom', 'monthly', FALSE, NULL, $3,
        25000, 'Budi Pratama', 'budi.pratama@techteam.id', '81298451230',
        'AI Research Hub & Project Labs', 'tugas_kelompok', '6-15',
        'Workspace untuk kelompok skripsi & riset 8 orang.', NULL, $4, 25000, 'qris', 'seed-token-001', $5, $6
      )`,
      [ref, ref, subEnds, ORDER_STATUSES.PROSES_SETUP, twoDaysAgo, oneDayAgo]
    );

    const logs = [
      ['log-seed-1', ref, ORDER_STATUSES.MENUNGGU_PEMBAYARAN, 'Pesanan dibuat.', 'system', twoDaysAgo],
      ['log-seed-2', ref, ORDER_STATUSES.DIBAYAR, 'Pembayaran QRIS diterima.', 'system', onePointNineDaysAgo],
      ['log-seed-3', ref, ORDER_STATUSES.DIVERIFIKASI, 'Pembayaran diverifikasi otomatis.', 'system', onePointEightDaysAgo],
      ['log-seed-4', ref, ORDER_STATUSES.PROSES_SETUP, 'Tim arsitek mulai mengerjakan workspace.', 'admin@atur-in.id', oneDayAgo],
    ];

    for (const l of logs) {
      await client.query(
        `INSERT INTO order_logs (id, order_id, status, note, changed_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
        l
      );
    }
    console.log(`[db] Sample order seeded in Supabase: #${ref}`);
  }

  // Seed 2nd prototype scenario for Kepanitiaan & Organisasi
  const refEvent = 'DWA-2026-0002';
  const { rows: eventRows } = await client.query('SELECT id FROM orders WHERE ref_number = $1 OR id = $1', [refEvent]);
  if (eventRows.length === 0) {
    const nowIso = new Date().toISOString();
    const subEnds = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await client.query(
      `INSERT INTO orders (
        id, ref_number, user_id, package_id, billing_cycle, is_trial, trial_ends_at, subscription_ends_at,
        recurring_total, name, email, whatsapp, group_name, need_type, member_count, description,
        doc_url, status, total, payment_method, access_token, created_at, updated_at
      ) VALUES (
        $1, $2, NULL, 'organisasi', 'monthly', FALSE, NULL, $3,
        100000, 'Raka Aditya', 'raka.aditya@bem.ac.id', '81298451231',
        'Panitia Dies Natalis & Festival Kampus 2026', 'kepanitiaan', '30+',
        'Ruang kerja multi-divisi (BPH, Acara, Humas & Sponsor, Logistik & Pubdok).', NULL, $4, 100000, 'qris', 'seed-token-002', $5, $6
      ) ON CONFLICT (ref_number) DO NOTHING`,
      [refEvent, refEvent, subEnds, ORDER_STATUSES.PROSES_SETUP, nowIso, nowIso]
    );
  }
}

export default pool;
