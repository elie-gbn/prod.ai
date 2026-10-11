"use client";

import { useEffect, useRef, useState } from "react";
import {
  AudioLines,
  Download,
  Loader2,
  MessageCircle,
  Music2,
  Paperclip,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { genres, moods, musicalKeys } from "@/lib/ai/music-options";
import { MAX_TRACK_UPLOAD_BYTES, TRACK_UPLOAD_ACCEPT } from "@/lib/ai/audio-upload";

type MidiAttachment = {
  filename: string;
  base64: string;
  key: string;
  mode: string;
  mood: string;
  genre: string;
  tempo: number;
  bars: number;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  midi?: MidiAttachment;
};

type ComposerView = "compose" | "ask";
type KeyName = (typeof musicalKeys)[number];
type Mood = (typeof moods)[number];
type Genre = (typeof genres)[number];
type TrackName = "melody" | "chords" | "bassline" | "drums";

const selectClassName =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

const trackOptions: Array<{
  id: TrackName;
  label: string;
  color: string;
}> = [
  { id: "melody", label: "Melody", color: "bg-primary" },
  { id: "chords", label: "Chord progression", color: "bg-secondary-foreground" },
  { id: "bassline", label: "Bassline", color: "bg-chart-2" },
  { id: "drums", label: "Drums / percussion", color: "bg-chart-3" },
];

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [view, setView] = useState<ComposerView>("ask");
  const [key, setKey] = useState<KeyName>("C");
  const [mode, setMode] = useState<"major" | "minor">("major");
  const [mood, setMood] = useState<Mood>("dreamy");
  const [genre, setGenre] = useState<Genre>("pop");
  const [selectedTracks, setSelectedTracks] = useState<Record<TrackName, boolean>>({
    melody: true,
    chords: true,
    bassline: true,
    drums: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await fetch("/api/agent");
        if (!response.ok) return;

        const data = (await response.json()) as {
          history?: Array<{
            _id?: string;
            role: "user" | "assistant";
            content: string;
          }>;
        };

        setMessages(
          (data.history ?? [])
            .slice()
            .reverse()
            .map((message, index) => ({
              id: message._id?.toString() ?? `${message.role}-${index}`,
              role: message.role,
              content: message.content,
            })),
        );
      } catch {
        setError("Could not load your studio history.");
      }
    }

    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`;
  }, [input]);

  function toggleTrack(track: TrackName) {
    setSelectedTracks((current) => ({
      ...current,
      [track]: !current[track],
    }));
  }

  async function sendMessage() {
    const creativeDirection = input.trim();
    if (
      (view === "ask" && !creativeDirection && !trackFile) ||
      isLoading
    ) {
      return;
    }

    const displayMessage =
      trackFile
        ? `Review uploaded track: ${trackFile.name}${creativeDirection ? ` - ${creativeDirection}` : ""}`
        : view === "compose"
          ? creativeDirection || `An ${mood} ${genre} idea in ${key} ${mode}`
          : creativeDirection;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: displayMessage,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      let response: Response;
      if (trackFile && view === "ask") {
        const formData = new FormData();
        formData.set("track", trackFile);
        formData.set("focus", creativeDirection);
        response = await fetch("/api/agent/analyze-track", {
          method: "POST",
          body: formData,
        });
      } else {
        const requestedTracks = Object.entries(selectedTracks)
          .filter(([, enabled]) => enabled)
          .map(([name]) => name);

        response = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: creativeDirection,
            task: view,
            composition:
              view === "compose"
                ? { key, mode, mood, genre, tracks: requestedTracks }
                : undefined,
          }),
        });
      }

      const data = (await response.json()) as {
        response?: string;
        midi?: MidiAttachment;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not complete your request.");
      }

      setMessages([
        ...nextMessages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response ?? "I could not complete that request.",
          midi: data.midi,
        },
      ]);
      if (trackFile) setTrackFile(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "An unknown error occurred.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3">
      <div>
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-primary">
          <Music2 className="size-4" /> prod.ai / Music help
        </p>
        <h1 className="text-3xl font-semibold">
          {view === "compose" ? "Make a new idea" : "Your music desk"}
        </h1>
      </div>

      <div className="studio-surface grid min-h-0 overflow-hidden border border-border bg-card lg:h-[calc(100dvh-12rem)] lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col overflow-y-auto border-b border-border bg-muted/35 p-5 lg:border-b-0 lg:border-r">
          <div
            className="mb-6 flex rounded-md border border-border bg-card p-1"
            role="tablist"
            aria-label="Studio mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "compose"}
              onClick={() => {
                setTrackFile(null);
                setView("compose");
              }}
              className={cn(
                "flex h-9 flex-1 items-center justify-center gap-2 rounded px-3 text-sm font-medium transition-colors",
                view === "compose"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Music2 className="size-4" /> Compose
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "ask"}
              onClick={() => setView("ask")}
              className={cn(
                "flex h-9 flex-1 items-center justify-center gap-2 rounded px-3 text-sm font-medium transition-colors",
                view === "ask"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <MessageCircle className="size-4" /> Music help
            </button>
          </div>

          {view === "compose" ? (
            <>
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Composition</p>
                <h2 className="mt-1 text-lg font-semibold">Set the tone</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                  Key
                  <select
                    className={selectClassName}
                    value={key}
                    onChange={(event) => setKey(event.target.value as KeyName)}
                  >
                    {musicalKeys.map((musicalKey) => (
                      <option key={musicalKey} value={musicalKey}>{musicalKey}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                  Mode
                  <select
                    className={selectClassName}
                    value={mode}
                    onChange={(event) => setMode(event.target.value as "major" | "minor")}
                  >
                    <option value="major">Major</option>
                    <option value="minor">Minor</option>
                  </select>
                </label>
                <label className="col-span-2 grid gap-1.5 text-xs font-medium text-muted-foreground">
                  Mood
                  <select
                    className={selectClassName}
                    value={mood}
                    onChange={(event) => setMood(event.target.value as Mood)}
                  >
                    {moods.map((option) => (
                      <option key={option} value={option}>{titleCase(option)}</option>
                    ))}
                  </select>
                </label>
                <label className="col-span-2 grid gap-1.5 text-xs font-medium text-muted-foreground">
                  Genre
                  <select
                    className={selectClassName}
                    value={genre}
                    onChange={(event) => setGenre(event.target.value as Genre)}
                  >
                    {genres.map((option) => (
                      <option key={option} value={option}>{titleCase(option)}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-8 flex min-h-0 flex-1 flex-col border-t border-border pt-5">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Tracks</p>
                <div className="mt-3 space-y-2 pr-1">
                  {trackOptions.map((track) => (
                    <label
                      key={track.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTracks[track.id]}
                        onChange={() => toggleTrack(track.id)}
                        className="h-4 w-4 accent-[#0a246a]"
                      />
                      <span className="flex items-center gap-2">
                        <span className={cn("size-2 rounded-full", track.color)} />
                        {track.label}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  {Object.values(selectedTracks).filter(Boolean).length} selected / 4 available
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Music help</p>
                <h2 className="mt-1 text-lg font-semibold">Ask the studio</h2>
              </div>

              <div className="space-y-3">
                {[
                  "Explain borrowed chords",
                  "Tame a muddy low end",
                  "Build energy into an arrangement",
                  "How does sidechain compression work?",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => setInput(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="rounded-md border border-dashed border-border bg-background p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Audio upload</p>
                <label
                  htmlFor="track-upload"
                  className="mt-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Paperclip className="size-4" /> Upload track
                </label>
                <input
                  id="track-upload"
                  type="file"
                  accept={TRACK_UPLOAD_ACCEPT}
                  className="sr-only"
                  disabled={isLoading}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = "";
                    if (!file) return;
                    if (file.size > MAX_TRACK_UPLOAD_BYTES) {
                      setError("Choose an MP3 or WAV file up to 20 MB.");
                      return;
                    }
                    if (!/\.(mp3|wav)$/i.test(file.name)) {
                      setError("Choose an MP3 or WAV audio file.");
                      return;
                    }
                    setError(null);
                    setTrackFile(file);
                  }}
                />
                <p className="mt-2 text-xs text-muted-foreground">MP3 or WAV / up to 20 MB</p>
              </div>
            </div>
          )}
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col" aria-label="Studio conversation">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
            <div>
              <h2 className="text-sm font-semibold">
                {view === "compose" ? "Composition session" : "Music desk"}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {view === "compose"
                  ? `${key} ${mode} / ${titleCase(mood)} / ${titleCase(genre)}`
                  : "Production / theory / arrangement"}
              </p>
            </div>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-chart-2" /> Ready
            </span>
          </div>

          <div className="chat-history-scroll flex-1 min-h-0 space-y-5 overflow-y-auto bg-white p-4 sm:p-6">
            {messages.length === 0 ? (
              <div className="mx-auto flex min-h-[380px] max-w-2xl flex-col justify-center gap-8">
                {view === "compose" ? (
                  <>
                    <div>
                      <p className="text-sm font-medium">Ready to sketch.</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {key} {mode} / {titleCase(mood)} / {titleCase(genre)}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="max-w-md">
                    <Sparkles className="mb-4 size-5 text-primary" />
                    <h3 className="text-xl font-semibold">Music help</h3>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {[
                        "Explain borrowed chords",
                        "Tame a muddy low end",
                        "Build energy into an arrangement",
                        "How does sidechain compression work?",
                      ].map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          className="rounded-md border border-border bg-background px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          onClick={() => setInput(prompt)}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[90%] whitespace-pre-wrap border px-4 py-3 text-sm leading-6 sm:max-w-[78%]",
                      message.role === "user"
                        ? "rounded-xl border-primary/20 bg-primary/10 text-foreground"
                        : "rounded-xl border-border bg-white text-foreground",
                    )}
                  >
                    {message.content}
                    {message.midi && (
                      <div className="mt-4 border-t border-border pt-3">
                        <p className="text-xs text-muted-foreground">
                          {message.midi.key} {message.midi.mode} / {titleCase(message.midi.mood)} / {titleCase(message.midi.genre)} / {message.midi.tempo} BPM / {message.midi.bars} bars
                        </p>
                        <a
                          className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-foreground px-3 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
                          download={message.midi.filename}
                          href={`data:audio/midi;base64,${message.midi.base64}`}
                        >
                          <Download className="size-4" /> Download MIDI
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                {trackFile
                  ? "Listening for mix and arrangement details..."
                  : view === "compose"
                    ? "Writing the phrase..."
                    : "Thinking through it..."}
              </div>
            )}
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border p-3 sm:p-4">
            {view === "ask" && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <label
                    htmlFor="track-upload"
                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <Paperclip className="size-4" /> Upload track
                  </label>
                  <input
                    id="track-upload"
                    type="file"
                    accept={TRACK_UPLOAD_ACCEPT}
                    className="sr-only"
                    disabled={isLoading}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";
                      if (!file) return;
                      if (file.size > MAX_TRACK_UPLOAD_BYTES) {
                        setError("Choose an MP3 or WAV file up to 20 MB.");
                        return;
                      }
                      if (!/\.(mp3|wav)$/i.test(file.name)) {
                        setError("Choose an MP3 or WAV audio file.");
                        return;
                      }
                      setError(null);
                      setTrackFile(file);
                    }}
                  />
                  <span className="text-xs text-muted-foreground">MP3 or WAV / up to 20 MB</span>
                </div>
                {trackFile && (
                  <div className="flex max-w-full items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs">
                    <AudioLines className="size-4 shrink-0 text-primary" />
                    <span className="max-w-[220px] truncate">{trackFile.name}</span>
                    <button
                      type="button"
                      aria-label="Remove attached track"
                      title="Remove attached track"
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      disabled={isLoading}
                      onClick={() => setTrackFile(null)}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-end gap-2 rounded-xl border border-input bg-white p-2 focus-within:ring-2 focus-within:ring-ring/35">
              <textarea
                ref={inputRef}
                className="max-h-36 min-h-11 flex-1 resize-none overflow-hidden bg-transparent px-2 py-2 text-sm leading-5 outline-none placeholder:text-muted-foreground"
                placeholder={view === "compose" ? "Add a musical direction (optional)" : "Ask about production, theory, or a sound you are chasing..."}
                value={input}
                rows={1}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                disabled={isLoading}
              />
              <Button
                className="mb-0.5 gap-2 px-3"
                onClick={() => void sendMessage()}
                disabled={isLoading || (view === "ask" && !input.trim() && !trackFile)}
                aria-label={view === "compose" ? "Generate MIDI composition" : "Ask music assistant"}
              >
                {view === "compose" ? <Music2 className="size-4" /> : <Send className="size-4" />}
                <span className="hidden sm:inline">
                  {view === "compose"
                    ? "Generate MIDI"
                    : trackFile
                      ? "Analyze track"
                      : "Send"}
                </span>
              </Button>
            </div>
            {view === "ask" && trackFile && (
              <p className="mt-2 text-xs text-muted-foreground">
                Your track is analyzed for this request; prod.ai does not save the audio file.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}