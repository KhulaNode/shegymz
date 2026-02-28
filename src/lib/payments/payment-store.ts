import fs from 'fs';
import path from 'path';
import type { PaymentRecord } from './types';

/**
 * File-based JSON payment store.
 *
 * All payment records are persisted to PAYMENTS_DATA_DIR/payments.json.
 * Writes are atomic (write to .tmp → rename) to prevent data corruption.
 *
 * This is intentionally simple so it can be backed up with a plain file copy.
 * Replace with a proper database (Prisma/SQLite/Postgres) when the system scales.
 *
 * IMPORTANT: In Docker, mount a named volume to PAYMENTS_DATA_DIR so records
 * survive container restarts. See docker-compose.yml.
 */

function getStorePath(): string {
  const dir = process.env.PAYMENTS_DATA_DIR
    ? path.resolve(process.env.PAYMENTS_DATA_DIR)
    : path.join(process.cwd(), 'data');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return path.join(dir, 'payments.json');
}

function readAll(): PaymentRecord[] {
  const storePath = getStorePath();
  if (!fs.existsSync(storePath)) return [];
  try {
    const content = fs.readFileSync(storePath, 'utf8');
    return JSON.parse(content) as PaymentRecord[];
  } catch {
    console.error('[PaymentStore] Failed to parse payments.json — returning empty list');
    return [];
  }
}

/** Atomic write: write to .tmp then rename, preventing partial/corrupt writes */
function writeAll(records: PaymentRecord[]): void {
  const storePath = getStorePath();
  const tempPath = `${storePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(records, null, 2), 'utf8');
  fs.renameSync(tempPath, storePath);
}

export const paymentStore = {
  create(record: PaymentRecord): PaymentRecord {
    const records = readAll();
    records.push(record);
    writeAll(records);
    return record;
  },

  findById(id: string): PaymentRecord | undefined {
    return readAll().find((r) => r.id === id);
  },

  findByProviderReference(providerReference: string): PaymentRecord | undefined {
    return readAll().find((r) => r.providerReference === providerReference);
  },

  update(id: string, updates: Partial<PaymentRecord>): PaymentRecord | undefined {
    const records = readAll();
    const index = records.findIndex((r) => r.id === id);
    if (index === -1) return undefined;
    records[index] = { ...records[index], ...updates };
    writeAll(records);
    return records[index];
  },

  findByUserId(userId: string): PaymentRecord[] {
    return readAll().filter((r) => r.userId === userId);
  },

  /**
   * Idempotency guard — returns true when a record with this providerReference
   * is already marked 'paid', so webhooks/success-redirects don't double-activate.
   */
  alreadyActivated(providerReference: string): boolean {
    const record = readAll().find((r) => r.providerReference === providerReference);
    return record?.status === 'paid';
  },

  /** Expose raw list for testing/debugging only */
  _readAll: readAll,
};
