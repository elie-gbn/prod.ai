import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  Download,
  SlidersHorizontal,
  Waves,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Separator from "@/components/ui/separator";

const principles = [
  {
    icon: BookOpen,
    title: "Music theory",
    body: "Explore harmony, scales, rhythm, and form in practical terms.",
  },
  {
    icon: SlidersHorizontal,
    title: "Production workflows",
    body: "Get help with recording, editing, DAW sessions, mixing, and delivery.",
  },
  {
    icon: Waves,
    title: "Sound and mix",
    body: "Shape sounds, solve masking, and think through balance and effects.",
  },
  {
    icon: Download,
    title: "Original MIDI",
    body: "Build on a four-track sketch with melody, chords, bass, and percussion.",
  },
];

const questions = [
  {
    title: "What can I ask about?",
    body: "Ask about theory, arrangement, recording, sound design, mixing, mastering, or DAW workflows.",
  },
  {
    title: "Can I get DAW-specific help?",
    body: "Yes. Include your DAW and version when you want steps tailored to its tools and menus.",
  },
  {
    title: "What does a MIDI sketch include?",
    body: "Each downloadable MIDI has separate melody, chord, bass, and percussion tracks to edit in your DAW.",
  },
];

export default function AboutPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="max-w-3xl space-y-4">
          <Badge variant="outline" className="gap-1.5"><AudioLines className="size-3.5" /> About prod.ai</Badge>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Music thinking, from first note to final mix.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            prod.ai helps you understand musical choices, work through production problems, and create MIDI ideas to develop in your own setup.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 border-y border-border py-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {principles.map(({ icon: Icon, title, body }) => (
            <article key={title}>
              <Icon className="size-5 text-primary" />
              <h2 className="mt-4 text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
        <Separator className="my-8" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">A few details</h2>
            <p className="text-sm text-muted-foreground">
              About music help and downloadable sketches.
            </p>
            <div className="pt-3">
              <Link
                href="/assistant"
                className={buttonVariants({ className: "gap-2" })}
              >
                Open the studio <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {questions.map((question) => (
              <details key={question.title} className="group py-4">
                <summary className="cursor-pointer list-none text-sm font-medium marker:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {question.title}<span className="text-primary transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 pr-8 text-sm leading-6 text-muted-foreground">{question.body}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
