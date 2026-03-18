import { useEffect, useState } from 'react'

export default function FocusMode() {
  const [mode, setMode] = useState<'idle' | 'work' | 'break'>('idle')
  const [seconds, setSeconds] = useState(25 * 60)
  const [breakSeconds, setBreakSeconds] = useState(5 * 60)
  const [score, setScore] = useState(0)

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    if (mode === 'work') {
      timer = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000)
    } else if (mode === 'break') {
      timer = setInterval(() => setBreakSeconds((s) => Math.max(0, s - 1)), 1000)
    }
    return () => { if (timer) clearInterval(timer) }
  }, [mode])

  useEffect(() => {
    if (mode === 'work' && seconds === 0) {
      setMode('break')
      setBreakSeconds(5 * 60)
    }
  }, [seconds, mode])

  useEffect(() => {
    if (mode === 'break' && breakSeconds === 0) {
      setMode('idle')
      setSeconds(25 * 60)
    }
  }, [breakSeconds, mode])

  const formatTime = (s: number) => {
    const m = String(Math.floor(s / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    return `${m}:${sec}`
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-stone-700">Focus Mode</p>
          <p className="text-xs text-stone-500">Work in intervals and take short breaks.</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${mode === 'work' ? 'bg-emerald-100 text-emerald-700' : mode === 'break' ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-500'}`}>
          {mode === 'work' ? 'Working' : mode === 'break' ? 'Break' : 'Idle'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-stone-50 p-3 rounded-xl text-center">
          <p className="text-xs text-stone-500 uppercase">Work Timer</p>
          <p className="text-2xl font-semibold text-stone-800">{formatTime(seconds)}</p>
        </div>
        <div className="bg-stone-50 p-3 rounded-xl text-center">
          <p className="text-xs text-stone-500 uppercase">Break Timer</p>
          <p className="text-2xl font-semibold text-stone-800">{formatTime(breakSeconds)}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => { setMode('work'); setSeconds(25 * 60) }}
          className="flex-1 px-3 py-2 rounded-full bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800"
        >Start Work</button>
        <button
          onClick={() => { setMode('break'); setBreakSeconds(5 * 60) }}
          className="flex-1 px-3 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >Take Break</button>
        <button
          onClick={() => { setMode('idle'); setScore(0); setSeconds(25 * 60); setBreakSeconds(5 * 60) }}
          className="flex-1 px-3 py-2 rounded-full bg-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-300"
        >Reset</button>
      </div>

      <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-medium text-stone-700">Stress Relief Game</p>
            <p className="text-xs text-stone-500">Click quickly for points while on break.</p>
          </div>
          <span className="text-sm font-semibold text-emerald-600">Score: {score}</span>
        </div>
        <button
          onClick={() => setScore((s) => s + 1)}
          className="w-full py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700"
        >Click me fast!</button>
      </div>
    </div>
  )
}
