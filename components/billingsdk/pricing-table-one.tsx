"use client"

import { useRouter } from "next/navigation"
import { Check } from "lucide-react"

import type { Plan } from "@/lib/products"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function formatAmount(amount: number, currency: string) {
  // Dodo Payments amounts are in the currency's smallest unit (e.g., USD cents)
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount / 100)
}

type PricingTableOneProps = {
  plans: Plan[]
}

export function PricingTableOne({ plans }: PricingTableOneProps) {
  const router = useRouter()
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12 md:px-8">
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="text-4xl font-black tracking-tight text-black md:text-5xl">
          Choose your plan
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Transparent pricing. Upgrade, downgrade, or cancel anytime.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isPlaceholder = plan.product_id.includes("replace_me")

          return (
            <Card
              key={plan.product_id}
              className="rounded-sm bg-white shadow-sm"
            >
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-bold text-black">
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="mb-4 flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight text-black">
                    {formatAmount(plan.price, plan.currency)}
                  </span>
                  {plan.billing_interval ? (
                    <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      / {plan.billing_interval}
                    </span>
                  ) : null}
                </div>

                <ul className="flex flex-col gap-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="justify-end">
                <Button
                  onClick={() => {
                    if (!isPlaceholder) {
                      const url = `/checkout?productId=${encodeURIComponent(plan.product_id)}&quantity=1`
                      router.push(url)
                    }
                  }}
                  className="rounded-none bg-black px-4 font-bold text-white hover:bg-black/90"
                  disabled={isPlaceholder}
                  aria-disabled={isPlaceholder}
                  title={
                    isPlaceholder
                      ? "Set a real Dodo Payments product_id in lib/products.ts to enable"
                      : "Subscribe to this plan"
                  }
                >
                  {isPlaceholder ? "Configure product_id" : "Subscribe"}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Prices shown in {plans[0]?.currency ?? "USD"}. All transactions
        processed by Dodo Payments.
      </p>
    </section>
  )
}
