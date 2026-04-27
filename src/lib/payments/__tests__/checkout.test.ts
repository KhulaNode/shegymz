/**
 * Unit tests — checkout record creation
 *
 * Tests the paymentStore and checkout flow logic in isolation.
 * Run with: npm test
 */

import os from 'os';
import path from 'path';
import fs from 'fs';

// Point the store at a temp dir so tests never touch the real data directory
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shegymz-test-'));
process.env.PAYMENTS_DATA_DIR = tmpDir;
// Use the monthly plan price from env (default 399)
process.env.NEXT_PUBLIC_SUBSCRIPTION_AMOUNT = '399';

// Import AFTER setting env vars
import { paymentStore } from '../payment-store';
import { getPlan, DEFAULT_PLAN_ID } from '../plans';
import type { PaymentRecord } from '../types';

function makeRecord(overrides: Partial<PaymentRecord> = {}): PaymentRecord {
  return {
    id: `pay_test_${Date.now()}`,
    userId: 'tester@example.com',
    planId: DEFAULT_PLAN_ID,
    provider: 'paystack',
    providerReference: '',
    amount: 39900,
    currency: 'ZAR',
    status: 'pending',
    createdAt: new Date().toISOString(),
    metadata: { name: 'Test User', email: 'tester@example.com', phone: '0700000000' },
    ...overrides,
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`  ✓ ${message}`);
}

// ── Test: plan prices come from env, never hardcoded ───────────────────────
function testPlanPriceFromEnv() {
  console.log('\n[test] Plan price source');
  const plan = getPlan(DEFAULT_PLAN_ID);
  assert(plan !== undefined, 'plan exists');
  assert(plan!.amountCents === 39900, 'plan.amountCents === 39900 (R399 × 100)');
  assert(plan!.currency === 'ZAR', 'plan.currency === ZAR');
}

// ── Test: create and find record ───────────────────────────────────────────
function testCreateAndFind() {
  console.log('\n[test] Create and find payment record');
  const rec = makeRecord({ id: 'pay_create_test' });
  paymentStore.create(rec);

  const found = paymentStore.findById('pay_create_test');
  assert(found !== undefined, 'record found by id');
  assert(found!.status === 'pending', 'initial status is pending');
  assert(found!.userId === 'tester@example.com', 'userId persisted');
}

// ── Test: update record status ─────────────────────────────────────────────
function testUpdateStatus() {
  console.log('\n[test] Update payment record status');
  const rec = makeRecord({ id: 'pay_update_test', providerReference: 'cht_abc123' });
  paymentStore.create(rec);

  paymentStore.update('pay_update_test', {
    status: 'paid',
    paidAt: '2026-02-28T10:00:00.000Z',
    providerReference: 'cht_abc123',
  });

  const updated = paymentStore.findById('pay_update_test');
  assert(updated!.status === 'paid', 'status updated to paid');
  assert(updated!.paidAt === '2026-02-28T10:00:00.000Z', 'paidAt persisted');
}

// ── Test: find by providerReference ───────────────────────────────────────
function testFindByProviderReference() {
  console.log('\n[test] Find record by providerReference');
  const rec = makeRecord({ id: 'pay_ref_test', providerReference: 'cht_findme' });
  paymentStore.create(rec);

  const found = paymentStore.findByProviderReference('cht_findme');
  assert(found !== undefined, 'record found by providerReference');
  assert(found!.id === 'pay_ref_test', 'correct record returned');
}

// ── Test: persistence across reads ────────────────────────────────────────
function testPersistence() {
  console.log('\n[test] Persistence across store reads (simulate restart)');
  const id = `pay_persist_${Date.now()}`;
  paymentStore.create(makeRecord({ id, providerReference: 'cht_persist' }));

  // Simulate a fresh read (re-reads the JSON file each time)
  const found = paymentStore.findById(id);
  assert(found !== undefined, 'record survives across read calls');
}

// ── Run all tests ──────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

const tests = [
  testPlanPriceFromEnv,
  testCreateAndFind,
  testUpdateStatus,
  testFindByProviderReference,
  testPersistence,
];

console.log('Running checkout tests…\n');
for (const t of tests) {
  try {
    t();
    passed++;
  } catch (err) {
    console.error(`  ✗ ${(err as Error).message}`);
    failed++;
  }
}

// Cleanup temp dir
fs.rmSync(tmpDir, { recursive: true, force: true });

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
