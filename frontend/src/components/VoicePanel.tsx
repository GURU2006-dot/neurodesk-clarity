import { useState } from 'react'

interface Props {
  listening: boolean
  lastTranscript: string
  error: string
  onStart: () => void
  onStop: () => void
}

const COMMANDS = [
  { category: '🗺 Navigation',   examples: ['"Open settings"', '"Go to my tasks"', '"Show simplifier"'] },
  { category: '⏱ Timer',         examples: ['"Set focus 25 minutes"', '"Start focus"', '"Take a break"', '"Reset timer"'] },
  { category: '🎮 Games',         examples: ['"Start bubble wrap"', '"Open breathing"', '"Start whack a mole"', '"Pop balloons"'] },
  { category: '📋 Tasks',         examples: ['"Add task write my report"', '"One task mode"'] },
]

export default function VoicePanel({ listening, lastTranscript, error, onStart, onStop }: Props) {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className="relative">
      {/* Main mic button */}
      <div className="flex items-center gap-2">
        <button
          onClick={listening ? onStop : onStart}
          className={`relative flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold transition-all
            ${listening
              ? 'bg-red-500 text-white shadow-lg shadow-red-200'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
        >
          {/* Pulse ring when listening */}
          {listening && (
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
          )}
          <span className="relative text-base">🎤</span>
          <span className="relative hidden sm:inline">
            {listening ? 'Listening…' : 'Voice'}
          </span>
        </button>

        {/* Help toggle */}
        <button
          onClick={() => setShowHelp(h => !h)}
          className={`w-7 h-7 rounded-full text-xs font-bold transition-all
            ${showHelp ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`}
          title="Voice command help"
        >
          ?
        </button>
      </div>

      {/* Listening indicator */}
      {listening && (
        <div className="absolute top-full left-0 mt-2 z-50 w-56 bg-white border border-red-200 rounded-2xl shadow-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-0.5">
              {[0,1,2,3,4].map(i => (
                <div
                  key={i}
                  className="w-1 bg-red-500 rounded-full animate-bounce"
                  style={{
                    height: `${8 + Math.sin(i) * 8}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.6s'
                  }}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-red-600">Listening…</span>
          </div>
          <p className="text-xs text-stone-500">Speak your command clearly</p>
          <button onClick={onStop} className="mt-2 w-full py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100">
            ✕ Cancel
          </button>
        </div>
      )}

      {/* Last transcript + result */}
      {!listening && lastTranscript && (
        <div className="absolute top-full left-0 mt-2 z-50 w-56 bg-white border border-stone-200 rounded-2xl shadow-xl p-3">
          <p className="text-xs text-stone-400 mb-1">You said:</p>
          <p className="text-sm font-medium text-stone-700 italic">"{lastTranscript}"</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute top-full left-0 mt-2 z-50 w-56 bg-red-50 border border-red-200 rounded-2xl shadow-xl p-3">
          <p className="text-xs text-red-600">⚠️ {error}</p>
        </div>
      )}

      {/* Help panel */}
      {showHelp && !listening && (
        <div className="absolute top-full right-0 mt-2 z-50 w-72 bg-white border border-stone-200 rounded-2xl shadow-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-stone-800">🎤 Voice Commands</p>
            <button onClick={() => setShowHelp(false)} className="text-stone-400 hover:text-stone-600 text-lg leading-none">×</button>
          </div>

          <div className="space-y-3">
            {COMMANDS.map(cat => (
              <div key={cat.category}>
                <p className="text-xs font-semibold text-stone-500 mb-1.5">{cat.category}</p>
                <div className="space-y-1">
                  {cat.examples.map(ex => (
                    <div key={ex} className="text-xs bg-stone-50 border border-stone-100 rounded-lg px-2.5 py-1.5 text-stone-600 font-mono">
                      {ex}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => { setShowHelp(false); onStart() }}
            className="mt-4 w-full py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-all"
          >
            🎤 Try a Command
          </button>
        </div>
      )}
    </div>
  )
}