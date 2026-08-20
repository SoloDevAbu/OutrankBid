import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Eye, MinusCircle, PlusCircle } from "lucide-react"

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] font-sans">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <div className="text-xl font-bold tracking-tight">OutrankBid</div>
        <div className="hidden text-xs font-semibold tracking-widest text-muted-foreground uppercase md:block">
          How it works
        </div>
        <Button className="rounded-none bg-black px-6 font-bold text-white hover:bg-black/90">
          LAUNCH
        </Button>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-8 pb-24 md:px-8">
        {/* Top Stats Pill */}
        <div className="mb-16 flex justify-center">
          <div className="flex items-center gap-4 rounded-full border bg-white px-6 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <div className="flex flex-col">
                <span className="text-sm leading-none font-bold">24</span>
                <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Active
                </span>
              </div>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-sm leading-none font-bold">12k</span>
                <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Visits
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mb-24 grid grid-cols-1 gap-16 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <h1 className="mb-6 text-5xl leading-[1.1] font-black tracking-tighter text-black lg:text-6xl">
              YOUR STARTUP
              <br />
              DESERVES THE
              <br />
              ATTENTION.
            </h1>
            <p className="mb-8 max-w-md text-lg text-muted-foreground">
              The internet's live leaderboard where startups compete for the top
              spot.
            </p>
            <div className="flex w-full max-w-md items-center">
              <Input
                type="text"
                placeholder="Enter your startup URL..."
                className="h-12 rounded-none border-r-0 bg-white focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button className="h-12 rounded-none bg-black px-6 font-bold whitespace-nowrap text-white hover:bg-black/90">
                CLAIM YOUR SPOT <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="overflow-hidden rounded-sm border-2 border-orange-500 bg-white shadow-sm">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 text-xs font-black tracking-widest text-black uppercase">
                  GET #1 SPOT FOR
                </div>
                <div className="flex items-center gap-4">
                  <MinusCircle className="h-6 w-6 cursor-pointer text-black" />
                  <div className="text-6xl font-black tracking-tighter text-orange-500">
                    $240
                  </div>
                  <PlusCircle className="h-6 w-6 cursor-pointer text-black" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-sm bg-white shadow-sm">
              <div className="flex items-center justify-between border-b p-4">
                <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                  LEADERBOARD
                </span>
                <span className="flex items-center gap-1 text-[10px] font-black tracking-widest text-red-500 uppercase">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"></span>{" "}
                  LIVE NOW
                </span>
              </div>
              <CardContent className="p-0">
                <div className="flex flex-col">
                  {/* Leaderboard Item 1 */}
                  <div className="flex items-center justify-between border-b p-4 transition-colors hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-black text-black italic">
                        #1
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-black">
                            Neon
                          </span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-muted-foreground uppercase">
                            DEV INFRA
                          </span>
                        </div>
                        <div className="text-[10px] font-medium text-muted-foreground">
                          40 min ago • 1.2k clicks
                        </div>
                      </div>
                    </div>
                    <span className="text-2xl font-black text-orange-500">
                      $247
                    </span>
                  </div>
                  {/* Leaderboard Item 2 */}
                  <div className="flex items-center justify-between border-b p-4 transition-colors hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-black text-muted-foreground italic">
                        #2
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-black">
                            Cursor
                          </span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-muted-foreground uppercase">
                            AI CODING
                          </span>
                        </div>
                        <div className="text-[10px] font-medium text-muted-foreground">
                          40 min ago • 1.2k clicks
                        </div>
                      </div>
                    </div>
                    <span className="text-2xl font-black text-orange-500">
                      $183
                    </span>
                  </div>
                  {/* Leaderboard Item 3 */}
                  <div className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-black text-muted-foreground italic">
                        #3
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-black">
                            Resend
                          </span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-muted-foreground uppercase">
                            DEV TOOLS
                          </span>
                        </div>
                        <div className="text-[10px] font-medium text-muted-foreground">
                          40 min ago • 1.2k clicks
                        </div>
                      </div>
                    </div>
                    <span className="text-2xl font-black text-orange-500">
                      $129
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="mb-12" />

        {/* Explore Section */}
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <h2 className="text-3xl font-black tracking-tighter text-black">
            EXPLORE
          </h2>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="default"
              className="rounded-full border border-black bg-black px-4 py-1 text-xs font-bold text-white hover:bg-black/90"
            >
              ALL
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full bg-white px-4 py-1 text-xs font-bold text-muted-foreground"
            >
              AI
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full bg-white px-4 py-1 text-xs font-bold tracking-wider text-muted-foreground uppercase"
            >
              DEVELOPER TOOLS
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full bg-white px-4 py-1 text-xs font-bold tracking-wider text-muted-foreground uppercase"
            >
              SAAS
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full bg-white px-4 py-1 text-xs font-bold tracking-wider text-muted-foreground uppercase"
            >
              STARTUPS
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full bg-white px-4 py-1 text-xs font-bold tracking-wider text-muted-foreground uppercase"
            >
              INDIE
            </Badge>
          </div>
        </div>

        {/* Startup List */}
        <div className="flex flex-col">
          {[
            {
              rank: 1,
              name: "Stripe",
              tag: "FINTECH",
              time: "40m ago",
              clicks: "1.2k clicks",
              desc: "The standard for online payments.",
              price: "$450",
            },
            {
              rank: 2,
              name: "Vercel",
              tag: "DEV INFRA",
              time: "40m ago",
              clicks: "1.2k clicks",
              desc: "Next-generation cloud infrastructure.",
              price: "$380",
            },
            {
              rank: 3,
              name: "Linear",
              tag: "PRODUCTIVITY",
              time: "40m ago",
              clicks: "1.2k clicks",
              desc: "A collaborative workspace for high-performance teams.",
              price: "$295",
            },
            {
              rank: 4,
              name: "Figma",
              tag: "DESIGN",
              time: "40m ago",
              clicks: "1.2k clicks",
              desc: "The collaborative interface design tool.",
              price: "$210",
            },
            {
              rank: 5,
              name: "Supabase",
              tag: "BAAS",
              time: "40m ago",
              clicks: "1.2k clicks",
              desc: "The open source Firebase alternative.",
              price: "$180",
            },
          ].map((startup, idx) => (
            <div
              key={startup.rank}
              className="group -mx-4 flex flex-col justify-between rounded-lg border-b px-4 py-6 transition-colors hover:bg-black/5 sm:flex-row sm:items-center"
            >
              <div className="flex items-start gap-6 sm:items-center sm:gap-8">
                <span
                  className={`text-3xl font-black italic sm:text-4xl ${startup.rank === 1 ? "text-black" : "text-muted-foreground"}`}
                >
                  #{startup.rank}
                </span>
                <div className="flex flex-col">
                  <div className="mb-1 flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="text-xl font-bold text-black">
                      {startup.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-muted px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-muted-foreground uppercase"
                    >
                      {startup.tag}
                    </Badge>
                    <div className="hidden items-center gap-3 sm:flex">
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {startup.time}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {startup.clicks}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {startup.desc}
                  </p>
                </div>
              </div>
              <span className="mt-4 origin-right self-end text-2xl font-black text-orange-500 transition-transform group-hover:scale-105 sm:mt-0 sm:self-auto sm:text-3xl">
                {startup.price}
              </span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex flex-col items-center justify-between border-t bg-[#f5f5f5] px-8 py-12 md:flex-row">
        <div className="mb-6 text-lg font-bold tracking-tight text-black md:mb-0">
          OutrankBid
        </div>
        <div className="flex flex-col items-center gap-3 md:items-end">
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-black transition-colors hover:text-black/80"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 fill-current"
                aria-hidden="true"
              >
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"></path>
              </svg>
            </a>
            <a
              href="#"
              className="text-black transition-colors hover:text-black/80"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 fill-current"
                aria-hidden="true"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
          <div className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
            BUILT BY @ABUBAKKAR2502
          </div>
        </div>
      </footer>
    </div>
  )
}
