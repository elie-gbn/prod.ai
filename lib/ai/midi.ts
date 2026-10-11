import { randomInt } from "node:crypto";
import { genres, moods, musicalKeys } from "./music-options";

type Mood = (typeof moods)[number];
type Genre = (typeof genres)[number];
type KeyName = (typeof musicalKeys)[number];
type NoteEvent = {
  tick: number;
  pitch: number;
  velocity: number;
  duration: number;
};

const pitchClasses: Record<KeyName, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

const tempoByGenre: Record<Genre, number> = {
  pop: 112,
  rock: 124,
  "hip-hop": 88,
  jazz: 108,
  electronic: 124,
  classical: 96,
  cinematic: 84,
  soul: 78,
  funk: 108,
  folk: 96,
  country: 110,
  reggae: 76,
  house: 124,
  techno: 132,
  ambient: 70,
  "lo-fi": 82,
  metal: 140,
  orchestral: 90,
  disco: 120,
  trap: 140,
};

const progressions: Record<Mood, number[][]> = {
  upbeat: [[0, 4, 5, 3], [0, 3, 4, 4]],
  calm: [[0, 3, 1, 4], [0, 4, 3, 3]],
  dark: [[0, 5, 2, 6], [0, 3, 5, 4]],
  dreamy: [[0, 3, 5, 4], [0, 5, 3, 4]],
  tense: [[0, 1, 4, 5], [0, 5, 1, 4]],
  hopeful: [[0, 4, 3, 5], [0, 3, 4, 4]],
  melancholic: [[0, 5, 3, 4], [5, 3, 0, 4]],
  energetic: [[0, 4, 5, 3], [0, 5, 3, 4]],
  peaceful: [[0, 3, 1, 4], [0, 4, 3, 3]],
  mysterious: [[0, 5, 2, 6], [0, 1, 5, 4]],
  romantic: [[0, 3, 4, 5], [0, 5, 3, 4]],
  playful: [[0, 3, 4, 3], [0, 4, 3, 4]],
  nostalgic: [[5, 3, 0, 4], [0, 3, 5, 4]],
};

const fourOnTheFloorGenres = new Set<Genre>([
  "electronic",
  "house",
  "techno",
  "disco",
]);
const halfTimeGenres = new Set<Genre>(["hip-hop", "lo-fi", "trap"]);
const syncopatedBassGenres = new Set<Genre>([
  "funk",
  "reggae",
  "hip-hop",
  "trap",
]);
const sparsePercussionGenres = new Set<Genre>([
  "ambient",
  "classical",
  "cinematic",
  "orchestral",
]);

function variableLength(value: number) {
  const bytes = [value & 0x7f];
  let remaining = value >>> 7;

  while (remaining > 0) {
    bytes.unshift((remaining & 0x7f) | 0x80);
    remaining >>>= 7;
  }

  return bytes;
}

function textBytes(value: string) {
  const encoded = Array.from(value, (character) => character.charCodeAt(0));
  return [0xff, 0x03, ...variableLength(encoded.length), ...encoded];
}

function makeTrack(events: NoteEvent[], channel: number, name: string, tempo?: number) {
  const bytes = [0x00, ...textBytes(name)];

  if (tempo) {
    const microsecondsPerBeat = Math.round(60_000_000 / tempo);
    bytes.push(
      0x00,
      0xff,
      0x51,
      0x03,
      (microsecondsPerBeat >> 16) & 0xff,
      (microsecondsPerBeat >> 8) & 0xff,
      microsecondsPerBeat & 0xff,
      0x00,
      0xff,
      0x58,
      0x04,
      0x04,
      0x02,
      0x18,
      0x08,
    );
  }

  const noteEvents = events.flatMap((event) => [
    { tick: event.tick, pitch: event.pitch, velocity: event.velocity, on: true },
    {
      tick: event.tick + event.duration,
      pitch: event.pitch,
      velocity: 0,
      on: false,
    },
  ]);
  noteEvents.sort((left, right) => left.tick - right.tick || Number(left.on) - Number(right.on));

  let previousTick = 0;
  for (const event of noteEvents) {
    bytes.push(
      ...variableLength(event.tick - previousTick),
      (event.on ? 0x90 : 0x80) | channel,
      event.pitch,
      event.velocity,
    );
    previousTick = event.tick;
  }

  bytes.push(0x00, 0xff, 0x2f, 0x00);
  return [
    0x4d,
    0x54,
    0x72,
    0x6b,
    (bytes.length >>> 24) & 0xff,
    (bytes.length >>> 16) & 0xff,
    (bytes.length >>> 8) & 0xff,
    bytes.length & 0xff,
    ...bytes,
  ];
}

