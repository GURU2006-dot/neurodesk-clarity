import { useRef, useCallback } from 'react'
import { useStore } from '../store'

type SoundType = 'click' | 'hover' | 'success' | 'error' | 'drop' | 'celebrate'

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null)
  const soundEnabled = useStore((s) => s.settings.soundEnabled)

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)()
    }
    return ctxRef.current
  }, [])

  const play = useCallback(
    (type: SoundType) => {
      if (!soundEnabled) return
      try {
        const ctx = getCtx()

        const playNote = (freq: number, start: number, dur: number, vol = 0.12) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.value = freq
          gain.gain.setValueAtTime(vol, start)
          gain.gain.exponentialRampToValueAtTime(0.001, start + dur)
          osc.start(start)
          osc.stop(start + dur)
        }

        const t = ctx.currentTime

        switch (type) {
          case 'click':
            playNote(600, t, 0.08, 0.08)
            break
          case 'hover':
            playNote(900, t, 0.04, 0.025)
            break
          case 'success':
            playNote(500, t, 0.1)
            playNote(700, t + 0.1, 0.2)
            break
          case 'error':
            playNote(200, t, 0.2)
            break
          case 'drop':
            playNote(300, t, 0.08)
            playNote(450, t + 0.05, 0.1)
            break
          case 'celebrate':
            // Happy fanfare — rising notes
            playNote(523, t,        0.12, 0.15) // C5
            playNote(659, t + 0.12, 0.12, 0.15) // E5
            playNote(784, t + 0.24, 0.12, 0.15) // G5
            playNote(1046,t + 0.36, 0.3,  0.18) // C6
            playNote(784, t + 0.48, 0.12, 0.12) // G5
            playNote(1046,t + 0.6,  0.4,  0.2)  // C6 long
            break
        }
      } catch {}
    },
    [soundEnabled, getCtx]
  )

  return { play }
}