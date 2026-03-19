import { useState, useEffect, useRef } from "react";
import TaskSimplifier from "./components/TaskSimplifier";
import KanbanBoard from "./components/KanbanBoard";
import SettingsPanel from "./components/SettingsPanel";
import LoginPage from "./components/LoginPage";
import AdminDashboard from "./components/AdminDashboard";
import VoicePanel from "./components/VoicePanel";
import FocusMode, { FocusModeHandle } from "./components/FocusMode";
import { useStore } from "./store";
import { useSound } from "./hooks/useSound";
import { useSpeech } from "./hooks/useSpeech";
import { useVoiceControl } from "./hooks/useVoiceControl";

const GOOGLE_CLIENT_ID = "138386114278-crnta1rhh6t1sko25pksgbi0dtscs4eq.apps.googleusercontent.com";

type Tab = "simplifier" | "board" | "settings";

const MOTIVATIONS = [
  { emoji: "🌟", text: "Every big task starts with one small step. You've got this!" },
  { emoji: "🧠", text: "Your brain works differently — and that's your superpower." },
  { emoji: "💪", text: "Progress, not perfection. One task at a time." },
  { emoji: "🌈", text: "You showed up today. That already makes it a good day." },
  { emoji: "🎯", text: "Focus on what you can do right now. The rest can wait." },
  { emoji: "🌱", text: "Small steps every day lead to big changes over time." },
  { emoji: "✨", text: "You are more capable than you think. Start small, go far." },
];

const MOODS = [
  { emoji: "😊", label: "Great",    color: "bg-green-100 border-green-300 text-green-700"       },
  { emoji: "🙂", label: "Good",     color: "bg-emerald-100 border-emerald-300 text-emerald-700" },
  { emoji: "😐", label: "Okay",     color: "bg-yellow-100 border-yellow-300 text-yellow-700"    },
  { emoji: "😓", label: "Tired",    color: "bg-orange-100 border-orange-300 text-orange-700"    },
  { emoji: "😰", label: "Stressed", color: "bg-red-100 border-red-300 text-red-700"             },
];

const TOUR_STEPS = [
  { title: "✨ Simplify Tasks",  desc: "Type any hard task. Our AI breaks it into easy steps for you.",     icon: "✨" },
  { title: "📋 Task Board",      desc: "See your tasks here. Move them along as you finish each one.",      icon: "📋" },
  { title: "🎤 Voice Control",   desc: "Use your voice to control everything! Say 'open board' or 'set focus 25 minutes'.", icon: "🎤" },
  { title: "⏱ Focus Timer",     desc: "Pick 15, 25, or 45 minutes of focus time. Take breaks in between.", icon: "⏱" },
  { title: "🎮 Stress Relief",   desc: "Pop bubbles, whack moles, or do breathing during your break.",      icon: "🎮" },
];

