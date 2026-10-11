const notes = [
  { left: 3, top: 18, width: 16, tone: "coral" },
  { left: 8, top: 43, width: 10, tone: "aqua" },
  { left: 21, top: 31, width: 20, tone: "lime" },
  { left: 28, top: 68, width: 13, tone: "coral" },
  { left: 42, top: 18, width: 12, tone: "aqua" },
  { left: 49, top: 56, width: 22, tone: "coral" },
  { left: 58, top: 31, width: 13, tone: "lime" },
  { left: 73, top: 43, width: 18, tone: "aqua" },
  { left: 79, top: 18, width: 13, tone: "coral" },
  { left: 84, top: 68, width: 11, tone: "lime" },
] as const;

export function PianoRollVisual({ compact = false }: { compact?: boolean }) {
  return (
    <figure className="w-full">
      <div className="mb-3 flex items-center justify-between text-xs">
        <figcaption className="font-medium text-foreground">Sample phrase</figcaption>
        <span className="text-muted-foreground">4 bars</span>
      </div>
      <div className="flex overflow-hidden rounded-md border border-border bg-card">
        <div className="flex w-10 shrink-0 flex-col justify-around border-r border-border bg-muted/70 px-1 text-[9px] text-muted-foreground">
          <span>C6</span>
          <span>A5</span>
          <span>F5</span>
          <span>D5</span>
          <span>C5</span>
        </div>
        <div
          className={`piano-roll-grid relative w-full ${compact ? "h-40" : "h-64"}`}
          role="img"
          aria-label="Piano roll preview showing a four-bar melody phrase"
        >
          {notes.map((note, index) => (
            <span
              key={`${note.left}-${note.top}`}
              className={`piano-note piano-note-${note.tone}`}
              style={{
                left: `${note.left}%`,
                top: `${note.top}%`,
                width: `${note.width}%`,
                animationDelay: `${index * 45}ms`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="ml-10 grid grid-cols-4 text-center text-[10px] text-muted-foreground">
        {[1, 2, 3, 4].map((bar) => (
          <span key={bar} className="border-r border-border py-1 last:border-r-0">
            {String(bar).padStart(2, "0")}
          </span>
        ))}
      </div>
    </figure>
  );
}