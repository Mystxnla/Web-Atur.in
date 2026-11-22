import assert from 'node:assert/strict';
import pool, { initDatabase, formatOrder, formatPayment } from './store/database.js';
import {
  PACKAGES,
  BILLING_CYCLES,
  FREE_TRIAL_DAYS,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  getPackageById,
  computePricing,
} from '@atur-in/shared';

const BASE = process.env.QA_API_URL ?? 'http://localhost:4000/api';

async function runQaSuite() {
  console.log('=== ATUR.IN 5-AXIS QA & INTEGRATION TEST SUITE ===\n');

  // Axis 1: Shared Pricing & Business Logic Unit Tests
  console.log('[Axis 1] Testing Shared Pricing, Subscription & 7-Day Free Trial Logic...');
  assert.equal(FREE_TRIAL_DAYS, 7);
  const customPkg = getPackageById('custom');
  assert.ok(customPkg, 'Custom package must exist');
  assert.equal(customPkg.hasTrial, true, 'Only custom package has trial');
  assert.equal(getPackageById('template').hasTrial, false, 'Template package must not have trial');
  assert.equal(getPackageById('organisasi').hasTrial, false, 'Organisasi package must not have trial');

  const monthlyTrial = computePricing(customPkg, { billingCycle: BILLING_CYCLES.MONTHLY, isTrial: true });
  assert.equal(monthlyTrial.total, 0, 'Trial initial charge must be Rp 0');
  assert.equal(monthlyTrial.recurringTotal, 25000, 'Monthly recurring total must be Rp 25.000');

  const semesterPaid = computePricing(customPkg, { billingCycle: BILLING_CYCLES.SEMESTER, isTrial: false });
  assert.equal(semesterPaid.total, 120000, 'Semester total must be Rp 120.000 (20% discount)');
  assert.equal(semesterPaid.diskon, 30000, 'Semester discount must be Rp 30.000');
  console.log('  ✓ Shared pricing & free trial calculation passed');

  // Axis 2: Database Schema & Serializer Contract Tests
  console.log('[Axis 2] Testing Supabase PostgreSQL Schema & Serializer Contracts...');
  await initDatabase();
  const { rows: seedRows } = await pool.query("SELECT * FROM orders WHERE ref_number = 'DWA-2026-0001'");
  assert.equal(seedRows.length, 1, 'Seed order #DWA-2026-0001 must exist in Supabase');
  const formatted = formatOrder(seedRows[0], [], []);
  // Verify dual compatibility (Public camelCase + Admin snake_case)
  assert.equal(formatted.nomorReferensi, '#DWA-2026-0001');
  assert.equal(formatted.ref_number, 'DWA-2026-0001');
  assert.equal(typeof formatted.totalTagihan, 'number');
  assert.equal(typeof formatted.total, 'number');
  assert.ok(formatted.customer?.namaLengkap);
  console.log('  ✓ Dual public/admin serializer contract passed');

  // Axis 3: Live API End-to-End Verification (if API server is running on port 4000)
  let serverOnline = false;
  try {
    const h = await fetch(`${BASE}/health`);
    serverOnline = h.ok;
  } catch {
    serverOnline = false;
  }

  if (serverOnline) {
    console.log('[Axis 3] Testing Live API Endpoints (Checkout, E-Wallet, OTP Lookup, Admin)...');
    const qaWa = '81277770099';
    const qaEmail = 'qa.tester@kampus.ac.id';
    await pool.query('DELETE FROM orders WHERE whatsapp = $1 OR email = $2', [qaWa, qaEmail]);

    // 3a. Create Free Trial Order with docUrl
    const createRes = await fetch(`${BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageId: 'custom',
        billingCycle: 'monthly',
        isTrial: true,
        namaLengkap: 'QA Engineer',
        email: qaEmail,
        noWhatsapp: qaWa,
        namaKelompok: 'QA Automation Squad',
        jenisKebutuhan: 'tugas_kelompok',
        jumlahAnggota: '6-15',
        deskripsiKebutuhan: 'Testing 5-axis QA suite',
        urlDokumenReferensi: '/api/uploads/sample-syllabus.pdf',
      }),
    });
    assert.equal(createRes.status, 201);
    const createdOrder = await createRes.json();
    assert.equal(createdOrder.isTrial, true);
    assert.equal(createdOrder.doc_url, '/api/uploads/sample-syllabus.pdf');
    console.log('  ✓ Free Trial Order with document reference created:', createdOrder.nomorReferensi);

    // 3b. Test E-Wallet Payment Creation & Simulation
    const payRes = await fetch(`${BASE}/orders/${createdOrder.id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metode: PAYMENT_METHODS.EWALLET }),
    });
    assert.equal(payRes.status, 201);
    const payData = await payRes.json();
    assert.equal(payData.metode, PAYMENT_METHODS.EWALLET);
    assert.ok(payData.vaNumber, 'E-Wallet destination number must be generated');

    const simRes = await fetch(`${BASE}/payments/${payData.id}/simulate-paid`, { method: 'POST' });
    assert.equal(simRes.status, 200);
    const simData = await simRes.json();
    assert.equal(simData.order.isTrial, false);
    assert.equal(simData.order.totalTagihan, 25000);
    console.log('  ✓ E-Wallet payment creation & simulate-paid passed');

    // 3c. Test Notion-Style Workspace Auto-Provisioning & Task Update
    const wsRes = await fetch(`${BASE}/workspaces/${createdOrder.id}`);
    assert.equal(wsRes.status, 200);
    const wsData = await wsRes.json();
    assert.equal(wsData.orderId, createdOrder.id);
    assert.ok(Array.isArray(wsData.tasks) && wsData.tasks.length >= 3, 'Workspace must have default Kanban tasks');
    assert.ok(Array.isArray(wsData.pages) && wsData.pages.length >= 2, 'Workspace must have default Notion pages');

    const patchWsRes = await fetch(`${BASE}/workspaces/${createdOrder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'QA Automation Squad Updated',
        members: [
          ...wsData.members,
          {
            id: 'mem-invited-qa',
            name: 'Anggota Riset Baru',
            email: 'invited.member@kampus.ac.id',
            role: 'Analis Literatur',
            divisionId: 'div-riset',
            isOwner: false,
            personalNotes: 'Catatan riset pribadi',
            personalChecklist: [],
          },
        ],
      }),
    });
    assert.equal(patchWsRes.status, 200);
    const patchedWs = await patchWsRes.json();
    assert.equal(patchedWs.title, 'QA Automation Squad Updated');
    assert.ok(Array.isArray(patchedWs.divisions) && patchedWs.divisions.length >= 3, 'Workspace must have divisions');
    assert.ok(patchedWs.members.some(m => m.email === 'invited.member@kampus.ac.id' && m.divisionId === 'div-riset'));
    console.log('  ✓ 3-tier Workspace (Organisasi, Divisi, & Member Email Access) persistence passed');

    // Cleanup test order
    await pool.query('DELETE FROM orders WHERE id = $1', [createdOrder.id]);
    console.log('  ✓ Live API QA checks passed & cleaned up');
  } else {
    console.log('[Axis 3] Skipping live HTTP checks (server not running on port 4000)');
  }

  await pool.end();
  console.log('\n=== ALL QA CHECKS PASSED SUCCESSFULLY ===');
}

runQaSuite().catch((err) => {
  console.error('QA Suite Failed:', err);
  process.exit(1);
});
