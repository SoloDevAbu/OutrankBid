import type { MetadataRoute } from "next"
import { eq } from "drizzle-orm"
import { db, startups, categories } from "@/db"

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [startupRows, categoryRows] = await Promise.all([
    db
      .select({ slug: startups.slug, updatedAt: startups.updatedAt })
      .from(startups)
      .where(eq(startups.status, "active")),
    db
      .select({ slug: categories.slug })
      .from(categories)
      .orderBy(categories.name),
  ])

  return [
    {
      url: "https://outrankbid.com",
      changeFrequency: "always",
      priority: 1,
    },
    {
      url: "https://outrankbid.com/how-it-works",
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...categoryRows.map((c) => ({
      url: `https://outrankbid.com/category/${c.slug}`,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
    ...startupRows.map((s) => ({
      url: `https://outrankbid.com/startup/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ]
}
