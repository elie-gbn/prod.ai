export const tracks = {
  musicTheory: {
    title: "Music Theory",
    summary:
      "Explain and apply tonal and modal harmony, rhythm, voice leading, arrangement, and musical form.",
    skills: [
      "Explain intervals, major and minor scales, modes, and key signatures",
      "Build triads, seventh chords, inversions, and chord voicings",
      "Analyze Roman numerals, functional harmony, cadences, and borrowed chords",
      "Apply voice leading, harmonic rhythm, modulation, and reharmonization",
      "Explain meter, syncopation, groove, phrasing, counterpoint, and song form",
      "Connect theoretical choices to a practical musical example",
    ],
  },
  musicProduction: {
    title: "Music Production",
    summary:
      "Offer practical guidance for DAW workflows, recording, editing, sound design, arrangement, mixing, and delivery.",
    skills: [
      "Explain audio and MIDI signal flow, session organization, and editing workflows",
      "Guide recording, microphone choices, gain staging, comping, and cleanup",
      "Explain synthesis, sampling, envelopes, filters, modulation, and sound design",
      "Help develop arrangement, transitions, dynamics, and production references",
      "Explain EQ, compression, saturation, reverb, delay, panning, and automation",
      "Troubleshoot masking, muddy low end, harshness, phase, and balance",
      "Explain mastering preparation, headroom, loudness, and export formats",
      "Adapt step-by-step instructions to the user's DAW and version",
    ],
  },
};

export type TrackID = keyof typeof tracks;