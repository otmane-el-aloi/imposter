import { useState, useRef } from 'react'
import { SoundEffects } from '../types/game'

/**
 * Pure Web Audio API Sound Synthesizer.
 * 100% Offline with zero external MP3/WAV downloads or CDN requests.
 */
export function useSoundEffects(): SoundEffects {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('imposter_muted') === 'true'
  })
  const audioCtxRef = useRef<AudioContext | null>(null)

  const getAudioContext = (): AudioContext | null => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx()
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev
      localStorage.setItem('imposter_muted', String(next))
      return next
    })
  }

  // Crisp UI Click / Tap
  const playClick = () => {
    if (isMuted) return
    const ctx = getAudioContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.05)
  }

  // Subtle Card Flip Sweep
  const playCardFlip = () => {
    if (isMuted) return
    const ctx = getAudioContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(250, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.12)
  }

  // Timer Tick
  const playTick = () => {
    if (isMuted) return
    const ctx = getAudioContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(900, ctx.currentTime)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.03)
  }

  // Low Warning Buzzer / Elimination
  const playBuzzer = () => {
    if (isMuted) return
    const ctx = getAudioContext()
    if (!ctx) return
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()
    osc1.type = 'sawtooth'
    osc2.type = 'sawtooth'
    osc1.frequency.setValueAtTime(120, ctx.currentTime)
    osc2.frequency.setValueAtTime(127, ctx.currentTime) // slight detune creates tension beat
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)
    osc1.start()
    osc2.start()
    osc1.stop(ctx.currentTime + 0.5)
    osc2.stop(ctx.currentTime + 0.5)
  }

  // Celebratory Fanfare Arpeggio
  const playFanfare = () => {
    if (isMuted) return
    const ctx = getAudioContext()
    if (!ctx) return
    const notes = [261.63, 329.63, 392.00, 523.25] // C, E, G, High C
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1)
      gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + idx * 0.1)
      osc.stop(ctx.currentTime + idx * 0.1 + 0.3)
    })
  }

  // Playful Bubble Pop for Quick Reactions
  const playReactionPop = () => {
    if (isMuted) return
    const ctx = getAudioContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.08)
  }

  return {
    isMuted,
    toggleMute,
    playClick,
    playCardFlip,
    playTick,
    playBuzzer,
    playFanfare,
    playReactionPop
  }
}
