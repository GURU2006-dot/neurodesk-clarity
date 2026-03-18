import { useRef, useCallback } from 'react'
import { useStore } from '../store'

type SoundType = 'click' | 'hover' | 'success' | 'error' | 'drop'

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
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)

        const t = ctx.currentTime
        switch (type) {
          case 'click':
            osc.frequency.value = 600
            gain.gain.setValueAtTime(0.08, t)
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
            osc.start(t); osc.stop(t + 0.08)
            break
          case 'hover':
            osc.frequency.value = 900
            gain.gain.setValueAtTime(0.025, t)
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
            osc.start(t); osc.stop(t + 0.04)
            break
          case 'success':
            osc.frequency.setValueAtTime(500, t)
            osc.frequency.setValueAtTime(700, t + 0.1)
            gain.gain.setValueAtTime(0.1, t)
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
            osc.start(t); osc.stop(t + 0.3)
            break
          case 'error':
            osc.frequency.value = 200
            gain.gain.setValueAtTime(0.1, t)
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
            osc.start(t); osc.stop(t + 0.2)
            break
          case 'drop':
            osc.frequency.setValueAtTime(300, t)
            osc.frequency.setValueAtTime(450, t + 0.05)
            gain.gain.setValueAtTime(0.1, t)
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
            osc.start(t); osc.stop(t + 0.15)
            break
        }
      } catch {}
    },
    [soundEnabled, getCtx]
  )

  return { play }
}
