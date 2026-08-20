import { db, categories } from "@/db"

export async function GET() {
  try {
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      })
      .from(categories)
      .orderBy(categories.name)

    return Response.json({ categories: rows })
  } catch (error) {
    console.error("[GET /api/categories]", error)
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
