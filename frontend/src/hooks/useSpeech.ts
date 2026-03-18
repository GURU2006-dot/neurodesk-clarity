import { useCallback, useRef, useState } from 'react'
import { useStore } from '../store'

export function useSpeech() {
  const { speechRate, ttsEnabled } = useStore((s) => s.settings)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  // ── Text-to-Speech ──────────────────────────────────────────────
  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!ttsEnabled || !window.speechSynthesis) return
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = speechRate
      if (onEnd) u.onend = onEnd
      window.speechSynthesis.speak(u)
    },
    [speechRate, ttsEnabled]
  )

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
  }, [])

  // ── Speech-to-Text ──────────────────────────────────────────────
  const startListening = useCallback(
    (onResult: (text: string) => void, onError?: (msg: string) => void) => {
      const SR =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SR) {
        onError?.('Speech recognition not supported in this browser')
        return
      }
      const rec = new SR()
      rec.lang = 'en-US'
      rec.continuous = false
      rec.interimResults = false

      rec.onstart = () => setIsListening(true)
      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript
        onResult(transcript)
      }
      rec.onerror = (e: any) => {
        setIsListening(false)
        onError?.(`Voice error: ${e.error}`)
      }
      rec.onend = () => setIsListening(false)

      recognitionRef.current = rec
      rec.start()
    },
    []
  )

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  // ── Available Voices ────────────────────────────────────────────
  const getVoices = useCallback(() => {
    return window.speechSynthesis
      ?.getVoices()
      .filter((v) => v.lang.startsWith('en')) ?? []
  }, [])

  return { speak, stopSpeaking, startListening, stopListening, isListening, getVoices }
}
