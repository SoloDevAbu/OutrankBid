/**
 * Transaction helper backed by @neondatabase/serverless Pool (WebSocket mode).
 *
 * The default `db` in db/index.ts uses `neon-http`, which explicitly throws
 * "No transactions support in neon-http driver". Row-level locking (FOR UPDATE)
 * requires a real PG transaction over a persistent connection, so we use a
 * module-level singleton Pool so connections are reused across invocations
 * rather than creating and destroying a new Pool on every webhook call
 * (which would exhaust Neon's connection limit under burst traffic).
 *
 * Usage:
 *   const result = await withTransaction(async (tx) => {
 *     const row = await tx.select(...).from(...).for('update')
 *     // ... more queries inside the same transaction
 *     return row
 *   })
 */
import { Pool } from "@neondatabase/serverless"
import { drizzle, type NeonTransaction } from "drizzle-orm/neon-serverless"
import { relations } from "./relations"
import type { AnyRelations } from "drizzle-orm"

export type Tx = NeonTransaction<typeof relations>

// Singleton pool — reused across all webhook invocations in the same process.
// max:5 keeps us well within Neon's concurrent connection limits.
const _pool = new Pool({ connectionString: process.env.DATABASE_URL!, max: 5 })
const _db = drizzle({ client: _pool, relations })

export async function withTransaction<T>(
  fn: (tx: Tx) => Promise<T>
): Promise<T> {
  return _db.transaction(fn as (tx: NeonTransaction<AnyRelations>) => Promise<T>)
}
