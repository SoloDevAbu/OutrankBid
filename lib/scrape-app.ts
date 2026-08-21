import https from "https"

export type ScrapedAppInfo = {
  name: string | null
  logoUrl: string | null
}

export async function scrapeAppInfo(url: string): Promise<ScrapedAppInfo> {
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        let data = ""
        res.on("data", (chunk) => {
          data += chunk
        })
        res.on("end", () => {
          // Parse title
          let name: string | null = null
          const titleMatch =
            data.match(/<meta property="og:title" content="([^"]+)"/i) ||
            data.match(/<title>([^<]+)<\/title>/i)

          if (titleMatch) {
            name = titleMatch[1]
              .replace(/ - Apps on Google Play$/i, "")
              .replace(/ App - App Store$/i, "")
              .replace(/ - App Store$/i, "")
              .trim()
          }

          // Parse image
          let logoUrl: string | null = null
          const imageMatch = data.match(
            /<meta property="og:image" content="([^"]+)"/i
          )
          if (imageMatch) {
            logoUrl = imageMatch[1]
          }

          resolve({ name, logoUrl })
        })
      })
      .on("error", (err) => {
        console.error("[scrapeAppInfo] Error fetching URL:", err)
        resolve({ name: null, logoUrl: null })
      })
  })
}