function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ["#10b981","#f59e0b","#3b82f6","#ec4899","#8b5cf6","#f97316"];
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {Array.from({ length: 56 }, (_, i) => (
        <div key={i} style={{
          position:"absolute", left:`${Math.random()*100}%`, top:"-10px",
          width:`${6+Math.random()*9}px`, height:`${6+Math.random()*9}px`,
          backgroundColor: colors[i % colors.length],
          borderRadius: Math.random() > 0.5 ? "50%" : "3px",
          animation:`confettiFall ${1.5+Math.random()*2}s ease-in ${Math.random()*0.8}s forwards`,
          transform:`rotate(${Math.random()*360}deg)`,
        }} />
      ))}
      <style>{`@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>
    </div>
  );
}

function WelcomeScreen({ onStart, onTour, employeeName }: { onStart:()=>void; onTour:()=>void; employeeName:string }) {
  const motivation = MOTIVATIONS[new Date().getDay() % MOTIVATIONS.length];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-50 overflow-y-auto py-8">
      <div className="max-w-lg w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-emerald-700 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-3 shadow-lg">🧠</div>
          <h1 className="text-3xl font-bold text-stone-800 mb-1">NeuroDesk Clarity</h1>
          <p className="text-stone-400 text-xs uppercase tracking-widest">Dyslexia-Friendly Workspace</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-4 text-center shadow-sm">
          <p className="text-xl mb-3">👋 Welcome, <span className="font-bold text-emerald-700">{employeeName || "Friend"}</span>!</p>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="text-3xl mb-1">{motivation.emoji}</div>
            <p className="text-stone-700 text-sm italic leading-relaxed">"{motivation.text}"</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { icon:"✨", title:"Simplify Tasks", desc:"AI breaks tasks into steps"  },
            { icon:"📋", title:"Task Board",     desc:"Track your progress"         },
            { icon:"🎤", title:"Voice Control",  desc:"Control everything by voice" },
            { icon:"🎮", title:"Stress Relief",  desc:"Games & breathing exercises" },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-xl border border-stone-200 p-3 shadow-sm">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="text-sm font-semibold text-stone-800">{f.title}</div>
              <div className="text-xs text-stone-500">{f.desc}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onStart} className="flex-1 py-3.5 rounded-2xl bg-emerald-700 text-white font-bold text-base hover:bg-emerald-800 transition-all active:scale-95 shadow-md">🚀 Let's Start!</button>
          <button onClick={onTour}  className="flex-1 py-3.5 rounded-2xl bg-white border-2 border-stone-200 text-stone-700 font-bold text-base hover:bg-stone-50 transition-all active:scale-95">🗺 Take a Tour</button>
        </div>
      </div>
    </div>
  );
}

function GuidedTour({ onClose }: { onClose:()=>void }) {
  const [step, setStep] = useState(0);
  const cur = TOUR_STEPS[step];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="max-w-sm w-full mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-stone-100">
          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width:`${((step+1)/TOUR_STEPS.length)*100}%` }} />
        </div>
        <div className="p-8">
          <div className="text-6xl text-center mb-3">{cur.icon}</div>
          <h2 className="text-xl font-bold text-stone-800 text-center mb-2">{cur.title}</h2>
          <p className="text-stone-600 text-center text-sm leading-relaxed mb-6">{cur.desc}</p>
          <div className="flex justify-center gap-2 mb-5">
            {TOUR_STEPS.map((_,i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${i===step?"w-6 h-2.5 bg-emerald-500":"w-2.5 h-2.5 bg-stone-200"}`} />
            ))}
          </div>
          <div className="flex gap-3">
            {step > 0 && <button onClick={()=>setStep(s=>s-1)} className="flex-1 py-3 rounded-xl border-2 border-stone-200 text-stone-600 font-medium hover:bg-stone-50">← Back</button>}
            <button onClick={()=>step===TOUR_STEPS.length-1?onClose():setStep(s=>s+1)}
              className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 active:scale-95 transition-all">
              {step===TOUR_STEPS.length-1?"🎉 Let's Go!":"Next →"}
            </button>
          </div>
          <button onClick={onClose} className="w-full text-center text-xs text-stone-400 mt-3 hover:text-stone-600">Skip tour</button>
        </div>
      </div>
    </div>
  );
}

function MoodTracker({ onClose }: { onClose:(mood:string)=>void }) {
  const [selected, setSelected] = useState<string|null>(null);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="max-w-sm w-full mx-4 bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-4xl text-center mb-2">💭</div>
        <h2 className="text-xl font-bold text-stone-800 text-center mb-1">How are you feeling?</h2>
        <p className="text-stone-500 text-sm text-center mb-5">This helps us support you better today.</p>
        <div className="flex gap-2 mb-5 flex-wrap justify-center">
          {MOODS.map(m => (
            <button key={m.label} onClick={()=>setSelected(m.label)}
              className={`flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 transition-all ${selected===m.label?m.color+" scale-105 shadow-md":"border-stone-200 hover:border-stone-300"}`}>
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-xs font-medium text-stone-700">{m.label}</span>
            </button>
          ))}
        </div>
        <button onClick={()=>selected&&onClose(selected)} disabled={!selected}
          className="w-full py-3 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition-all active:scale-95 disabled:opacity-40">
          Start My Day →
        </button>
      </div>
    </div>
  );
}

