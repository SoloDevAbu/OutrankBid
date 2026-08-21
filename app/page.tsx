"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, Loader2 } from "lucide-react"
import { HomeHeroCta } from "@/components/home-hero-cta"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LeaderboardEntry = {
  rank: number
  name: string
  slug: string
  category: { name: string; slug: string }
  currentBid: number
  currentBidFormatted: string
  clickCount: number
  websiteUrl: string
  description: string | null
  logoUrl: string | null
  createdAt: string
  updatedAt: string
}

type Category = { id: string; name: string; slug: string }

type Stats = { activeCount: number; totalClicks: number }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatClicks(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Page() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<Stats>({ activeCount: 0, totalClicks: 0 })
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loadingBoard, setLoadingBoard] = useState(true)
  const [loadingMeta, setLoadingMeta] = useState(true)

  // Fetch categories + stats once
  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/stats").then((r) => r.json()),
    ])
      .then(([catData, statsData]) => {
        setCategories(catData?.categories ?? [])
        setStats({
          activeCount: statsData?.activeCount ?? 0,
          totalClicks: statsData?.totalClicks ?? 0,
        })
      })
      .catch(console.error)
      .finally(() => setLoadingMeta(false))
  }, [])

  // Fetch leaderboard (re-runs when category filter changes)
  const fetchLeaderboard = useCallback((categorySlug: string | null) => {
    setLoadingBoard(true)
    const url = categorySlug
      ? `/api/leaderboard?category=${categorySlug}`
      : "/api/leaderboard"
    fetch(url)
      .then((r) => r.json())
      .then((data) => setLeaderboard(data?.leaderboard ?? []))
      .catch(console.error)
      .finally(() => setLoadingBoard(false))
  }, [])

  useEffect(() => {
    fetchLeaderboard(activeCategory)
  }, [activeCategory, fetchLeaderboard])

  const top3 = leaderboard.slice(0, 3)

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] font-sans">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-white px-6 py-3">
        <div className="text-lg font-bold tracking-tight">OutrankBid</div>
        <div className="hidden text-[10px] font-semibold tracking-widest text-muted-foreground uppercase md:block">
          How it works
        </div>
        {/* <div className="flex items-center gap-4">
          <Button className="rounded-none bg-black px-6 font-bold text-white hover:bg-black/90">
            LAUNCH
          </Button>
        </div> */}
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-16 md:px-6">
        {/* Top Stats Pill */}
        <div className="mb-12 flex justify-center">
          <div className="flex items-center gap-3 rounded-full border bg-white px-5 py-1.5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <div className="flex space-x-1">
                <span className="text-xs leading-none font-bold">
                  {loadingMeta ? (
                    <span className="inline-block h-3 w-6 animate-pulse rounded bg-muted" />
                  ) : (
                    stats.activeCount
                  )}
                </span>
                <span className="text-[8px] font-medium tracking-wider text-muted-foreground uppercase">
                  Active
                </span>
              </div>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <div className="flex space-x-1">
                <span className="text-xs leading-none font-bold">
                  {loadingMeta ? (
                    <span className="inline-block h-3 w-8 animate-pulse rounded bg-muted" />
                  ) : (
                    formatClicks(stats.totalClicks)
                  )}
                </span>
                <span className="text-[8px] font-medium tracking-wider text-muted-foreground uppercase">
                  Visits
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="flex items-center">
            <HomeHeroCta />
          </div>

          {/* Mini Leaderboard — top 3 from DB */}
          <div className="flex flex-col">
            <Card className="rounded-sm bg-white shadow-sm">
              <div className="flex items-center justify-between border-b p-3">
                <span className="text-[8px] font-black tracking-widest text-muted-foreground uppercase">
                  LEADERBOARD
                </span>
                <span className="flex items-center gap-1 text-[8px] font-black tracking-widest text-red-500 uppercase">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />{" "}
                  LIVE NOW
                </span>
              </div>
              <CardContent className="p-0">
                {loadingBoard ? (
                  <div className="flex flex-col">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between border-b p-4 last:border-0"
                      >
                        <div className="flex items-center gap-4">
                          <span className="h-8 w-8 animate-pulse rounded bg-muted" />
                          <div className="flex flex-col gap-1">
                            <span className="h-4 w-24 animate-pulse rounded bg-muted" />
                            <span className="h-2 w-16 animate-pulse rounded bg-muted" />
                          </div>
                        </div>
                        <span className="h-6 w-12 animate-pulse rounded bg-muted" />
                      </div>
                    ))}
                  </div>
                ) : top3.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No entries yet — be the first to claim a spot!
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {top3.map((entry, idx) => (
                      <div
                        key={entry.slug}
                        className={`flex items-center justify-between p-3 transition-colors hover:bg-muted/50 ${idx < top3.length - 1 ? "border-b" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-2xl font-black italic ${entry.rank === 1 ? "text-black" : "text-muted-foreground"}`}
                          >
                            #{entry.rank}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-black">
                                {entry.name}
                              </span>
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[7px] font-bold tracking-wider text-muted-foreground uppercase">
                                {entry.category.name}
                              </span>
                            </div>
                            <div className="text-[8px] font-medium text-muted-foreground">
                              {timeAgo(entry.updatedAt)} •{" "}
                              {formatClicks(entry.clickCount)} clicks
                            </div>
                          </div>
                        </div>
                        <span className="text-xl font-black text-orange-500">
                          {entry.currentBidFormatted}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Explore Section */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-wrap gap-2">
            {/* ALL filter */}
            <Badge
              id="filter-all"
              onClick={() => setActiveCategory(null)}
              variant={activeCategory === null ? "default" : "outline"}
              className={`cursor-pointer rounded-full px-3 py-1 text-[10px] font-bold ${
                activeCategory === null
                  ? "border border-black bg-black text-white hover:bg-black/90"
                  : "bg-white text-muted-foreground hover:bg-muted"
              }`}
            >
              ALL
            </Badge>
            {/* Dynamic categories from DB */}
            {loadingMeta
              ? [1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="h-6 w-16 animate-pulse rounded-full bg-muted"
                  />
                ))
              : categories.map((cat) => (
                  <Badge
                    key={cat.id}
                    id={`filter-${cat.slug}`}
                    onClick={() =>
                      setActiveCategory(
                        activeCategory === cat.slug ? null : cat.slug
                      )
                    }
                    variant={
                      activeCategory === cat.slug ? "default" : "outline"
                    }
                    className={`cursor-pointer rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase ${
                      activeCategory === cat.slug
                        ? "border border-black bg-black text-white hover:bg-black/90"
                        : "bg-white text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {cat.name}
                  </Badge>
                ))}
          </div>
        </div>

        {/* Startup List — from DB, sorted by currentBid DESC */}
        <div className="flex flex-col">
          {loadingBoard ? (
            [1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="-mx-4 flex items-center justify-between rounded-lg border-b px-4 py-4"
              >
                <div className="flex items-center gap-8">
                  <span className="h-8 w-10 animate-pulse rounded bg-muted" />
                  <div className="flex flex-col gap-2">
                    <span className="h-5 w-32 animate-pulse rounded bg-muted" />
                    <span className="h-3 w-48 animate-pulse rounded bg-muted" />
                  </div>
                </div>
                <span className="h-8 w-16 animate-pulse rounded bg-muted" />
              </div>
            ))
          ) : leaderboard.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-base font-bold">No startups yet</p>
              <p className="mt-1 text-sm">
                Be the first to claim your spot on the leaderboard!
              </p>
            </div>
          ) : (
            leaderboard.map((entry) => (
              <a
                key={entry.slug}
                href={entry.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                id={`startup-${entry.slug}`}
                className="group -mx-4 flex flex-col justify-between rounded-lg border-b px-4 py-4 transition-colors hover:bg-black/5 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-4 sm:items-center sm:gap-6">
                  <span
                    className={`text-2xl font-black italic sm:text-3xl ${entry.rank === 1 ? "text-black" : "text-muted-foreground"}`}
                  >
                    #{entry.rank}
                  </span>
                  <div className="flex flex-col">
                    <div className="mb-1 flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="text-lg font-bold text-black">
                        {entry.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-muted px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-muted-foreground uppercase"
                      >
                        {entry.category.name}
                      </Badge>
                      <div className="hidden items-center gap-3 sm:flex">
                        <span className="text-[9px] font-medium text-muted-foreground">
                          {timeAgo(entry.updatedAt)}
                        </span>
                        <span className="text-[9px] font-medium text-muted-foreground">
                          {formatClicks(entry.clickCount)} clicks
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {entry.description ?? entry.websiteUrl}
                    </p>
                  </div>
                </div>
                <span className="mt-3 origin-right self-end text-xl font-black text-orange-500 transition-transform group-hover:scale-105 sm:mt-0 sm:self-auto sm:text-2xl">
                  {entry.currentBidFormatted}
                </span>
              </a>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex flex-col items-center justify-between border-t bg-[#f5f5f5] px-6 py-8 md:flex-row">
        <div className="mb-4 text-base font-bold tracking-tight text-black md:mb-0">
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
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
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
          <div className="text-[8px] font-black tracking-widest text-muted-foreground uppercase">
            BUILT BY @ABUBAKKAR2502
          </div>
        </div>
      </footer>
    </div>
  )
}
