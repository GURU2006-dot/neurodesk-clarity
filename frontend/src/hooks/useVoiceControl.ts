import { useRef, useState, useCallback } from 'react'

export type VoiceCommand =
  | { type: 'navigate'; tab: 'simplifier' | 'board' | 'settings' }
  | { type: 'timer_set_work'; minutes: number }
  | { type: 'timer_set_break'; minutes: number }
  | { type: 'timer_start' }
  | { type: 'timer_stop' }
  | { type: 'timer_reset' }
  | { type: 'timer_break' }
  | { type: 'game_open'; game: 'bubble' | 'breathe' | 'mole' | 'balloon' }
  | { type: 'game_close' }
  | { type: 'add_task'; title: string }
  | { type: 'overwhelm_mode' }
  | { type: 'logout' }
  | { type: 'unknown'; transcript: string }

function parseCommand(text: string): VoiceCommand {
  const t = text.toLowerCase().trim()

  // ── Navigation ──
  if (t.match(/open|go to|show|switch to/)) {
    if (t.match(/simplif|task simplif|break.?down|ai/)) return { type: 'navigate', tab: 'simplifier' }
    if (t.match(/board|my task|kanban|task list/))       return { type: 'navigate', tab: 'board' }
    if (t.match(/setting|preference|config/))            return { type: 'navigate', tab: 'settings' }
  }
  if (t.match(/^(simplif|task simplif)/))  return { type: 'navigate', tab: 'simplifier' }
  if (t.match(/^(board|my task)/))         return { type: 'navigate', tab: 'board' }
  if (t.match(/^settings?/))               return { type: 'navigate', tab: 'settings' }

  // ── Timer: set work duration ──
  const workMatch = t.match(/(?:set|focus|work).{0,20}?(\d+)\s*(?:min|minute)?/)
    || t.match(/(\d+)\s*(?:min|minute).{0,10}?(?:focus|work|timer)/)
    || t.match(/(?:focus|work)\s+for\s+(\d+)/)
  if (workMatch) {
    const mins = parseInt(workMatch[1])
    if (mins >= 1 && mins <= 120) return { type: 'timer_set_work', minutes: mins }
  }

  // ── Timer: set break duration ──
  const breakSetMatch = t.match(/(?:set|break).{0,20}?(\d+)\s*(?:min|minute)?.*break/)
    || t.match(/break\s+(?:for\s+)?(\d+)\s*(?:min|minute)?/)
  if (breakSetMatch) {
    const mins = parseInt(breakSetMatch[1])
    if (mins >= 1 && mins <= 60) return { type: 'timer_set_break', minutes: mins }
  }

  // ── Timer: start/stop/reset ──
  if (t.match(/start.{0,10}(focus|work|timer)|begin.{0,10}(focus|work)/)) return { type: 'timer_start' }
  if (t.match(/stop.{0,10}(focus|work|timer)|pause.{0,10}timer/))          return { type: 'timer_stop' }
  if (t.match(/reset.{0,10}timer|restart.{0,10}timer/))                     return { type: 'timer_reset' }
  if (t.match(/take.{0,10}break|start.{0,10}break|break.{0,10}time/))       return { type: 'timer_break' }

  // ── Games ──
  if (t.match(/bubble|bubble wrap/))          return { type: 'game_open', game: 'bubble' }
  if (t.match(/breath|breathe|breathing/))    return { type: 'game_open', game: 'breathe' }
  if (t.match(/whack|mole|whack.?a.?mole/))  return { type: 'game_open', game: 'mole' }
  if (t.match(/balloon|pop balloon/))         return { type: 'game_open', game: 'balloon' }
  if (t.match(/close game|stop game|exit game|no game/)) return { type: 'game_close' }

  // ── Add task ──
  const addMatch = t.match(/^(?:add|create|new)\s+(?:a\s+)?(?:task\s+)?(?:called\s+|named\s+|for\s+)?(.+)$/)
  if (addMatch && addMatch[1].length > 2) return { type: 'add_task', title: addMatch[1].trim() }

  // ── Overwhelm / one task ──
  if (t.match(/overwhelm|one task|one thing|focus mode|calm down/)) return { type: 'overwhelm_mode' }

  // ── Logout ──
  if (t.match(/log.?out|sign.?out/)) return { type: 'logout' }

  return { type: 'unknown', transcript: text }
}

export function useVoiceControl(onCommand: (cmd: VoiceCommand) => void) {
  const recognitionRef = useRef<any>(null)
  const [listening, setListening] = useState(false)
  const [lastTranscript, setLastTranscript] = useState('')
  const [error, setError] = useState('')

  const start = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Voice not supported in this browser. Try Chrome.')
      return
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    const r = new SpeechRecognition()
    r.continuous = false
    r.lang = 'en-US'
    r.interimResults = false
    r.maxAlternatives = 1

    r.onstart = () => { setListening(true); setError('') }

    r.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setLastTranscript(transcript)
      const cmd = parseCommand(transcript)
      onCommand(cmd)
      setListening(false)
    }

    r.onerror = (e: any) => {
      setError(e.error === 'not-allowed' ? 'Microphone permission denied.' : `Error: ${e.error}`)
      setListening(false)
    }

    r.onend = () => setListening(false)

    recognitionRef.current = r
    r.start()
  }, [onCommand])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return { start, stop, listening, lastTranscript, error }
}