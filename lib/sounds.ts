let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) audioCtx = new AudioContext()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function playTone(freq: number, duration: number, type: OscillatorType, gain = 0.08, ramp = 0.02) {
  const ctx = getCtx()
  if (!ctx) return

  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  g.gain.setValueAtTime(0, ctx.currentTime)
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + ramp)
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

/** Soft pop when picking up a gate */
export function playPopUp() {
  playTone(520, 0.12, 'sine', 0.06, 0.015)
  setTimeout(() => playTone(780, 0.08, 'sine', 0.04, 0.01), 30)
}

/** Satisfying pop when dropping a gate */
export function playPopDown() {
  playTone(380, 0.14, 'sine', 0.07, 0.02)
  setTimeout(() => playTone(240, 0.1, 'triangle', 0.05, 0.015), 40)
}

/** Success chime after running circuit */
export function playSuccess() {
  playTone(523, 0.15, 'sine', 0.05, 0.02)
  setTimeout(() => playTone(659, 0.15, 'sine', 0.05, 0.02), 80)
  setTimeout(() => playTone(784, 0.2, 'sine', 0.04, 0.02), 160)
}

/** Error buzz */
export function playError() {
  playTone(180, 0.2, 'sawtooth', 0.04, 0.01)
}
