import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] font-sans">
      <div className="text-center">
        <p className="mb-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          404
        </p>
        <h1 className="mb-4 text-3xl font-black text-black">Category not found</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          This category doesn&apos;t exist. Browse all startups on the main leaderboard.
        </p>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-black px-6 text-sm font-bold text-white transition-colors hover:bg-black/90"
        >
          Back to Leaderboard
        </Link>
      </div>
    </div>
  )
}
