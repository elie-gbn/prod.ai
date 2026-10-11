import { ArrowRight, CircleDollarSign } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-14 sm:px-6 lg:py-20">
      <div className="max-w-2xl">
        <Badge className="mb-5 gap-1.5" variant="outline"><CircleDollarSign className="size-3.5" /> Access</Badge>
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Pricing is still taking shape.</h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground">
          prod.ai is in early access. Paid plans are not available yet; the current studio experience is available to signed-in users.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/login" className={buttonVariants({ className: "gap-2" })}>
              Enter the studio <ArrowRight className="size-4" />
            </Link>
          <span className="text-sm text-muted-foreground">No paid tiers are listed yet.</span>
        </div>
      </div>
    </main>
  );
}
