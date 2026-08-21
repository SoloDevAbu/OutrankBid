"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Eye, RefreshCw } from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LeaderboardEntry = {
  rank: number
  name: string
  slug: string
  category: { name: string; slug: string }
  platform?: { name: string; slug: string; logoUrl: string | null } | null
  currentBid: number
  currentBidFormatted: string
  clickCount: number
  appUrl: string
  description: string | null
  logoUrl: string | null
  createdAt: string
  updatedAt: string
}

export type Category = { id: string; name: string; slug: string }
export type Stats = { activeCount: number; totalClicks: number }

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
// Props
// ---------------------------------------------------------------------------

interface LeaderboardViewProps {
  initialData: LeaderboardEntry[]
  initialCategories: Category[]
  initialStats: Stats
  /** If set, this view is pre-filtered to a specific category */
  activeCategory?: string | null
  /** When true, hides the category filter pills (used on /category pages which have their own nav) */
  categoryPage?: boolean
  /** Optional hero slot — renders the original two-column hero + mini-leaderboard layout */
  heroSlot?: React.ReactNode
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LeaderboardView({
  initialData,
  initialCategories,
  initialStats,
  activeCategory: propCategory = null,
  categoryPage = false,
  heroSlot,
}: LeaderboardViewProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialData)
  const [categories] = useState<Category[]>(initialCategories)
  const [stats] = useState<Stats>(initialStats)
  const [activeCategory, setActiveCategory] = useState<string | null>(propCategory)
  const [loadingBoard, setLoadingBoard] = useState(false)
  const [lastPullTime, setLastPullTime] = useState<number>(Date.now())
  const [secondsSincePull, setSecondsSincePull] = useState(0)

