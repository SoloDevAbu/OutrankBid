"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { MinusCircle, PlusCircle, ArrowRight, Loader2, AlertCircle, TrendingUp } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeUrl(raw: string): string | null {
  let input = raw.trim()
  if (!input) return null
  if (!/^https?:\/\//i.test(input)) input = `https://${input}`
  try {
    const u = new URL(input)
    if (u.protocol !== "http:" && u.protocol !== "https:") return null
    return u.origin
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UrlCheckResult =
  | { exists: false }
  | { exists: true; startupId: string; name: string; currentBidDollars: number }

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HomeHeroCta() {
  const [price, setPrice] = useState<number>(1)
  const [website, setWebsite] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [checkingUrl, setCheckingUrl] = useState(false)
  const [priceLoading, setPriceLoading] = useState(true)

  // New-listing dialog
  const [showNewListingDialog, setShowNewListingDialog] = useState(false)
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([])

  // Top-up dialog
  const [showTopUpDialog, setShowTopUpDialog] = useState(false)
  const [topUpResult, setTopUpResult] = useState<Extract<UrlCheckResult, { exists: true }> | null>(null)

  const [error, setError] = useState<string | null>(null)

  const min = 1
  const max = 5000

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  useEffect(() => {
    fetch("/api/highest-bid")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data?.suggestedDollars === "number") {
          setPrice(data.suggestedDollars)
        }
      })
      .catch(() => {})
      .finally(() => setPriceLoading(false))

    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data?.categories || []))
      .catch(() => {})
  }, [])

  // ---------------------------------------------------------------------------
  // Price controls
  // ---------------------------------------------------------------------------

  const dec = () => setPrice((p) => Math.max(min, p - 1))
  const inc = () => setPrice((p) => Math.min(max, p + 1))

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10)
    if (isNaN(val)) return
    setPrice(Math.min(max, Math.max(min, val)))
  }

  // ---------------------------------------------------------------------------
  // CLAIM YOUR SPOT — check URL then branch
  // ---------------------------------------------------------------------------

  async function handleClaimClick() {
    setError(null)
    const normalized = normalizeUrl(website)
    if (!normalized) {
      setError("Enter a valid website URL (e.g., example.com).")
      return
    }

    setCheckingUrl(true)
    try {
      const res = await fetch("/api/check-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: normalized }),
      })

      if (!res.ok) {
        throw new Error("URL check failed. Please try again.")
      }

      const result: UrlCheckResult = await res.json()

      if (result.exists) {
        // URL already in DB → show top-up dialog
        setTopUpResult(result)
        setShowTopUpDialog(true)
      } else {
        // Brand new URL → show new-listing dialog
        setShowNewListingDialog(true)
      }
    } catch (e: any) {
      setError(e?.message || "Failed to check URL. Please try again.")
    } finally {
      setCheckingUrl(false)
    }
  }

  // ---------------------------------------------------------------------------
  // New listing checkout
  // ---------------------------------------------------------------------------

  async function startNewListingCheckout() {
    setError(null)
    if (!category) {
      setError("Please select a category.")
      return
    }
    if (!description) {
      setError("Please provide a short description.")
      return
    }
    const normalized = normalizeUrl(website)
    if (!normalized) return

    const amountCents = Math.round(price * 100)
    setLoading(true)
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents,
          websiteUrl: normalized,
          currency: "USD",
          description,
          categorySlug: category,
          isTopUp: false,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `Checkout failed (${res.status})`)
      }
      const data = await res.json()
      const url: string | undefined = data?.checkout_url
      if (!url) throw new Error("Missing checkout_url in response")
      window.location.href = url
    } catch (e: any) {
      console.error("[create-checkout] failed", e)
      setError(e?.message || "Failed to start checkout")
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Top-up checkout
  // ---------------------------------------------------------------------------

  async function startTopUpCheckout() {
    setError(null)
    if (!topUpResult) return
    const normalized = normalizeUrl(website)
    if (!normalized) return

    const amountCents = Math.round(price * 100)
    setLoading(true)
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents,
          websiteUrl: normalized,
          currency: "USD",
          startupId: topUpResult.startupId,
          isTopUp: true,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `Checkout failed (${res.status})`)
      }
      const data = await res.json()
      const url: string | undefined = data?.checkout_url
      if (!url) throw new Error("Missing checkout_url in response")
      window.location.href = url
    } catch (e: any) {
      console.error("[top-up checkout] failed", e)
      setError(e?.message || "Failed to start checkout")
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const isChecking = checkingUrl
  const btnDisabled = loading || priceLoading || isChecking || !website.trim()

  return (
    <div className="flex flex-col justify-start">
      <h1 className="mb-3 text-2xl leading-[1.1] font-black tracking-tighter text-black lg:text-4xl">
        YOUR STARTUP
        <br />
        DESERVES THE
        <br />
        ATTENTION.
      </h1>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">
        The internet's live leaderboard where startups compete for the top spot.
      </p>
      <Card className="mb-4 overflow-hidden rounded-sm border-2 border-orange-500 bg-white shadow-sm">
        <CardContent className="flex flex-col items-center justify-center p-2.5 text-center">
          <div className="mb-2 text-[10px] font-black tracking-widest text-black uppercase">
            GET #1 SPOT FOR
          </div>
          <div className="flex items-center gap-3">
            <MinusCircle
              className="h-5 w-5 cursor-pointer text-black transition-colors hover:text-orange-500"
              onClick={dec}
            />
            {priceLoading ? (
              <div className="flex h-12 w-28 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
              </div>
            ) : (
              <div className="flex items-center text-4xl font-black tracking-tighter text-orange-500">
                <span className="mr-1 text-2xl">$</span>
                <input
                  id="bid-price-input"
                  type="number"
                  min={min}
                  max={max}
                  value={price}
                  onChange={handlePriceChange}
                  className="w-24 [appearance:textfield] bg-transparent text-center outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  aria-label="Bid amount in dollars"
                />
              </div>
            )}
            <PlusCircle
              className="h-5 w-5 cursor-pointer text-black transition-colors hover:text-orange-500"
              onClick={inc}
            />
          </div>
          <p className="mt-1.5 text-[8px] font-medium tracking-wide text-muted-foreground uppercase">
            You pay exactly this amount
          </p>
        </CardContent>
      </Card>
      <div className="flex w-full max-w-md items-center">
        <Input
          id="startup-url-input"
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="Enter your startup URL..."
          className="h-10 text-sm rounded-none border-r-0 bg-white focus-visible:ring-0 focus-visible:ring-offset-0"
          onKeyDown={(e) => {
            if (e.key === "Enter" && website.trim()) {
              handleClaimClick()
            }
          }}
        />
        <Button
          id="claim-spot-btn"
          onClick={handleClaimClick}
          disabled={btnDisabled}
          className="h-10 rounded-none bg-black px-5 text-sm font-bold whitespace-nowrap text-white hover:bg-black/90"
        >
          {isChecking || loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> PROCESSING...
            </span>
          ) : (
            <>
              CLAIM YOUR SPOT <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4 border-red-500 bg-red-50 text-red-600 dark:bg-red-950/20">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* NEW LISTING DIALOG                                                   */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={showNewListingDialog} onOpenChange={setShowNewListingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete your listing</DialogTitle>
            <DialogDescription>
              Provide a short description and select a category so people know what your startup does.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium leading-none">
                Description
              </label>
              <Input
                id="description"
                placeholder="The fastest way to build..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium leading-none">
                Category
              </label>
              <Select value={category} onValueChange={(val) => setCategory(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && (
            <Alert variant="destructive" className="border-red-500 bg-red-50 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              disabled={loading || !description || !category}
              onClick={startNewListingCheckout}
              className="bg-black text-white hover:bg-black/90"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> PROCEEDING...
                </span>
              ) : (
                "PROCEED TO PAY"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* TOP-UP / ADD MORE FUNDS DIALOG                                       */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Add More Funds
            </DialogTitle>
            <DialogDescription>
              <span className="block space-y-2 pt-1">
                <span className="block">
                  <span className="font-semibold text-foreground">
                    {topUpResult?.name ?? website}
                  </span>{" "}
                  is already on the leaderboard with a current bid of{" "}
                  <span className="font-bold text-orange-500">
                    ${topUpResult?.currentBidDollars ?? 0}
                  </span>
                  .
                </span>
                <span className="block text-sm">
                  Add more funds below to increase your total bid and climb back to the top.
                </span>
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* Price selector reused inline */}
          <div className="flex flex-col items-center gap-3 rounded-sm border-2 border-orange-500 py-4">
            <p className="text-[10px] font-black tracking-widest text-black uppercase">
              Add this amount
            </p>
            <div className="flex items-center gap-3">
              <MinusCircle
                className="h-5 w-5 cursor-pointer text-black transition-colors hover:text-orange-500"
                onClick={dec}
              />
              <div className="flex items-center text-4xl font-black tracking-tighter text-orange-500">
                <span className="mr-1 text-2xl">$</span>
                <input
                  id="topup-price-input"
                  type="number"
                  min={min}
                  max={max}
                  value={price}
                  onChange={handlePriceChange}
                  className="w-24 [appearance:textfield] bg-transparent text-center outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  aria-label="Top-up amount in dollars"
                />
              </div>
              <PlusCircle
                className="h-5 w-5 cursor-pointer text-black transition-colors hover:text-orange-500"
                onClick={inc}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              New total:{" "}
              <span className="font-bold text-black">
                ${(topUpResult?.currentBidDollars ?? 0) + price}
              </span>
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="border-red-500 bg-red-50 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTopUpDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              id="add-funds-btn"
              disabled={loading}
              onClick={startTopUpCheckout}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> PROCESSING...
                </span>
              ) : (
                <>
                  ADD FUNDS <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
