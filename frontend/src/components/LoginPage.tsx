import { useEffect, useRef, useState } from "react"

interface Props {
  onLogin: (token: string, user: any) => void
  googleClientId: string
}

export default function LoginPage({ onLogin, googleClientId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const btnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.onload = () => initGoogle()
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  const initGoogle = () => {
    const google = (window as any).google
    if (!google) return
    google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleCredential,
      auto_select: false,
    })
    google.accounts.id.renderButton(btnRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: 320,
    })
  }

  const handleCredential = async (response: any) => {
    setLoading(true); setError("")
    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: response.credential }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Login failed")
      onLogin(data.token, data.user)
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F5F0" }}>
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-10 text-center">
          <div className="w-20 h-20 bg-emerald-700 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-5 shadow-md">🧠</div>
          <h1 className="text-2xl font-bold text-stone-800 mb-1">NeuroDesk Clarity</h1>
          <p className="text-stone-400 text-xs uppercase tracking-widest mb-8">Dyslexia-Friendly Workspace</p>

          <div className="grid grid-cols-2 gap-3 mb-8 text-left">
            {[
              { icon:"✨", text:"AI breaks tasks into easy steps" },
              { icon:"🔊", text:"Reads steps aloud for you"       },
              { icon:"📋", text:"Track your progress visually"    },
              { icon:"🎮", text:"Stress relief games & breathing" },
            ].map(f => (
              <div key={f.text} className="flex items-start gap-2 p-3 bg-stone-50 rounded-xl">
                <span className="text-lg">{f.icon}</span>
                <span className="text-xs text-stone-600 leading-snug">{f.text}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs text-stone-400 font-medium">Sign in to continue</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-3">
              <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-stone-600 text-sm">Signing you in…</span>
            </div>
          ) : (
            <div className="flex justify-center" ref={btnRef} />
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              ⚠️ {error}
            </div>
          )}

          <p className="text-xs text-stone-400 mt-6 leading-relaxed">
            Your data is stored securely and only visible to you and your admin.
          </p>
        </div>
        <p className="text-center text-xs text-stone-400 mt-4">NeuroDesk Clarity — Built for neurodiverse employees 🧠</p>
      </div>
    </div>
  )
}