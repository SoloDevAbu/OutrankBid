import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core"

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const startupStatusEnum = pgEnum("startup_status", [
  "pending",
  "active",
  "paused",
  "removed",
])

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
])

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------------------------------------------------------------------------
// Startups
// ---------------------------------------------------------------------------

export const startups = pgTable(
  "startups",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Owner identity is stored as an opaque string so this table is not
    // coupled to any particular auth provider. Wire up to Clerk/NextAuth
    // user IDs (or whatever auth system is chosen) in a later phase.
    ownerId: text("owner_id").notNull(),

    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    websiteUrl: text("website_url").notNull(),
    description: text("description"),
    logoUrl: text("logo_url"),

    // Denormalized for the homepage leaderboard. This is the current
    // winning bid amount, in cents. It is derived/updated from the
    // `bids` table by the (not-yet-built) auction logic — never write
    // to it directly from a client request. Rank is always computed
    // by sorting on this column; we do not persist a currentRank.
    currentBid: integer("current_bid").notNull().default(0),

    status: startupStatusEnum("status").notNull().default("pending"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // "active startups ordered by currentBid DESC" — homepage leaderboard
    index("startups_status_current_bid_idx").on(
      table.status,
      table.currentBid.desc()
    ),

    // "active startups filtered by category ordered by currentBid DESC" — category leaderboard
    index("startups_status_category_current_bid_idx").on(
      table.status,
      table.categoryId,
      table.currentBid.desc()
    ),

    // Support lookups/joins by owner and category individually too.
    index("startups_owner_id_idx").on(table.ownerId),
    index("startups_category_id_idx").on(table.categoryId),
  ]
)

// ---------------------------------------------------------------------------
// Bids
// ---------------------------------------------------------------------------

/**
 * Bids are immutable historical records. Never UPDATE a row here to
 * represent a newer bid — always INSERT a new row. "Current" state
 * (currentBid on startups) is derived from the latest/highest row
 * in this table, not stored by mutating old bids.
 */
export const bids = pgTable(
  "bids",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    startupId: uuid("startup_id")
      .notNull()
      .references(() => startups.id, { onDelete: "cascade" }),

    // Bidder identity stored as an opaque string, same auth-agnostic
    // approach as startups.ownerId.
    userId: text("user_id").notNull(),

    // Amount in cents (smallest currency unit) to avoid floating point issues.
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("USD"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("bids_startup_id_idx").on(table.startupId),
    index("bids_user_id_idx").on(table.userId),
    index("bids_created_at_idx").on(table.createdAt),
  ]
)

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // A bid has one payment — enforced with .unique() rather than just an index.
    bidId: uuid("bid_id")
      .notNull()
      .unique()
      .references(() => bids.id, { onDelete: "restrict" }),

    provider: text("provider").notNull(),
    // Payment provider's own id for this payment/charge/session.
    providerPaymentId: text("provider_payment_id").notNull().unique(),

    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("USD"),

    // Status is only ever written server-side from a verified provider
    // event (e.g. a webhook), never from a client request.
    status: paymentStatusEnum("status").notNull().default("pending"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("payments_status_idx").on(table.status)]
)

// ---------------------------------------------------------------------------
// Click events
// ---------------------------------------------------------------------------

export const clickEvents = pgTable(
  "click_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    startupId: uuid("startup_id")
      .notNull()
      .references(() => startups.id, { onDelete: "cascade" }),
    referrer: text("referrer"),
    userAgent: text("user_agent"),

    // Never store a raw IP address. Store a salted hash (e.g. HMAC-SHA256)
    // if you need per-visitor identification for rate limiting/fraud checks.
    ipHash: text("ip_hash"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("click_events_startup_id_idx").on(table.startupId),
    index("click_events_created_at_idx").on(table.createdAt),
  ]
)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert

export type Startup = typeof startups.$inferSelect
export type NewStartup = typeof startups.$inferInsert

export type Bid = typeof bids.$inferSelect
export type NewBid = typeof bids.$inferInsert

export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert

export type ClickEvent = typeof clickEvents.$inferSelect
export type NewClickEvent = typeof clickEvents.$inferInsert
