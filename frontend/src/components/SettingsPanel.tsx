import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { useSound } from '../hooks/useSound'
import { useSpeech } from '../hooks/useSpeech'
import { checkHealth } from '../utils/api'

export default function SettingsPanel() {
  const { settings, updateSettings } = useStore()
  const { play } = useSound()
  const { getVoices } = useSpeech()
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [apiStatus, setApiStatus] = useState<'unknown' | 'ok' | 'error'>('unknown')
  const [keySaved, setKeySaved] = useState(false)

  useEffect(() => {
    const load = () => setVoices(getVoices())
    load()
    window.speechSynthesis?.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load)
  }, [getVoices])

  useEffect(() => {
  checkHealth()
    .then((h) => setApiStatus(h.status === 'ok' ? 'ok' : 'error'))
    .catch(() => setApiStatus('error'))
  }, [])

  const Toggle = ({
    label,
    value,
    settingKey,
  }: {
    label: string
    value: boolean
    settingKey: keyof typeof settings
  }) => (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-base text-stone-700">{label}</span>
      <button
        onClick={() => {
          updateSettings({ [settingKey]: !value })
          play('click')
        }}
        onMouseEnter={() => play('hover')}
        className={`w-11 h-6 rounded-full relative transition-colors ${
          value ? 'bg-emerald-500' : 'bg-stone-300'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )

  const Card = ({
    title,
    children,
  }: {
    title: string
    children: React.ReactNode
  }) => (
    <div className="bg-white border border-stone-200 rounded-2xl p-6">
      <p className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-4">
        {title}
      </p>
      {children}
    </div>
  )

  return (
    <div>
      <h2 className="text-xl font-medium mb-5">Accessibility Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* Groq API Key */}
        <Card title="Groq API Key">
          <p className="text-sm text-stone-500 mb-3">
            Get a free key at{' '}
            <a
              href="https://console.groq.com"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 underline"
            >
              console.groq.com
            </a>{' '}
            — no credit card required.
          </p>
          <input
            type="password"
            value={settings.groqApiKey}
            onChange={(e) => updateSettings({ groqApiKey: e.target.value })}
            placeholder="gsk_..."
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm bg-stone-50
                       font-[inherit] focus:outline-none focus:border-emerald-400 mb-3"
          />
          <button
            onClick={() => {
              play('success')
              setKeySaved(true)
              setTimeout(() => setKeySaved(false), 2500)
            }}
            onMouseEnter={() => play('hover')}
            className="px-4 py-2 bg-emerald-700 text-white rounded-full text-sm font-medium
                       hover:bg-emerald-800 transition-all active:scale-95"
          >
            {keySaved ? '✓ Saved!' : 'Save Key'}
          </button>
          <div className="mt-3">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                apiStatus === 'ok'
                  ? 'bg-green-100 text-green-700'
                  : apiStatus === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-stone-100 text-stone-500'
              }`}
            >
              Backend:{' '}
              {apiStatus === 'ok'
                ? '✓ Connected'
                : apiStatus === 'error'
                ? '✗ Not connected'
                : 'Checking…'}
            </span>
          </div>
        </Card>

        {/* AI Model */}
        <Card title="AI Model">
          <p className="text-sm text-stone-500 mb-3">
            Choose the Groq Llama model for task simplification.
          </p>
          {[
            { id: 'llama3-70b-8192', name: 'Llama 3 70B', desc: 'Best quality' },
            { id: 'llama3-8b-8192', name: 'Llama 3 8B', desc: 'Fastest' },
            { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', desc: 'Balanced' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => { updateSettings({ model: m.id }); play('click') }}
              onMouseEnter={() => play('hover')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border mb-2
                          text-sm transition-all
                          ${settings.model === m.id
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                            : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'}`}
            >
              <span className="font-medium">{m.name}</span>
              <span className={settings.model === m.id ? 'text-emerald-600' : 'text-stone-400'}>
                {m.desc}
              </span>
            </button>
          ))}
        </Card>

        {/* Font Size */}
        <Card title="Font Size">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-stone-400">A</span>
            <input
              type="range"
              min={14}
              max={22}
              step={1}
              value={settings.fontSize}
              onChange={(e) => {
                updateSettings({ fontSize: Number(e.target.value) })
                document.documentElement.style.fontSize = `${e.target.value}px`
              }}
              className="flex-1"
            />
            <span className="text-sm font-medium text-stone-600 min-w-[36px]">
              {settings.fontSize}px
            </span>
          </div>
          <div
            className="p-3 bg-stone-50 rounded-xl text-stone-700 leading-relaxed"
            style={{ fontSize: settings.fontSize }}
          >
            The quick brown fox jumps over the lazy dog.
          </div>
        </Card>

        {/* Display Font */}
        <Card title="Display Font">
          <div className="space-y-2">
            {[
              { id: 'Lexend', label: 'Lexend', style: 'Lexend, sans-serif' },
              { id: 'OpenDyslexic', label: 'OpenDyslexic', style: "'Comic Sans MS', cursive" },
              { id: 'Arial', label: 'Arial', style: 'Arial, sans-serif' },
              { id: 'Georgia', label: 'Georgia', style: 'Georgia, serif' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  updateSettings({ fontFamily: f.id })
                  document.body.style.fontFamily = f.style
                  play('click')
                }}
                onMouseEnter={() => play('hover')}
                style={{ fontFamily: f.style }}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-left transition-all
                  ${settings.fontFamily === f.id
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'}`}
              >
                {f.label} — ABC abc 123
              </button>
            ))}
          </div>
        </Card>

        {/* Accessibility toggles */}
        <Card title="Accessibility Features">
          <Toggle label="Sound feedback" value={settings.soundEnabled} settingKey="soundEnabled" />
          <Toggle label="Auto read steps aloud" value={settings.autoReadAloud} settingKey="autoReadAloud" />
          <Toggle label="Text-to-speech" value={settings.ttsEnabled} settingKey="ttsEnabled" />
          <Toggle label="High contrast mode" value={settings.highContrast} settingKey="highContrast" />
        </Card>

        {/* Employee profile */}
        <Card title="Employee Profile">
          <p className="text-sm text-stone-500 mb-3">
            Set the current employee so new tasks are attributed correctly.
          </p>
          <input
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm bg-stone-50 font-[inherit]
                       focus:outline-none focus:border-emerald-400"
            value={settings.employeeName}
            onChange={(e) => updateSettings({ employeeName: e.target.value })}
            placeholder="Employee name"
          />
        </Card>

        {/* Voice settings */}
        <Card title="Voice & Speech">
          <label className="text-sm text-stone-500 block mb-1">Speaking rate</label>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-stone-400">Slow</span>
            <input
              type="range"
              min={0.5}
              max={1.8}
              step={0.1}
              value={settings.speechRate}
              onChange={(e) => updateSettings({ speechRate: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-sm font-medium text-stone-600 min-w-[36px]">
              {settings.speechRate.toFixed(1)}x
            </span>
          </div>
          <label className="text-sm text-stone-500 block mb-1">Voice</label>
          <select
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm bg-stone-50
                       font-[inherit] focus:outline-none focus:border-emerald-400"
            defaultValue=""
          >
            <option value="">System default</option>
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>
        </Card>

      </div>
    </div>
  )
}
