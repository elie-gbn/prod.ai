import { tool } from "@openai/agents";
import { z } from "zod";
import { tracks } from "../data/tracks";

export const getInfoTrack = tool({
  name: "get_info_track",
  description:
    "Retrieve domain knowledge about music theory or music production workflows.",
  parameters: z.object({
    track: z.enum(["musicTheory", "musicProduction"]),
  }),
  execute: async ({ track }) => {
    return tracks[track];
  },
});