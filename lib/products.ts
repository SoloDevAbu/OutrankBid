export type Plan = {
  product_id: string
  name: string
  description: string
  price: number // smallest currency unit (e.g., cents)
  currency: "USD"
  billing_interval?: "month" | "year"
  features: string[]
}

// Replace product_id values with actual Product IDs from Dodo Payments Dashboard
// Docs: https://docs.dodopayments.com/developer-resources/nextjs-boilerplate
export const plans: Plan[] = [
  {
    product_id: "pdt_basic_replace_me",
    name: "Starter",
    description: "For early-stage projects getting started.",
    price: 900, // $9.00
    currency: "USD",
    billing_interval: "month",
    features: ["Up to 1 project", "Basic analytics", "Community support"],
  },
  {
    product_id: "pdt_pro_replace_me",
    name: "Pro",
    description: "For growing teams that need more.",
    price: 2900, // $29.00
    currency: "USD",
    billing_interval: "month",
    features: [
      "Up to 5 projects",
      "Advanced analytics",
      "Priority email support",
      "Customer portal",
    ],
  },
  {
    product_id: "pdt_business_replace_me",
    name: "Business",
    description: "For production workloads at scale.",
    price: 9900, // $99.00
    currency: "USD",
    billing_interval: "month",
    features: [
      "Unlimited projects",
      "Team roles & SSO",
      "Dunning management",
      "Premium support SLA",
    ],
  },
]