function scaleFor(mode: "major" | "minor") {
  return mode === "major"
    ? [0, 2, 4, 5, 7, 9, 11]
    : [0, 2, 3, 5, 7, 8, 10];
}

export function createMidiComposition({
  key,
  mode,
  mood,
  genre,
}: {
  key: KeyName;
  mode: "major" | "minor";
  mood: Mood;
  genre: Genre;
}) {
  const tonic = pitchClasses[key];
  const scale = scaleFor(mode);
  const progression = progressions[mood][randomInt(progressions[mood].length)];
  const tempo = tempoByGenre[genre] + randomInt(-5, 6);
  const ticksPerBeat = 480;
  const ticksPerBar = ticksPerBeat * 4;
  const harmony: NoteEvent[] = [];
  const melody: NoteEvent[] = [];
  const bassline: NoteEvent[] = [];
  const percussion: NoteEvent[] = [];
  const rhythmByGenre: Record<Genre, number[]> = {
    pop: [0, 1, 2, 3, 4, 5, 6, 7],
    rock: [0, 1, 2, 3, 4, 5, 6, 7],
    "hip-hop": [0, 3, 4, 6, 7],
    jazz: [0, 2, 3, 5, 6, 7],
    electronic: [0, 1, 2, 3, 4, 5, 6, 7],
    classical: [0, 2, 4, 5, 6],
    cinematic: [0, 2, 4, 6],
    soul: [0, 2, 3, 5, 6],
    funk: [0, 2, 3, 4, 6, 7],
    folk: [0, 2, 4, 6],
    country: [0, 2, 4, 6],
    reggae: [0, 2, 4, 7],
    house: [0, 2, 4, 6],
    techno: [0, 2, 4, 6],
    ambient: [0, 4],
    "lo-fi": [0, 3, 4, 7],
    metal: [0, 1, 2, 4, 5, 6],
    orchestral: [0, 2, 4, 5, 6],
    disco: [0, 2, 3, 4, 6, 7],
    trap: [0, 3, 4, 6, 7],
  };
  const rhythm = rhythmByGenre[genre];
  let previousMelodyPitch = tonic + 72;

  for (let bar = 0; bar < 8; bar += 1) {
    const degree = progression[bar % progression.length];
    const barTick = bar * ticksPerBar;
    const chordPitches = [0, 2, 4].map(
      (offset) => 48 + tonic + scale[(degree + offset) % 7] + 12 * Math.floor((degree + offset) / 7),
    );

    for (const pitch of chordPitches) {
      harmony.push({
        tick: bar * ticksPerBar,
        pitch,
        velocity: 55 + randomInt(0, 13),
        duration: ticksPerBar - 18,
      });
    }

    const bassRoot = 36 + tonic + scale[degree];
    const bassFifth = 36 + tonic + scale[(degree + 4) % 7];
    bassline.push(
      {
        tick: barTick,
        pitch: bassRoot,
        velocity: 78 + randomInt(0, 15),
        duration: ticksPerBeat * 1.35,
      },
      {
        tick: barTick + ticksPerBeat * 2,
        pitch: halfTimeGenres.has(genre) ? bassRoot : bassFifth,
        velocity: 70 + randomInt(0, 15),
        duration: ticksPerBeat * 1.35,
      },
    );

    if (syncopatedBassGenres.has(genre)) {
      const pickupTick = barTick + ticksPerBeat * 1.5;
      bassline.push({
        tick: pickupTick,
        pitch: randomInt(0, 100) < 65 ? bassRoot : bassFifth,
        velocity: 62 + randomInt(0, 14),
        duration: ticksPerBeat * 0.35,
      });
    }

    const addPercussionHit = (
      slot: number,
      pitch: number,
      velocity: number,
      duration = ticksPerBeat / 4,
    ) => {
      percussion.push({
        tick: barTick + slot * (ticksPerBeat / 2),
        pitch,
        velocity: velocity + randomInt(0, 9),
        duration,
      });
    };

    if (sparsePercussionGenres.has(genre)) {
      if (bar === 0 || bar === 4) {
        addPercussionHit(0, genre === "ambient" ? 49 : 47, 40, ticksPerBeat * 3);
      }
      if ((genre === "cinematic" || genre === "orchestral") && bar === 7) {
        addPercussionHit(6, 49, 48, ticksPerBeat * 2);
      }
    } else if (fourOnTheFloorGenres.has(genre)) {
      for (const slot of [0, 2, 4, 6]) addPercussionHit(slot, 36, 88);
      for (const slot of [2, 6]) addPercussionHit(slot, 39, 65);
      for (let slot = 0; slot < 8; slot += 1) {
        if (randomInt(0, 100) < 88) addPercussionHit(slot, 42, slot % 2 ? 40 : 54);
      }
    } else if (halfTimeGenres.has(genre)) {
      addPercussionHit(0, 36, 82);
      if (randomInt(0, 100) < 45) addPercussionHit(3, 36, 62);
      addPercussionHit(4, 38, 76);
      for (let slot = 0; slot < 8; slot += 1) {
        if (randomInt(0, 100) < (slot % 2 ? 34 : 68)) {
          addPercussionHit(slot, 42, slot % 2 ? 38 : 50);
        }
      }
    } else if (genre === "reggae") {
      addPercussionHit(0, 36, 76);
      for (const slot of [2, 6]) addPercussionHit(slot, 37, 57);
      for (const slot of [1, 3, 5, 7]) addPercussionHit(slot, 42, 48);
    } else if (genre === "jazz") {
      addPercussionHit(0, 36, 60);
      addPercussionHit(6, 38, 56);
      for (const slot of [0, 2, 4, 6]) addPercussionHit(slot, 51, 50);
    } else if (genre === "metal") {
      for (const slot of [0, 2, 4, 6]) addPercussionHit(slot, 36, 94);
      for (const slot of [2, 6]) addPercussionHit(slot, 38, 88);
      addPercussionHit(0, 49, 78);
      for (const slot of [1, 3, 5, 7]) addPercussionHit(slot, 42, 62);
    } else {
      for (const slot of [0, 4]) addPercussionHit(slot, 36, 80);
      for (const slot of [2, 6]) addPercussionHit(slot, 38, 72);
      for (let slot = 0; slot < 8; slot += 1) {
        if (randomInt(0, 100) < 68) {
          addPercussionHit(slot, 42, slot % 2 ? 39 : 52);
        }
      }
    }

    for (const slot of rhythm) {
      if (
        slot > 0 &&
        randomInt(0, 100) <
          (mood === "calm" || mood === "peaceful" ? 24 : 12)
      ) {
        continue;
      }

      const isStrongBeat = slot % 2 === 0;
      const chordTones = [0, 2, 4].map((offset) => (degree + offset) % 7);
      const degreeChoice =
        bar === 7 && slot >= 6
          ? 0
          : isStrongBeat && randomInt(0, 100) < 72
            ? chordTones[randomInt(chordTones.length)]
            : randomInt(0, scale.length);
      const octave = randomInt(0, 100) < 18 ? 1 : 0;
      let pitch = 60 + tonic + scale[degreeChoice] + octave * 12;

      if (slot > 0 && randomInt(0, 100) < 55) {
        const step = randomInt(-2, 3);
        const priorScaleIndex = scale.findIndex(
          (interval) => (previousMelodyPitch - 60 - tonic) % 12 === interval,
        );
        const nextIndex = Math.max(0, Math.min(6, priorScaleIndex + step));
        pitch = 60 + tonic + scale[nextIndex] + octave * 12;
      }

      previousMelodyPitch = pitch;
      const tick = bar * ticksPerBar + slot * (ticksPerBeat / 2);
      melody.push({
        tick,
        pitch,
        velocity: 74 + randomInt(0, 20),
        duration: ticksPerBeat / 2 - 24,
      });
    }
  }

  const trackData = [
    ...makeTrack(melody, 0, "Original melody"),
    ...makeTrack(harmony, 1, "Chord progression", tempo),
    ...makeTrack(bassline, 2, "Bassline"),
    ...makeTrack(percussion, 9, "Drums and percussion"),
  ];
  const midiBytes = [
    0x4d,
    0x54,
    0x68,
    0x64,
    0x00,
    0x00,
    0x00,
    0x06,
    0x00,
    0x01,
    0x00,
    0x04,
    0x01,
    0xe0,
    ...trackData,
  ];
  const safeKey = key.replace("#", "sharp").toLowerCase();

  return {
    filename: `${safeKey}-${mode}-${mood}-${genre.replaceAll("-", "")}.mid`,
    base64: Buffer.from(midiBytes).toString("base64"),
    key,
    mode,
    mood,
    genre,
    tempo,
    bars: 8,
  };
}