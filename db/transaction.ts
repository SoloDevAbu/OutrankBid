/**
 * Transaction helper backed by @neondatabase/serverless Pool (WebSocket mode).
 *
 * The default `db` in db/index.ts uses `neon-http`, which explicitly throws
 * "No transactions support in neon-http driver". Row-level locking (FOR UPDATE)
 * requires a real PG transaction over a persistent connection, so we create a
 * short-lived Pool here and destroy it afterwards.
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

export async function withTransaction<T>(
  fn: (tx: Tx) => Promise<T>
): Promise<T> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
  try {
    const db = drizzle({ client: pool, relations })
    return await db.transaction(fn as (tx: NeonTransaction<AnyRelations>) => Promise<T>)
  } finally {
    await pool.end()
  }
}
