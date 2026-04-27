/**
 * Unit tests — webhook idempotency
 *
 * Verifies that processing the same payment event twice does NOT
 * double-activate the membership or mutate the paidAt timestamp.
 *
 * Run with: npm test
 */

import os from 'os';
import path from 'path';
import fs from 'fs';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shegymz-idempotent-'));
process.env.PAYMENTS_DATA_DIR = tmpDir;
process.env.NEXT_PUBLIC_SUBSCRIPTION_AMOUNT = '399';

import { paymentStore } from '../payment-store';
import type { PaymentRecord } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`  ✓ ${message}`);
}

function makePendingRecord(providerRef: string): PaymentRecord {
  return {
    id: `pay_idem_${providerRef}`,
    userId: 'member@example.com',
    planId: 'monthly',
    provider: 'paystack',
    providerReference: providerRef,
    amount: 39900,
    currency: 'ZAR',
    status: 'pending',
    createdAt: new Date().toISOString(),
    metadata: { name: 'Member', email: 'member@example.com', phone: '0700000000' },
  };
}

/** Simulate the activation logic used in the Paystack webhook handler */
function simulateWebhookActivation(
  providerRef: string,
  paidAt: string,
): { activated: boolean; skipped: boolean } {
  if (paymentStore.alreadyActivated(providerRef)) {
    return { activated: false, skipped: true };
  }

  const record = paymentStore.findByProviderReference(providerRef);
  if (!record) return { activated: false, skipped: false };

  paymentStore.update(record.id, { status: 'paid', paidAt });
  return { activated: true, skipped: false };
}

// ── Test: first activation succeeds ───────────────────────────────────────
function testFirstActivation() {
  console.log('\n[test] First webhook activation');
  const ref = 'cht_idem_001';
  paymentStore.create(makePendingRecord(ref));

  const result = simulateWebhookActivation(ref, '2026-02-28T10:00:00.000Z');
  assert(result.activated === true, 'first activation returns activated=true');
  assert(result.skipped === false, 'first activation does not skip');

  const record = paymentStore.findByProviderReference(ref)!;
  assert(record.status === 'paid', 'status set to paid');
  assert(record.paidAt === '2026-02-28T10:00:00.000Z', 'paidAt set correctly');
}

// ── Test: duplicate webhook is idempotent ──────────────────────────────────
function testDuplicateWebhookIsIgnored() {
  console.log('\n[test] Duplicate webhook is idempotent');
  const ref = 'cht_idem_002';
  paymentStore.create(makePendingRecord(ref));

  // First event
  simulateWebhookActivation(ref, '2026-02-28T10:00:00.000Z');

  // Second event (duplicate, different timestamp)
  const result2 = simulateWebhookActivation(ref, '2026-02-28T10:05:00.000Z');
  assert(result2.activated === false, 'second activation returns activated=false');
  assert(result2.skipped === true, 'second activation is skipped');

  const record = paymentStore.findByProviderReference(ref)!;
  // paidAt must NOT be overwritten with the second timestamp
  assert(record.paidAt === '2026-02-28T10:00:00.000Z', 'paidAt unchanged after duplicate event');
}

// ── Test: failed payment does not block a fresh attempt ───────────────────
function testFailedRecordDoesNotBlock() {
  console.log('\n[test] Failed record does not block new checkout');
  const ref = 'cht_idem_003';
  const rec = makePendingRecord(ref);
  paymentStore.create(rec);
  paymentStore.update(rec.id, { status: 'failed' });

  // A failed payment should NOT be seen as already activated
  assert(!paymentStore.alreadyActivated(ref), 'failed payment is not treated as activated');
}

// ── Test: cancelled record does not block ─────────────────────────────────
function testCancelledRecordDoesNotBlock() {
  console.log('\n[test] Cancelled record does not block new checkout');
  const ref = 'cht_idem_004';
  const rec = makePendingRecord(ref);
  paymentStore.create(rec);
  paymentStore.update(rec.id, { status: 'cancelled' });

  assert(!paymentStore.alreadyActivated(ref), 'cancelled payment is not treated as activated');
}

// ── Run all tests ──────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

const tests = [
  testFirstActivation,
  testDuplicateWebhookIsIgnored,
  testFailedRecordDoesNotBlock,
  testCancelledRecordDoesNotBlock,
];

console.log('Running webhook idempotency tests…\n');
for (const t of tests) {
  try {
    t();
    passed++;
  } catch (err) {
    console.error(`  ✗ ${(err as Error).message}`);
    failed++;
  }
}

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
