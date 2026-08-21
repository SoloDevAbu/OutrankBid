import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/checkout", "/customer-portal", "/pricing"],
      },
    ],
    sitemap: "https://outrankbid.com/sitemap.xml",
  }
}