function OverwhelmMode({ onExit, tasks, onDone }: { onExit:()=>void; tasks:{id:string;title:string;status:string}[]; onDone:(id:string)=>void }) {
  const todo = tasks.filter(t => t.status === "todo");
  const current = todo[0];
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-100">
      <div className="max-w-md w-full mx-4 text-center">
        <div className="text-5xl mb-4">🧘</div>
        <h2 className="text-2xl font-bold text-stone-800 mb-2">One Thing at a Time</h2>
        <p className="text-stone-500 text-sm mb-8">Focus only on this. Everything else is hidden.</p>
        {current ? (
          <div className="bg-white rounded-3xl border-2 border-emerald-200 p-8 shadow-lg mb-6">
            <div className="text-4xl mb-4">📌</div>
            <p className="text-xl font-semibold text-stone-800 leading-relaxed mb-6">{current.title}</p>
            <button onClick={()=>onDone(current.id)} className="w-full py-4 rounded-2xl bg-emerald-700 text-white font-bold text-lg hover:bg-emerald-800 transition-all active:scale-95 shadow-md">✅ I Did It!</button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border-2 border-emerald-200 p-8 shadow-lg mb-6">
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-xl font-bold text-stone-800">All tasks done!</p>
            <p className="text-stone-500 text-sm mt-2">Amazing work today!</p>
          </div>
        )}
        <div className="text-xs text-stone-400 mb-4">{todo.length > 0 ? `${todo.length} task${todo.length>1?"s":""} remaining` : "Nothing left to do!"}</div>
        <button onClick={onExit} className="px-6 py-2.5 rounded-full border border-stone-300 text-stone-600 text-sm hover:bg-stone-200 transition-all">← Back to full view</button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("simplifier");
  const { addTask, tasks, moveTask, settings, updateSettings } = useStore();
  const { play } = useSound();
  const { stopSpeaking } = useSpeech();

  // ── Ref to FocusMode for voice control ──
  const focusModeRef = useRef<FocusModeHandle>(null);

  // ── Auth ──
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("nd_token") || "");
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const u = localStorage.getItem("nd_user"); return u ? JSON.parse(u) : null;
  });
  const [showAdmin, setShowAdmin] = useState(false);

  const handleLogin = (token: string, user: any) => {
    localStorage.setItem("nd_token", token);
    localStorage.setItem("nd_user", JSON.stringify(user));
    setAuthToken(token); setCurrentUser(user);
    updateSettings({ employeeName: user.name || user.email });
    setShowWelcome(true);
  };
  const handleLogout = () => {
    fetch("http://127.0.0.1:8000/api/auth/logout", { method:"POST", headers:{ Authorization:`Bearer ${authToken}` } }).catch(()=>{});
    localStorage.removeItem("nd_token"); localStorage.removeItem("nd_user");
    setAuthToken(""); setCurrentUser(null); setShowAdmin(false);
  };

  // ── UI state ──
  const [showWelcome, setShowWelcome]     = useState(false);
  const [showTour, setShowTour]           = useState(false);
  const [showMood, setShowMood]           = useState(false);
  const [currentMood, setCurrentMood]     = useState<string|null>(null);
  const [confetti, setConfetti]           = useState(false);
  const [overwhelmMode, setOverwhelmMode] = useState(false);
  const [hideDone, setHideDone]           = useState(true);
  const [toast, setToast]                 = useState("");
  const [toastVisible, setToastVisible]   = useState(false);
  const [toastType, setToastType]         = useState<"normal"|"success"|"warn">("normal");
  const prevDoneCount = useRef(0);

  useEffect(() => {
    if (!authToken) return;
    const today = new Date().toDateString();
    if (localStorage.getItem("neurodesk_last_visit") !== today) setShowWelcome(true);
  }, [authToken]);

  useEffect(() => {
    const doneCount = tasks.filter(t => t.status === "done").length;
    if (doneCount > prevDoneCount.current) {
      setConfetti(true); play("celebrate");
      showToast("🎉 Well done! Keep going!", "success");
      setTimeout(() => setConfetti(false), 3500);
    }
    prevDoneCount.current = doneCount;
  }, [tasks]);

  const todoCount = tasks.filter(t => t.status === "todo").length;
  useEffect(() => {
    if (todoCount === 5) showToast("💛 You have 5 tasks. Try finishing one before adding more.", "warn");
    if (todoCount === 7) showToast("🛑 That's a lot of tasks! Focus on one at a time.", "warn");
  }, [todoCount]);

  const showToast = (msg: string, type: "normal"|"success"|"warn" = "normal") => {
    setToast(msg); setToastType(type); setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3200);
  };

  const handleAddToBoard = (steps: string[]) => {
    steps.forEach(s => addTask(s, "todo", "medium", settings.employeeName || "Unknown"));
    showToast(`✓ Added ${steps.length} steps to your board`);
    setActiveTab("board");
  };

  const handleWelcomeStart = () => { localStorage.setItem("neurodesk_last_visit", new Date().toDateString()); setShowWelcome(false); setShowMood(true); };
  const handleWelcomeTour  = () => { localStorage.setItem("neurodesk_last_visit", new Date().toDateString()); setShowWelcome(false); setShowTour(true); };
  const handleMoodClose    = (mood: string) => { setCurrentMood(mood); setShowMood(false); showToast(`${MOODS.find(m=>m.label===mood)?.emoji} Feeling ${mood} — let's have a great day!`); };
  const handleOverwhelmDone = (id: string) => { moveTask(id, "doing"); setTimeout(() => moveTask(id, "done"), 300); play("celebrate"); };

  // ── Voice control ──────────────────────────────────────────────────────────
  const { start: startVoice, stop: stopVoice, listening: voiceListening, lastTranscript, error: voiceError } = useVoiceControl((cmd) => {
    switch (cmd.type) {
      case 'navigate':
        setActiveTab(cmd.tab)
        showToast(`${cmd.tab === 'simplifier' ? '✨' : cmd.tab === 'board' ? '📋' : '⚙️'} Opened ${cmd.tab}`)
        play('click')
        break
      case 'timer_set_work':
        focusModeRef.current?.setWorkMinutes(cmd.minutes)
        setActiveTab('simplifier')
        showToast(`⏱ Work timer set to ${cmd.minutes} minutes`)
        break
      case 'timer_set_break':
        focusModeRef.current?.setBreakMinutes(cmd.minutes)
        setActiveTab('simplifier')
        showToast(`☕ Break timer set to ${cmd.minutes} minutes`)
        break
      case 'timer_start':
        focusModeRef.current?.startWork()
        setActiveTab('simplifier')
        showToast('▶ Focus timer started!', 'success')
        play('success')
        break
      case 'timer_stop':
        focusModeRef.current?.stopTimer()
        showToast('⏹ Timer stopped')
        break
      case 'timer_reset':
        focusModeRef.current?.resetTimer()
        showToast('↺ Timer reset')
        break
      case 'timer_break':
        focusModeRef.current?.startBreak()
        setActiveTab('simplifier')
        showToast('☕ Break started!', 'success')
        break
      case 'game_open':
        focusModeRef.current?.openGame(cmd.game)
        setActiveTab('simplifier')
        showToast(`🎮 Opening ${cmd.game} game`)
        break
      case 'game_close':
        focusModeRef.current?.closeGame()
        showToast('🎮 Game closed')
        break
      case 'add_task':
        addTask(cmd.title, 'todo', 'medium', settings.employeeName || 'Me')
        showToast(`✅ Task added: "${cmd.title}"`, 'success')
        play('success')
        break
      case 'overwhelm_mode':
        setOverwhelmMode(true)
        showToast('🧘 One task at a time mode')
        break
      case 'logout':
        handleLogout()
        break
      case 'unknown':
        showToast(`🎤 Didn't understand: "${cmd.transcript}" — tap ? for commands`, 'warn')
        break
    }
  })

  const navItems: { id:Tab; label:string; icon:string }[] = [
    { id:"simplifier", label:"Simplify Task", icon:"✨" },
    { id:"board",      label:"My Tasks",      icon:"📋" },
    { id:"settings",   label:"Settings",      icon:"⚙️" },
  ];

  if (!authToken) return <LoginPage onLogin={handleLogin} googleClientId={GOOGLE_CLIENT_ID} />;
  if (showAdmin)  return <AdminDashboard token={authToken} onBack={() => setShowAdmin(false)} />;

  return (
    <div className="min-h-screen flex flex-col" style={{ background:"#F7F5F0" }}>
      {showWelcome   && <WelcomeScreen onStart={handleWelcomeStart} onTour={handleWelcomeTour} employeeName={settings.employeeName} />}
      {showTour      && <GuidedTour onClose={()=>{ setShowTour(false); setShowMood(true); }} />}
      {showMood      && <MoodTracker onClose={handleMoodClose} />}
      {overwhelmMode && <OverwhelmMode onExit={()=>setOverwhelmMode(false)} tasks={tasks} onDone={handleOverwhelmDone} />}
      <Confetti active={confetti} />

      <header className="bg-white border-b border-stone-200 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="flex items-center gap-2.5 mr-2">
            <div className="w-9 h-9 bg-emerald-700 rounded-xl flex items-center justify-center text-lg">🧠</div>
            <div className="hidden sm:block">
              <div className="text-base font-bold text-stone-800 leading-tight">NeuroDesk Clarity</div>
              <div className="text-xs text-stone-400 uppercase tracking-widest">Dyslexia-Friendly</div>
            </div>
          </div>

          <nav className="flex items-center gap-2 flex-1">
            {navItems.map(item => (
              <button key={item.id} onClick={()=>{ setActiveTab(item.id); play("click"); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all
                  ${activeTab===item.id ? "bg-emerald-700 text-white shadow-md scale-105" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
                <span className="text-lg">{item.icon}</span>
                <span className="hidden sm:block">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            {currentMood && (
              <button onClick={()=>setShowMood(true)} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 text-xs font-medium hover:bg-stone-200 transition-all">
                {MOODS.find(m=>m.label===currentMood)?.emoji} {currentMood}
              </button>
            )}

            <button onClick={()=>setOverwhelmMode(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold hover:bg-amber-200 transition-all">
              🧘 <span className="hidden sm:inline">One Task</span>
            </button>

            {/* Voice Panel — replaces old voice button */}
            <VoicePanel
              listening={voiceListening}
              lastTranscript={lastTranscript}
              error={voiceError}
              onStart={startVoice}
              onStop={stopVoice}
            />

            <button onClick={()=>setShowTour(true)} className="hidden md:flex items-center gap-1 px-3 py-2 rounded-full text-stone-500 hover:bg-stone-100 text-xs font-medium transition-all">
              🗺 Tour
            </button>

            <button onClick={()=>{ stopSpeaking(); showToast("⏹ Reading stopped"); play("error"); }} className="flex items-center gap-1 px-3 py-2 rounded-full bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition-all">
              ⏹ <span className="hidden sm:inline">Stop</span>
            </button>

            {currentUser?.role === "admin" && (
              <button onClick={()=>setShowAdmin(true)} className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold hover:bg-purple-200 transition-all">
                👑 <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100">
              {currentUser?.picture
                ? <img src={currentUser.picture} alt={currentUser.name} className="w-6 h-6 rounded-full" />
                : <span className="text-emerald-600 text-sm">👤</span>
              }
              <span className="text-xs font-medium text-stone-700">{currentUser?.name || settings.employeeName || "You"}</span>
            </div>

            <button onClick={handleLogout} className="flex items-center gap-1 px-3 py-2 rounded-full border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-100 transition-all">
              🚪 <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {activeTab === "board" && (
        <div className="max-w-5xl mx-auto w-full px-4 pt-3 flex items-center gap-3 flex-wrap">
          <button onClick={()=>setHideDone(h=>!h)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all
              ${hideDone ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"}`}>
            {hideDone ? "👁 Showing active tasks" : "👁 Show all tasks"}
          </button>
          {todoCount >= 5 && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border ${todoCount>=7 ? "bg-red-50 border-red-200 text-red-700" : "bg-yellow-50 border-yellow-200 text-yellow-700"}`}>
              {todoCount>=7?"🛑":"💛"} {todoCount} tasks — {todoCount>=7?"that's a lot!":"try to finish some first"}
            </div>
          )}
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {activeTab === "simplifier" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="space-y-4">
              <TaskSimplifier onAddToBoard={handleAddToBoard} />
              <FocusMode ref={focusModeRef} />
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-bold text-stone-700">📋 Task Overview</div>
                  <div className="text-xs text-stone-500">Your current tasks at a glance</div>
                </div>
                <div className="text-xs text-stone-500">👤 {settings.employeeName}</div>
              </div>
              <KanbanBoard hideDone={hideDone} />
            </div>
          </div>
        )}
        {activeTab === "board"    && <KanbanBoard hideDone={hideDone} />}
        {activeTab === "settings" && <SettingsPanel />}
      </main>

      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg transition-all duration-300 pointer-events-none z-50 whitespace-nowrap
        ${toastType==="success"?"bg-emerald-700 text-white":toastType==="warn"?"bg-amber-500 text-white":"bg-stone-800 text-white"}
        ${toastVisible?"opacity-100 translate-y-0":"opacity-0 translate-y-2"}`}>
        {toast}
      </div>
    </div>
  );
}