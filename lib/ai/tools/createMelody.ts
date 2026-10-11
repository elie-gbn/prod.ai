import { tool } from "@openai/agents";
import { z } from "zod";
import { createMidiComposition } from "../midi";
import { genres, moods, musicalKeys } from "../music-options";

export const createMelody = tool({
  name: "create_melody_midi",
  description:
    "Compose an original eight-bar, four-track MIDI arrangement with melody, chord progression, bassline, and genre-aware drums or percussion. Use when the user asks to create music, a melody, chords, or a MIDI composition.",
  parameters: z.object({
    key: z.enum(musicalKeys).describe("The tonic note, such as C, F#, or Bb"),
    mode: z.enum(["major", "minor"]).describe("Major or minor tonality"),
    mood: z.enum(moods),
    genre: z.enum(genres),
  }),
  execute: async (parameters) => createMidiComposition(parameters),
});