  const fetchLeaderboard = useCallback(
    (categorySlug: string | null, isPolling = false) => {
      if (!isPolling) setLoadingBoard(true)
      const url = categorySlug
        ? `/api/leaderboard?category=${categorySlug}`
        : "/api/leaderboard"
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          setLeaderboard(data?.leaderboard ?? [])
          setLastPullTime(Date.now())
          setSecondsSincePull(0)
        })
        .catch(console.error)
        .finally(() => {
          if (!isPolling) setLoadingBoard(false)
        })
    },
    []
  )

  // 30-second polling — only after mount; first paint uses server-fetched initialData
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeaderboard(activeCategory, true)
    }, 30000)
    return () => clearInterval(interval)
  }, [activeCategory, fetchLeaderboard])

  // Seconds-since-refresh display ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsSincePull(Math.floor((Date.now() - lastPullTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [lastPullTime])

  const handleStartupClick = (slug: string) => {
    // Optimistic update
    setLeaderboard((prev) =>
      prev.map((entry) =>
        entry.slug === slug
          ? { ...entry, clickCount: entry.clickCount + 1 }
          : entry
      )
    )
    fetch("/api/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    }).catch(console.error)
  }

  const top3 = leaderboard.slice(0, 3)

  return (
    <>
      {/* Top Stats Pill */}
      <div className="mb-12 flex justify-center">
        <div className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-5 py-1.5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <div className="flex space-x-1">
              <span className="text-xs leading-none font-bold text-black">
                {stats.activeCount}
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
              <span className="text-xs leading-none font-bold text-black">
                {formatClicks(stats.totalClicks)}
              </span>
              <span className="text-[8px] font-medium tracking-wider text-muted-foreground uppercase">
                Visits
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section — two column layout preserved from original */}
      {heroSlot && (
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left: hero CTA */}
          <div className="flex items-center">
            {heroSlot}
          </div>

          {/* Right: Mini Leaderboard — top 3 */}
          <div className="flex flex-col">
            <Card className="rounded-sm border-black/10 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-black/10 p-3">
                <span className="text-[8px] font-black tracking-widest text-muted-foreground uppercase">
                  LEADERBOARD
                </span>
                <span className="flex items-center gap-1 text-[8px] font-black tracking-widest text-red-500 uppercase">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />{" "}
                  LIVE NOW
                </span>
              </div>
              <CardContent className="p-0">
                {top3.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No entries yet — be the first to claim a spot!
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {top3.map((entry, idx) => (
                      <div
                        key={entry.slug}
                        className={`flex items-center justify-between p-3 transition-colors hover:bg-muted/50 ${idx < top3.length - 1 ? "border-b border-black/10" : ""}`}
                      >
                        {/* Internal link to startup detail page */}
                        <Link
                          href={`/startup/${entry.slug}`}
                          className="flex flex-1 items-center gap-3"
                        >
                          <span
                            className={`text-2xl font-black italic ${entry.rank === 1 ? "text-black" : "text-muted-foreground"}`}
                          >
                            #{entry.rank}
                          </span>
                          {entry.logoUrl ? (
                            <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
                              <Image
                                src={entry.logoUrl}
                                alt={`${entry.name} logo`}
                                fill
                                className="object-cover"
                                sizes="32px"
                                priority={idx < 3}
                              />
                            </div>
                          ) : (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{entry.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-black">
                                {entry.name}
                              </span>
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[7px] font-bold tracking-wider text-muted-foreground uppercase">
                                {entry.category.name}
                              </span>
                              {entry.platform && (
                                <span className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[7px] font-bold tracking-wider text-muted-foreground uppercase">
                                  {entry.platform.logoUrl && (
                                    <img
                                      src={entry.platform.logoUrl}
                                      alt={entry.platform.name}
                                      className="h-2 w-2 object-contain opacity-70"
                                    />
                                  )}
                                  {entry.platform.name}
                                </span>
                              )}
                            </div>
                            <div className="text-[8px] font-medium text-muted-foreground">
                              {timeAgo(entry.updatedAt)} •{" "}
                              {formatClicks(entry.clickCount)} clicks
                            </div>
                          </div>
                        </Link>
                        {/* External sponsored link — bid amount */}
                        <a
                          href={entry.appUrl}
                          target="_blank"
                          rel="sponsored nofollow noopener noreferrer"
                          onClick={() => handleStartupClick(entry.slug)}
                          className="ml-2 text-xl font-black text-orange-500 transition-opacity hover:opacity-80"
                          aria-label={`Visit ${entry.name} website (sponsored)`}
                        >
                          {entry.currentBidFormatted}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Refresh divider */}
      <div className="mb-6 flex items-center">
        <Separator className="flex-1" />
        <div className="mx-4 flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-full border-black/10 text-black hover:bg-black/5"
            onClick={() => fetchLeaderboard(activeCategory)}
            disabled={loadingBoard}
            aria-label="Refresh leaderboard"
          >
            <RefreshCw
              className={`h-3 w-3 ${loadingBoard ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
        <Separator className="flex-1" />
      </div>

      {/* Category filter pills — navigate to /category/[slug] (real URLs for SEO) */}
      {!categoryPage && (
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              id="filter-all"
              prefetch={false}
              className={`cursor-pointer rounded-full border px-3 py-1 text-[10px] font-bold transition-colors ${
                activeCategory === null
                  ? "border-black bg-black text-white hover:bg-black/90"
                  : "border-black/20 bg-white text-muted-foreground hover:bg-muted"
              }`}
            >
              ALL
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                id={`filter-${cat.slug}`}
                prefetch={false}
                className={`cursor-pointer rounded-full border px-3 py-1 text-[10px] font-bold tracking-wider uppercase transition-colors ${
                  activeCategory === cat.slug
                    ? "border-black bg-black text-white hover:bg-black/90"
                    : "border-black/20 bg-white text-muted-foreground hover:bg-muted"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Full startup list */}
      <div className="flex flex-col">
        {loadingBoard ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="-mx-4 flex items-center justify-between rounded-lg border-b border-black/10 px-4 py-4"
              style={{ minHeight: "82px" }}
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
            <div
              key={entry.slug}
              id={`startup-${entry.slug}`}
              className="group -mx-4 flex flex-col justify-between rounded-lg border-b border-black/10 px-4 py-4 transition-colors hover:bg-black/5 sm:flex-row sm:items-center"
              style={{ minHeight: "82px" }}
            >
              {/* Internal link to startup detail page */}
              <Link
                href={`/startup/${entry.slug}`}
                className="flex flex-1 items-start gap-4 sm:items-center sm:gap-6"
              >
                <span
                  className={`text-2xl font-black italic sm:text-3xl ${entry.rank === 1 ? "text-black" : "text-muted-foreground"}`}
                >
                  #{entry.rank}
                </span>
                {entry.logoUrl ? (
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full sm:h-14 sm:w-14">
                    <Image
                      src={entry.logoUrl}
                      alt={`${entry.name} logo`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 48px, 56px"
                    />
                  </div>
                ) : (
                  <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
                    <AvatarFallback>{entry.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
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
                    {entry.platform && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 bg-muted px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-muted-foreground uppercase"
                      >
                        {entry.platform.logoUrl && (
                          <img
                            src={entry.platform.logoUrl}
                            alt={entry.platform.name}
                            className="h-2.5 w-2.5 object-contain opacity-70"
                          />
                        )}
                        {entry.platform.name}
                      </Badge>
                    )}
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
                    {entry.description ?? entry.appUrl}
                  </p>
                </div>
              </Link>
              {/* External sponsored link — bid amount as the CTA */}
              <a
                href={entry.appUrl}
                target="_blank"
                rel="sponsored nofollow noopener noreferrer"
                onClick={() => handleStartupClick(entry.slug)}
                className="mt-3 origin-right self-end text-xl font-black text-orange-500 transition-transform group-hover:scale-105 sm:mt-0 sm:self-auto sm:text-2xl"
                aria-label={`Visit ${entry.name} website (sponsored)`}
              >
                {entry.currentBidFormatted}
              </a>
            </div>
          ))
        )}
      </div>
    </>
  )
}
