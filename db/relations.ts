/**
 * Runtime relational query definitions.
 *
 * This file is intentionally separate from schema.ts.
 * drizzle-kit (generate/migrate/push) only reads schema.ts — it does NOT
 * understand the new defineRelations API and will crash if it encounters it.
 * Keeping relations here lets drizzle-kit work cleanly while still giving
 * the application typed db.query.* access.
 */
import { defineRelations } from "drizzle-orm"
import {
  categories,
  startups,
  bids,
  payments,
  clickEvents,
} from "./schema"

export const relations = defineRelations(
  { categories, startups, bids, payments, clickEvents },
  (helpers) => ({
    categories: {
      startups: helpers.many.startups(),
    },
    startups: {
      category: helpers.one.categories({
        from: helpers.startups.categoryId,
        to: helpers.categories.id,
      }),
      bids: helpers.many.bids(),
      clickEvents: helpers.many.clickEvents(),
    },
    bids: {
      startup: helpers.one.startups({
        from: helpers.bids.startupId,
        to: helpers.startups.id,
      }),
      payment: helpers.one.payments({
        from: helpers.bids.id,
        to: helpers.payments.bidId,
      }),
    },
    payments: {
      bid: helpers.one.bids({
        from: helpers.payments.bidId,
        to: helpers.bids.id,
      }),
    },
    clickEvents: {
      startup: helpers.one.startups({
        from: helpers.clickEvents.startupId,
        to: helpers.startups.id,
      }),
    },
  })
)
