import Link from "next/link";
import { getSession } from "@/lib/authentication";
import { signOutAction } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, LogOut, Music2 } from "lucide-react";

const pages = [
  { href: "/", label: "Studio", description: "Create original MIDI ideas." },
  {
    href: "/about",
    label: "About",
    description: "Learn about the music workspace.",
  },
  {
    href: "/pricing",
    label: "Pricing",
    description: "See plans and choose what fits.",
  },
] as const;

export default async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="border-b-2 border-[#808080] bg-[#d4d0c8] px-3 py-3 shadow-[inset_1px_1px_0_#fff,inset_-1px_-1px_0_#808080] sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-3 border border-[#f5f5f5] border-l-[#ffffff] border-t-[#ffffff] border-r-[#808080] border-b-[#808080] bg-[#c0c0c0] p-2 shadow-[inset_1px_1px_0_#fff]">
        <div className="contents sm:flex sm:items-center sm:gap-8">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground">
            <span className="flex size-8 items-center justify-center border border-t-white border-l-white border-r-[#808080] border-b-[#808080] bg-[#0a246a] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.2)]">
              <Music2 className="size-4" />
            </span>
            <span>
              prod<span className="text-[#0a246a]">.ai</span>
            </span>
          </Link>

          <nav className="order-3 flex w-full items-center justify-between gap-1 sm:order-none sm:w-auto sm:justify-start" aria-label="Main navigation">
            {pages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="border border-transparent px-2 py-1 text-xs text-[#111111] transition-colors hover:border-[#ffffff] hover:bg-[#d9d9d9] hover:shadow-[inset_1px_1px_0_#fff,inset_-1px_-1px_0_#808080] sm:px-3 sm:text-sm"
              >
                {page.label}
              </Link>
            ))}
          </nav>
        </div>

      {session?.user ? (
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-[#202020] sm:inline">
            {session.user.email}
          </span>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm" className="gap-2 text-[#111111] hover:text-[#111111]">
              <LogOut className="size-3.5" />
              Sign out
            </Button>
          </form>
        </div>
      ) : (
        <Link href="/login" className="flex items-center gap-1.5 text-xs font-bold text-[#0a246a] transition-colors hover:text-[#1d3d7d]">
          <span className="hidden sm:inline">Open studio</span><span className="sm:hidden">Login</span> <ArrowUpRight className="size-3.5" />
        </Link>
      )}
      </div>
    </header>
  );
}
