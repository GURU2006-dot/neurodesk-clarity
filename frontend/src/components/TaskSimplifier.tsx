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
  const [currentStep, setCurrentStep] = useState<number | null>(null)
  const { play } = useSound()
  const { speak, stopSpeaking, startListening, stopListening, isListening } = useSpeech()
  const settings = useStore((s) => s.settings)

  // Speaks steps one by one with step highlight
  const speakStepsSequentially = (stepsToSpeak: string[]) => {
    setIsSpeaking(true)
    setCurrentStep(0)

    const speakNext = (index: number) => {
      if (index >= stepsToSpeak.length) {
        setIsSpeaking(false)
        setCurrentStep(null)
        return
      }
      setCurrentStep(index)
      speak(
        `Step ${index + 1}. ${stepsToSpeak[index]}`,
        () => speakNext(index + 1)
      )
    }

    speakNext(0)
  }

  const handleSimplify = async () => {
    if (!input.trim()) { setError('Please enter a task first'); play('error'); return }
    setError(''); setLoading(true); setSteps([]); setCurrentStep(null); play('click')
    try {
      const res = await simplifyTask({ task: input })
      setSteps(res.steps)
      setTaskLabel(input.substring(0, 40) + (input.length > 40 ? '…' : ''))
      onAddToBoard(res.steps)
      play('success')

      // Auto-announce steps after simplification
      speakStepsSequentially(res.steps)

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
    speakStepsSequentially(steps)
  }

  const handleStopSpeak = () => {
    stopSpeaking()
    setIsSpeaking(false)
    setCurrentStep(null)
    play('error')
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
              {!isSpeaking ? (
                <button
                  onClick={handleSpeakAll}
                  onMouseEnter={() => play('hover')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-100 border border-stone-200
                             text-stone-700 font-medium text-sm hover:bg-stone-200 transition-all active:scale-95"
                >
                  🔊 Read All Steps
                </button>
              ) : (
                <button
                  onClick={handleStopSpeak}
                  onMouseEnter={() => play('hover')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-100 border border-red-300
                             text-red-700 font-medium text-sm hover:bg-red-200 transition-all active:scale-95 animate-pulse"
                >
                  ⏹ Stop Reading
                </button>
              )}

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

          {input && (
            <button
              onClick={() => { setInput(''); setSteps([]); setError(''); handleStopSpeak() }}
              onMouseEnter={() => play('hover')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-stone-100 border border-stone-200
                         text-stone-500 text-sm hover:bg-stone-200 transition-all"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Focus control bar */}
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
            <p className="text-stone-500 text-sm">AI is simplifying your task…</p>
          </div>
        )}

        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-4 rounded-full bg-emerald-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-emerald-700 text-sm font-medium">
              {currentStep !== null ? `Reading Step ${currentStep + 1} of ${steps.length}…` : 'Reading steps…'}
            </p>
            <button
              onClick={handleStopSpeak}
              className="ml-auto text-xs px-3 py-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-all"
            >
              ⏹ Stop
            </button>
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
                  className={`flex items-start gap-3 rounded-xl p-4 border transition-all
                    ${currentStep === i
                      ? 'bg-emerald-50 border-emerald-300 shadow-sm scale-[1.01]'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                >
                  <div className={`min-w-[30px] h-[30px] rounded-full text-sm font-semibold
                                  flex items-center justify-center flex-shrink-0 transition-all
                                  ${currentStep === i
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                    {i + 1}
                  </div>
                  <p className="flex-1 text-base text-stone-800 leading-relaxed">{step}</p>
                  <button
                    title="Read step aloud"
                    onClick={() => {
                      handleStopSpeak()
                      setTimeout(() => {
                        setIsSpeaking(true)
                        setCurrentStep(i)
                        speak(`Step ${i + 1}. ${step}`, () => {
                          setIsSpeaking(false)
                          setCurrentStep(null)
                        })
                      }, 100)
                      play('click')
                    }}
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