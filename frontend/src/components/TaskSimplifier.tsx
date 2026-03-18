import { useState, useRef } from 'react'
import { simplifyTask } from '../utils/api'
import { useStore } from '../store'
import { useSound } from '../hooks/useSound'
import { useSpeech } from '../hooks/useSpeech'
import FocusMode from './FocusMode'

interface Props {
  onAddToBoard: (steps: string[]) => void
}

export default function TaskSimplifier({ onAddToBoard }: Props) {
  const [input, setInput] = useState('')
  const [steps, setSteps] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [taskLabel, setTaskLabel] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const { play } = useSound()
  const { speak, stopSpeaking, startListening, stopListening, isListening } = useSpeech()
  const settings = useStore((s) => s.settings)

  const handleSimplify = async () => {
    if (!input.trim()) { setError('Please enter a task first'); play('error'); return }
    setError(''); setLoading(true); setSteps([]); play('click')
    try {
      const res = await simplifyTask({ task: input })
      setSteps(res.steps)
      setTaskLabel(input.substring(0, 40) + (input.length > 40 ? '…' : ''))
      onAddToBoard(res.steps)
      play('success')
      if (settings.autoReadAloud) {
        setIsSpeaking(true)
        speak(
          res.steps.map((s: string, i: number) => `Step ${i + 1}. ${s}`).join('. '),
          () => setIsSpeaking(false)
        )
      }
    } catch (e: any) {
      const message = e?.response?.data?.detail || e?.message || 'AI error — check your API key in Settings'
      setError(message)
      play('error')
    } finally {
      setLoading(false)
    }
  }

  const handleVoice = () => {
    if (isListening) { stopListening(); return }
    play('click')
    startListening(
      (text) => { setInput(text); play('success') },
      (msg) => { setError(msg); play('error') }
    )
  }

  const handleAddToBoard = () => {
    if (!steps.length) return
    onAddToBoard(steps)
    play('success')
  }

  const handleSpeakAll = () => {
    if (!steps.length) return
    play('click')
    setIsSpeaking(true)
    speak(
      steps.map((s: string, i: number) => `Step ${i + 1}. ${s}`).join('. '),
      () => setIsSpeaking(false)
    )
  }

  const handleStopSpeak = () => {
    stopSpeaking()
    setIsSpeaking(false)
    play('error')
  }

  const priorityClasses: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  }

  return (
    <div>
      <h2 className="text-xl font-medium mb-5">
        Break down your task
        <span className="ml-2 text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">AI</span>
      </h2>

      <div className="bg-white rounded-2xl border border-stone-200 p-7">
        {/* Input */}
        <textarea
          className="w-full min-h-[90px] border-2 border-stone-200 rounded-xl p-4 text-base resize-y
                     focus:outline-none focus:border-emerald-400 bg-stone-50 font-[inherit]"
          placeholder="Type your task here… e.g. Prepare a project presentation about AI"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSimplify()}
        />

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={handleSimplify}
            onMouseEnter={() => play('hover')}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-700 text-white font-medium
                       text-sm hover:bg-emerald-800 disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? '⏳ Thinking…' : '✨ Simplify Task'}
          </button>

          <button
            onClick={handleVoice}
            onMouseEnter={() => play('hover')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full border font-medium text-sm
                       transition-all active:scale-95
                       ${isListening
                         ? 'bg-red-50 border-red-300 text-red-600 animate-pulse'
                         : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200'}`}
          >
            {isListening ? '🔴 Listening…' : '🎤 Speak Task'}
          </button>

          {steps.length > 0 && (
            <>
              <button
                onClick={handleSpeakAll}
                onMouseEnter={() => play('hover')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-100 border border-stone-200
                           text-stone-700 font-medium text-sm hover:bg-stone-200 transition-all active:scale-95"
              >
                🔊 Read All
              </button>
              <button
                onClick={handleStopSpeak}
                disabled={!isSpeaking}
                onMouseEnter={() => play('hover')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-100 border border-red-300
                           text-red-700 font-medium text-sm hover:bg-red-200 transition-all active:scale-95"
              >
                ⏹ Stop Reading
              </button>
              <button
                onClick={handleAddToBoard}
                onMouseEnter={() => play('hover')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-100 border border-emerald-300
                           text-emerald-800 font-medium text-sm hover:bg-emerald-200 transition-all active:scale-95 ml-auto"
              >
                + Add All to Board
              </button>
            </>
          )}
          {isSpeaking && !steps.length && (
            <button
              onClick={handleStopSpeak}
              onMouseEnter={() => play('hover')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-100 border border-red-300
                         text-red-700 font-medium text-sm hover:bg-red-200 transition-all active:scale-95"
            >
              ⏹ Stop Reading
            </button>
          )}

          {input && (
            <button
              onClick={() => { setInput(''); setSteps([]); setError('') }}
              onMouseEnter={() => play('hover')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-stone-100 border border-stone-200
                         text-stone-500 text-sm hover:bg-stone-200 transition-all"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Focus control bar (clearer placement below simplification controls) */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <FocusMode />
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-6 flex items-center gap-4">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-emerald-400 dot-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
            <p className="text-stone-500 text-sm">AI is breaking down your task…</p>
          </div>
        )}

      {/* Steps */}
        {steps.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-stone-500 mb-3">
              {steps.length} steps for: <span className="font-medium text-stone-700">"{taskLabel}"</span>
            </p>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-white border border-stone-200 rounded-xl p-4
                             hover:border-stone-300 transition-all"
                >
                  <div className="min-w-[30px] h-[30px] rounded-full bg-emerald-100 text-emerald-700
                                  text-sm font-semibold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="flex-1 text-base text-stone-800 leading-relaxed">{step}</p>
                  <button
                    title="Read step aloud"
                    onClick={() => { speak(`Step ${i + 1}. ${step}`); play('click') }}
                    onMouseEnter={() => play('hover')}
                    className="text-stone-400 hover:text-emerald-600 transition-colors px-1 text-lg"
                  >
                    🔊
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
