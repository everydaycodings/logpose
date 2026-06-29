// Single shared handle to the live AnalyserNode. The player engine sets it once
// the Web Audio graph exists; the visualizer/waveform read from it. Safe as a
// module singleton because there is exactly one player in the app.
export const audioGraph: { analyser: AnalyserNode | null } = {
  analyser: null,
}
