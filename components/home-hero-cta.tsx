"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { MinusCircle, PlusCircle, ArrowRight, Loader2 } from "lucide-react"

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

export function HomeHeroCta() {
  const [price, setPrice] = useState<number>(1)
  const [website, setWebsite] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [priceLoading, setPriceLoading] = useState(true)
  const min = 1
  const max = 5000

  // Fetch the suggested price on mount (highest bid + 1)
  useEffect(() => {
    fetch("/api/highest-bid")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data?.suggestedDollars === "number") {
          setPrice(data.suggestedDollars)
        }
      })
      .catch(() => {
        // keep default of 1 on error
      })
      .finally(() => setPriceLoading(false))
  }, [])

  const dec = () => setPrice((p) => Math.max(min, p - 1))
  const inc = () => setPrice((p) => Math.min(max, p + 1))

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10)
    if (isNaN(val)) return
    setPrice(Math.min(max, Math.max(min, val)))
  }

  async function startCheckout() {
    const normalized = normalizeUrl(website)
    if (!normalized) {
      alert("Enter a valid website URL (e.g., example.com).")
      return
    }
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
      alert(e?.message || "Failed to start checkout")
    } finally {
      setLoading(false)
    }
  }

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
          onKeyDown={(e) => e.key === "Enter" && startCheckout()}
        />
        <Button
          id="claim-spot-btn"
          onClick={startCheckout}
          disabled={loading || priceLoading}
          className="h-10 rounded-none bg-black px-5 text-sm font-bold whitespace-nowrap text-white hover:bg-black/90"
        >
          {loading ? (
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
    </div>
  )
}
