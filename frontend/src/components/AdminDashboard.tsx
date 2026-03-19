import { useEffect, useState } from "react"

interface User {
  id: number; email: string; name: string; picture: string
  role: string; task_count: number; done_count: number
}

interface Props { token: string; onBack: () => void }

export default function AdminDashboard({ token, onBack }: Props) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(data => { setUsers(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const totalTasks = users.reduce((a, u) => a + u.task_count, 0)
  const totalDone  = users.reduce((a, u) => a + u.done_count, 0)

  return (
    <div className="min-h-screen" style={{ background: "#F7F5F0" }}>
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center gap-4">
        <div className="w-9 h-9 bg-emerald-700 rounded-xl flex items-center justify-center text-lg">🧠</div>
        <div>
          <div className="font-bold text-stone-800">NeuroDesk Clarity</div>
          <div className="text-xs text-stone-400">Admin Dashboard</div>
        </div>
        <button onClick={onBack} className="ml-auto px-4 py-2 rounded-full bg-stone-100 text-stone-600 text-sm font-medium hover:bg-stone-200 transition-all">
          ← Back to My Tasks
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label:"Total Employees", value:users.length, emoji:"👥", color:"bg-blue-50 border-blue-200"   },
            { label:"Total Tasks",     value:totalTasks,   emoji:"📋", color:"bg-amber-50 border-amber-200" },
            { label:"Tasks Completed", value:totalDone,    emoji:"✅", color:"bg-green-50 border-green-200" },
          ].map(s => (
            <div key={s.label} className={`${s.color} border rounded-2xl p-5 text-center`}>
              <div className="text-3xl mb-1">{s.emoji}</div>
              <div className="text-2xl font-bold text-stone-800">{s.value}</div>
              <div className="text-sm text-stone-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-lg font-bold text-stone-800 flex-1">All Employees</h2>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="border border-stone-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:border-emerald-400 w-64" />
        </div>

        {loading ? (
          <div className="text-center py-12 text-stone-400">Loading employees…</div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  {["Employee","Role","Tasks","Done","Progress"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const pct = u.task_count > 0 ? Math.round((u.done_count / u.task_count) * 100) : 0
                  return (
                    <tr key={u.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {u.picture
                            ? <img src={u.picture} alt={u.name} className="w-9 h-9 rounded-full" />
                            : <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">{u.name?.[0]?.toUpperCase() || "?"}</div>
                          }
                          <div>
                            <div className="font-semibold text-stone-800 text-sm">{u.name || "Unknown"}</div>
                            <div className="text-xs text-stone-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-stone-100 text-stone-600"}`}>
                          {u.role === "admin" ? "👑 Admin" : "👤 Employee"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center"><span className="text-sm font-semibold text-stone-700">{u.task_count}</span></td>
                      <td className="px-5 py-4 text-center"><span className="text-sm font-semibold text-emerald-600">{u.done_count}</span></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-stone-100 rounded-full h-2">
                            <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width:`${pct}%` }} />
                          </div>
                          <span className="text-xs text-stone-500 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}