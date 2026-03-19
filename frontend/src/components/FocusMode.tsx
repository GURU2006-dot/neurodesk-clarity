import { useEffect, useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

const WORK_PRESETS  = [{ label:'15 min',value:15},{label:'25 min',value:25},{label:'45 min',value:45},{label:'60 min',value:60}]
const BREAK_PRESETS = [{ label:'5 min', value:5 },{label:'10 min',value:10},{label:'15 min',value:15}]

type Game = 'none' | 'bubble' | 'breathe' | 'mole' | 'balloon'

// ── Public interface exposed via ref ──────────────────────────────────────────
export interface FocusModeHandle {
  setWorkMinutes: (mins: number) => void
  setBreakMinutes: (mins: number) => void
  startWork: () => void
  startBreak: () => void
  stopTimer: () => void
  resetTimer: () => void
  openGame: (game: Game) => void
  closeGame: () => void
}

// ══════════════════════════════════════════════════════════════════════════════
// BUBBLE WRAP
// ══════════════════════════════════════════════════════════════════════════════
function BubbleWrap() {
  const SIZE = 48
  const [popped, setPopped] = useState<boolean[]>(Array(SIZE).fill(false))
  const [score, setScore] = useState(0)
  const allPopped = popped.every(Boolean)

  const pop = (i: number) => {
    if (popped[i]) return
    const next = [...popped]; next[i] = true; setPopped(next); setScore(s => s + 1)
  }
  const reset = () => { setPopped(Array(SIZE).fill(false)); setScore(0) }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full">
        <p className="text-sm font-semibold text-stone-700">🫧 Bubble Wrap</p>
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{score}/{SIZE} popped</span>
      </div>
      {allPopped ? (
        <div className="text-center py-4">
          <div className="text-4xl mb-2">🎉</div>
          <p className="font-semibold text-stone-700 mb-3">All bubbles popped!</p>
          <button onClick={reset} className="px-5 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">New Sheet 🫧</button>
        </div>
      ) : (
        <div className="grid gap-1.5 p-3 bg-blue-50 rounded-2xl border border-blue-100" style={{ gridTemplateColumns:'repeat(8, 1fr)' }}>
          {popped.map((p, i) => (
            <button key={i} onClick={() => pop(i)}
              className={`w-8 h-8 rounded-full transition-all duration-150
                ${p ? 'bg-blue-100 border border-blue-200 scale-75 opacity-40 cursor-default'
                    : 'bg-blue-400 hover:bg-blue-500 active:scale-90 shadow-md hover:scale-105 cursor-pointer'}`}
              style={{ boxShadow: p ? 'none' : 'inset 0 -2px 4px rgba(0,0,0,0.2), 0 2px 4px rgba(59,130,246,0.4)' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// BREATHING EXERCISE — fixed useEffect
// ══════════════════════════════════════════════════════════════════════════════
const BREATH_CYCLE = [
  { phase: 'inhale', duration: 4, label: 'Breathe In…',  color: '#10b981' },
  { phase: 'hold',   duration: 4, label: 'Hold…',        color: '#3b82f6' },
  { phase: 'exhale', duration: 6, label: 'Breathe Out…', color: '#8b5cf6' },
  { phase: 'rest',   duration: 2, label: 'Rest…',        color: '#f59e0b' },
] as const

function BreathingExercise() {
  const [running,   setRunning]   = useState(false)
  const [phaseIdx,  setPhaseIdx]  = useState(0)
  const [countdown, setCountdown] = useState<number>(BREATH_CYCLE[0].duration)
  const [cycles,    setCycles]    = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const current = BREATH_CYCLE[phaseIdx]

  // Tick countdown every second
  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setCountdown(c => (c > 1 ? c - 1 : 0))
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  // When countdown reaches 0 — advance to next phase
  useEffect(() => {
    if (!running || countdown > 0) return
    const next = (phaseIdx + 1) % BREATH_CYCLE.length
    if (next === 0) setCycles(cy => cy + 1)
    setPhaseIdx(next)
    setCountdown(BREATH_CYCLE[next].duration)
  }, [countdown, running])

  const toggle = () => {
    if (running) {
      setRunning(false)
      if (intervalRef.current) clearInterval(intervalRef.current)
      setPhaseIdx(0)
      setCountdown(BREATH_CYCLE[0].duration)
    } else {
      setRunning(true)
    }
  }

  const scale = current.phase === 'inhale' || current.phase === 'hold' ? 1.35 : 0.75

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full">
        <p className="text-sm font-semibold text-stone-700">🌬 Breathing Exercise</p>
        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">{cycles} cycles</span>
      </div>

      <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
        <div className="absolute rounded-full border-4 transition-all"
          style={{ width: 160, height: 160, borderColor: current.color, opacity: running ? 0.3 : 0.15 }} />
        <div className="rounded-full flex items-center justify-center transition-all"
          style={{
            width: 120, height: 120,
            background: `radial-gradient(circle, ${current.color}cc, ${current.color}66)`,
            transform: `scale(${running ? scale : 1})`,
            transitionDuration: `${current.duration * 0.9}s`,
            transitionTimingFunction: current.phase === 'inhale' ? 'ease-in' : 'ease-out',
            boxShadow: `0 0 30px ${current.color}44`,
          }}>
          <span className="text-3xl">{running ? countdown : '🫁'}</span>
        </div>
      </div>

      <div className="text-center">
        <p className="font-semibold" style={{ color: running ? current.color : '#78716c' }}>
          {running ? current.label : 'Ready to breathe?'}
        </p>
        <p className="text-xs text-stone-400 mt-1">
          {running ? `${countdown}s remaining in this phase` : '4-4-6-2 box breathing technique'}
        </p>
      </div>

      <button onClick={toggle}
        className="px-6 py-2.5 rounded-full font-semibold text-sm text-white transition-all active:scale-95"
        style={{ background: running ? '#ef4444' : current.color }}>
        {running ? '⏹ Stop' : '▶ Start Breathing'}
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// WHACK-A-MOLE
// ══════════════════════════════════════════════════════════════════════════════
const MOLE_EMOJIS = ['🐹', '🐭', '🦔', '🐿️']
const BAD_EMOJIS  = ['💣', '🕷️', '👻']

function WhackAMole() {
  const [active,   setActive]   = useState(false)
  const [holes,    setHoles]    = useState<(string | null)[]>(Array(9).fill(null))
  const [score,    setScore]    = useState(0)
  const [misses,   setMisses]   = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [lastHit,  setLastHit]  = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const moleRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback(() => {
    setActive(false)
    if (timerRef.current) clearInterval(timerRef.current)
    if (moleRef.current)  clearInterval(moleRef.current)
    setHoles(Array(9).fill(null))
  }, [])

  useEffect(() => { if (timeLeft === 0 && active) stop() }, [timeLeft, active, stop])

  const start = () => {
    setScore(0); setMisses(0); setTimeLeft(30); setActive(true)
    timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000)
    moleRef.current  = setInterval(() => {
      setHoles(prev => {
        const next = [...prev]
        next.forEach((_, i) => { if (Math.random() > 0.6) next[i] = null })
        const empty = next.map((v, i) => v === null ? i : -1).filter(i => i >= 0)
        if (empty.length > 0) {
          const idx    = empty[Math.floor(Math.random() * empty.length)]
          const isBad  = Math.random() < 0.2
          next[idx]    = isBad
            ? BAD_EMOJIS[Math.floor(Math.random() * BAD_EMOJIS.length)]
            : MOLE_EMOJIS[Math.floor(Math.random() * MOLE_EMOJIS.length)]
        }
        return next
      })
    }, 800)
  }

  const whack = (i: number) => {
    if (!active || !holes[i]) return
    const isBad = BAD_EMOJIS.includes(holes[i]!)
    if (isBad) { setMisses(m => m + 1); setScore(s => Math.max(0, s - 2)) }
    else { setScore(s => s + 10); setLastHit(i); setTimeout(() => setLastHit(null), 300) }
    setHoles(prev => { const n = [...prev]; n[i] = null; return n })
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full">
        <p className="text-sm font-semibold text-stone-700">🔨 Whack-a-Mole</p>
        <div className="flex gap-2 text-xs font-medium">
          <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">⭐ {score}</span>
          {active && <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-full">⏱ {timeLeft}s</span>}
        </div>
      </div>
      {!active ? (
        <div className="text-center">
          {timeLeft === 0 && (
            <div className="mb-3">
              <div className="text-3xl mb-1">🎯</div>
              <p className="font-semibold text-stone-700">Score: {score}</p>
              <p className="text-xs text-stone-500">Misses: {misses}</p>
            </div>
          )}
          <button onClick={start}
            className="px-6 py-2.5 rounded-full bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 active:scale-95 transition-all">
            {timeLeft === 0 ? '🔄 Play Again' : '▶ Start Game'}
          </button>
          <p className="text-xs text-stone-400 mt-2">Avoid 💣🕷️👻 — they cost 2 points!</p>
        </div>
      ) : (
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {holes.map((mole, i) => (
            <button key={i} onClick={() => whack(i)}
              className={`w-16 h-16 rounded-2xl border-2 transition-all duration-150 text-2xl flex items-center justify-center
                ${mole
                  ? lastHit === i
                    ? 'bg-yellow-100 border-yellow-300 scale-90'
                    : 'bg-amber-50 border-amber-300 hover:scale-95 active:scale-90 cursor-pointer animate-bounce'
                  : 'bg-stone-100 border-stone-200 cursor-default'
                }`}
              style={{ animationDuration: mole ? '0.5s' : undefined }}>
              {mole || ''}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// BALLOON BURST
// ══════════════════════════════════════════════════════════════════════════════
const BALLOON_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#06b6d4']

interface Balloon {
  id: number; x: number; y: number; size: number
  color: string; popped: boolean; rising: number
}

function BalloonBurst() {
  const [balloons, setBalloons] = useState<Balloon[]>([])
  const [score,    setScore]    = useState(0)
  const [active,   setActive]   = useState(false)
  const nextId      = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const riseRef     = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = () => {
    setScore(0); setActive(true); setBalloons([])
    intervalRef.current = setInterval(() => {
      setBalloons(prev => {
        if (prev.filter(b => !b.popped).length >= 12) return prev
        return [...prev, {
          id: nextId.current++,
          x: 5 + Math.random() * 80,
          y: 90,
          size: 40 + Math.random() * 30,
          color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
          popped: false,
          rising: 0.3 + Math.random() * 0.7,
        }]
      })
    }, 1200)
    riseRef.current = setInterval(() => {
      setBalloons(prev =>
        prev.map(b => b.popped ? b : { ...b, y: b.y - b.rising }).filter(b => b.popped || b.y > -10)
      )
    }, 50)
  }

  const stop = () => {
    setActive(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (riseRef.current)     clearInterval(riseRef.current)
    setBalloons([])
  }

  const popBalloon = (id: number) => {
    setBalloons(prev => prev.map(b => b.id === id ? { ...b, popped: true } : b))
    setScore(s => s + 5)
    setTimeout(() => setBalloons(prev => prev.filter(b => b.id !== id)), 400)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full">
        <p className="text-sm font-semibold text-stone-700">🎈 Balloon Burst</p>
        <span className="text-xs font-medium text-pink-600 bg-pink-50 px-2 py-1 rounded-full">🎈 {score} pts</span>
      </div>
      <div className="relative w-full rounded-2xl overflow-hidden border border-stone-200"
        style={{ height: 200, background: 'linear-gradient(180deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)' }}>
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl mb-2">🎈</div>
            <button onClick={start}
              className="px-5 py-2 rounded-full bg-pink-500 text-white font-semibold text-sm hover:bg-pink-600 active:scale-95 transition-all">
              {score > 0 ? `🔄 Play Again (${score} pts)` : '▶ Pop Balloons!'}
            </button>
          </div>
        )}
        {balloons.map(b => (
          <button key={b.id} onClick={() => popBalloon(b.id)}
            className="absolute transition-all cursor-pointer select-none"
            style={{
              left: `${b.x}%`, top: `${b.y}%`, fontSize: b.size,
              transform: b.popped ? 'scale(1.8)' : 'scale(1)',
              opacity: b.popped ? 0 : 1,
              transitionDuration: b.popped ? '0.3s' : '0.05s',
              filter: b.popped ? 'blur(4px)' : 'none',
              lineHeight: 1,
            }}>
            🎈
          </button>
        ))}
        <div className="absolute top-2 left-4 text-2xl opacity-40 pointer-events-none">☁️</div>
        <div className="absolute top-5 right-8 text-xl opacity-30 pointer-events-none">☁️</div>
      </div>
      {active && (
        <button onClick={stop}
          className="px-4 py-1.5 rounded-full bg-stone-200 text-stone-600 text-xs font-medium hover:bg-stone-300">
          Stop
        </button>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN FOCUS MODE — with forwardRef for voice control
// ══════════════════════════════════════════════════════════════════════════════
const FocusMode = forwardRef<FocusModeHandle>((_, ref) => {
  const [mode,         setMode]         = useState<'idle' | 'work' | 'break'>('idle')
  const [workMins,     setWorkMins]     = useState(25)
  const [breakMins,    setBreakMins]    = useState(5)
  const [seconds,      setSeconds]      = useState(25 * 60)
  const [breakSeconds, setBreakSeconds] = useState(5 * 60)
  const [sessions,     setSessions]     = useState(0)
  const [activeGame,   setActiveGame]   = useState<Game>('none')
  const [voiceNotice,  setVoiceNotice]  = useState('')

  const showNotice = (msg: string) => {
    setVoiceNotice(msg)
    setTimeout(() => setVoiceNotice(''), 2500)
  }

  // ── Expose methods via ref for voice control ──────────────────────────────
  useImperativeHandle(ref, () => ({
    setWorkMinutes: (mins: number) => {
      setWorkMins(mins)
      setSeconds(mins * 60)
      showNotice(`⏱ Work timer set to ${mins} minutes`)
    },
    setBreakMinutes: (mins: number) => {
      setBreakMins(mins)
      setBreakSeconds(mins * 60)
      showNotice(`☕ Break timer set to ${mins} minutes`)
    },
    startWork: () => {
      setMode('work')
      setSeconds(workMins * 60)
      showNotice('▶ Focus timer started!')
    },
    startBreak: () => {
      setMode('break')
      setBreakSeconds(breakMins * 60)
      showNotice('☕ Break started!')
    },
    stopTimer: () => {
      setMode('idle')
      showNotice('⏹ Timer stopped')
    },
    resetTimer: () => {
      setMode('idle')
      setSeconds(workMins * 60)
      setBreakSeconds(breakMins * 60)
      showNotice('↺ Timer reset')
    },
    openGame: (game: Game) => {
      setActiveGame(game)
      const names: Record<Game, string> = {
        bubble: 'Bubble Wrap', breathe: 'Breathing',
        mole: 'Whack-a-Mole', balloon: 'Balloon Burst', none: ''
      }
      showNotice(`🎮 Opening ${names[game]}`)
    },
    closeGame: () => {
      setActiveGame('none')
      showNotice('🎮 Game closed')
    },
  }))

  // ── Timer countdown ───────────────────────────────────────────────────────
  useEffect(() => {
    let t: ReturnType<typeof setInterval> | null = null
    if (mode === 'work')  t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000)
    if (mode === 'break') t = setInterval(() => setBreakSeconds(s => Math.max(0, s - 1)), 1000)
    return () => { if (t) clearInterval(t) }
  }, [mode])

  useEffect(() => {
    if (mode === 'work' && seconds === 0) {
      setMode('break'); setBreakSeconds(breakMins * 60); setSessions(s => s + 1)
    }
  }, [seconds, mode, breakMins])

  useEffect(() => {
    if (mode === 'break' && breakSeconds === 0) {
      setMode('idle'); setSeconds(workMins * 60)
    }
  }, [breakSeconds, mode, workMins])

  const startWork  = () => { setMode('work');  setSeconds(workMins * 60) }
  const startBreak = () => { setMode('break'); setBreakSeconds(breakMins * 60) }
  const reset      = () => { setMode('idle');  setSeconds(workMins * 60); setBreakSeconds(breakMins * 60) }

  const totalWork  = workMins * 60
  const totalBreak = breakMins * 60
  const progress   = mode === 'work'
    ? ((totalWork - seconds) / totalWork) * 100
    : mode === 'break'
    ? ((totalBreak - breakSeconds) / totalBreak) * 100
    : 0

  const GAMES: { id: Game; emoji: string; label: string }[] = [
    { id: 'breathe', emoji: '🌬', label: 'Breathe'  },
    { id: 'bubble',  emoji: '🫧', label: 'Bubbles'  },
    { id: 'mole',    emoji: '🔨', label: 'Whack!'   },
    { id: 'balloon', emoji: '🎈', label: 'Balloons' },
  ]

  return (
    <div className="space-y-3">

      {/* Voice notice banner */}
      {voiceNotice && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <span className="text-lg">🎤</span>
          <span className="text-sm font-medium text-purple-700">{voiceNotice}</span>
        </div>
      )}

      {/* ── Timer Card ── */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-stone-700">⏱ Focus Timer</p>
            <p className="text-xs text-stone-500">{sessions} sessions completed today</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium
            ${mode === 'work'  ? 'bg-emerald-100 text-emerald-700'
            : mode === 'break' ? 'bg-blue-100 text-blue-700'
            :                    'bg-stone-100 text-stone-500'}`}>
            {mode === 'work' ? '💪 Working' : mode === 'break' ? '☕ Break' : '💤 Idle'}
          </span>
        </div>

        {/* Progress ring */}
        <div className="flex items-center justify-center mb-4">
          <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
            <svg className="absolute" width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="54" fill="none" stroke="#f5f5f4" strokeWidth="8" />
              <circle cx="60" cy="60" r="54" fill="none"
                stroke={mode === 'work' ? '#10b981' : mode === 'break' ? '#3b82f6' : '#d6d3d1'}
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="text-center z-10">
              <div className="text-2xl font-bold text-stone-800">
                {mode === 'break' ? fmt(breakSeconds) : fmt(seconds)}
              </div>
              <div className="text-xs text-stone-400">
                {mode === 'break' ? 'break' : 'focus'}
              </div>
            </div>
          </div>
        </div>

        {/* Presets — only when idle */}
        {mode === 'idle' && (
          <div className="mb-4 space-y-2">
            <div>
              <p className="text-xs text-stone-500 mb-1.5 font-medium">Work duration</p>
              <div className="flex gap-2 flex-wrap">
                {WORK_PRESETS.map(p => (
                  <button key={p.value}
                    onClick={() => { setWorkMins(p.value); setSeconds(p.value * 60) }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                      ${workMins === p.value
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-emerald-400'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-stone-500 mb-1.5 font-medium">Break duration</p>
              <div className="flex gap-2 flex-wrap">
                {BREAK_PRESETS.map(p => (
                  <button key={p.value}
                    onClick={() => { setBreakMins(p.value); setBreakSeconds(p.value * 60) }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                      ${breakMins === p.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-blue-400'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {mode !== 'work' && (
            <button onClick={startWork}
              className="flex-1 py-2.5 rounded-full bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 transition-all active:scale-95">
              {mode === 'idle' ? '▶ Start Focus' : '↩ Back to Work'}
            </button>
          )}
          {mode === 'work' && (
            <button onClick={startBreak}
              className="flex-1 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all active:scale-95">
              ☕ Take Break
            </button>
          )}
          <button onClick={reset}
            className="px-4 py-2.5 rounded-full bg-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-300 transition-all">
            ↺
          </button>
        </div>

        <p className="text-xs text-stone-400 text-center mt-3">
          🎤 Try: <span className="italic">"Set focus 30 minutes"</span> or <span className="italic">"Start focus"</span>
        </p>
      </div>

      {/* ── Games Card ── */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-stone-700">🎮 Stress Relief</p>
            <p className="text-xs text-stone-500">Pick a game or say its name!</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {GAMES.map(g => (
            <button key={g.id}
              onClick={() => setActiveGame(activeGame === g.id ? 'none' : g.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all
                ${activeGame === g.id
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'}`}>
              {g.emoji} {g.label}
            </button>
          ))}
        </div>

        {activeGame === 'none' && (
          <div className="text-center py-6 text-stone-400">
            <div className="text-4xl mb-2">🎮</div>
            <p className="text-sm">Pick a game above or say</p>
            <p className="text-xs text-stone-400 italic mt-1">"Start bubble wrap" / "Open breathing"</p>
          </div>
        )}
        {activeGame === 'breathe' && <BreathingExercise />}
        {activeGame === 'bubble'  && <BubbleWrap />}
        {activeGame === 'mole'    && <WhackAMole />}
        {activeGame === 'balloon' && <BalloonBurst />}
      </div>

    </div>
  )
})

FocusMode.displayName = 'FocusMode'
export default FocusMode