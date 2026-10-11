
import { ArrowRight, AudioLines, BookOpen, Music2, SlidersHorizontal } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { getSession } from "@/lib/authentication";


export default async function HomePage() {
  const session = await getSession();

  return (
    <main className="flex flex-1 items-center px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="win95-window">
          <div className="win95-titlebar">
            <span>prod.ai music desk</span>
            <div className="win95-controls" aria-label="Window controls">
              <span className="win95-control">_</span>
              <span className="win95-control">□</span>
              <span className="win95-control">×</span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <section className="max-w-3xl">
              <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#0a246a]">
                <AudioLines className="size-4" /> prod.ai music desk
              </p>
              <h1 className="text-5xl font-black leading-[1.05] text-[#101010] sm:text-6xl">
                Make more of your music.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-[#2f2f2f] sm:text-lg">
                Explore music theory, solve production questions, or turn a musical direction into an original MIDI sketch.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={session ? "/assistant" : "/login"}
                  className={buttonVariants({
                    size: "lg",
                    className: "h-11 gap-2 px-5 font-bold uppercase tracking-wide",
                  })}
                >
                  Open music desk <ArrowRight className="size-4" />
                </Link>
                <span className="text-sm text-[#2f2f2f]">Theory / production / MIDI</span>
              </div>
            </section>
            <div className="mt-14 grid border-t-2 border-[#808080] sm:grid-cols-3">
              <div className="border-b-2 border-[#808080] py-5 sm:border-b-0 sm:border-r-2 sm:pr-6">
                <BookOpen className="size-5 text-[#0a246a]" />
                <h2 className="mt-3 text-base font-bold">Music theory</h2>
                <p className="mt-1 text-sm text-[#2f2f2f]">Harmony, rhythm, scales, and form</p>
              </div>
              <div className="border-b-2 border-[#808080] py-5 sm:border-b-0 sm:border-r-2 sm:px-6">
                <SlidersHorizontal className="size-5 text-[#2f2f2f]" />
                <h2 className="mt-3 text-base font-bold">Music production</h2>
                <p className="mt-1 text-sm text-[#2f2f2f]">Recording, sound design, mixing, and DAWs</p>
              </div>
              <div className="py-5 sm:pl-6">
                <Music2 className="size-5 text-[#0a246a]" />
                <h2 className="mt-3 text-base font-bold">Original MIDI</h2>
                <p className="mt-1 text-sm text-[#2f2f2f]">Melody and chord sketches to build on</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
