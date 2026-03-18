import { useState } from "react";
import TaskSimplifier from "./components/TaskSimplifier";
import KanbanBoard from "./components/KanbanBoard";
import SettingsPanel from "./components/SettingsPanel";
import { useStore } from "./store";
import { useSound } from "./hooks/useSound";
import { useSpeech } from "./hooks/useSpeech";

type Tab = "simplifier" | "board" | "settings";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("simplifier");
  const { addTask, settings } = useStore();
  const { play } = useSound();
  const { stopSpeaking } = useSpeech();
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
  };

  const handleAddToBoard = (steps: string[]) => {
    steps.forEach((s) => addTask(s, "todo", "medium", settings.employeeName || "Unknown"));
    showToast(`✓ Added ${steps.length} steps to board`);
    setActiveTab("board");
  };

  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: "simplifier", label: "Task Simplifier", icon: "✨" },
    { id: "board", label: "Board", icon: "📋" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F7F5F0" }}>
      <header className="bg-white border-b border-stone-200 px-6 py-3.5 sticky top-0 z-50 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-700 rounded-xl flex items-center justify-center text-xl">
            🧠
          </div>
          <div>
            <div className="text-lg font-semibold text-stone-800 leading-tight">
              NeuroDesk Clarity
            </div>
            <div className="text-xs text-stone-400 uppercase tracking-widest">
              Dyslexia-Friendly Workspace
            </div>
          </div>
        </div>

        <nav className="ml-auto flex items-center gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                play("click");
              }}
              onMouseEnter={() => play("hover")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-emerald-700 text-white"
                  : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"
              }`}
            >
              <span>{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => {
              stopSpeaking();
              showToast("⏹ AI announcement stopped");
              play("error");
            }}
            onMouseEnter={() => play("hover")}
            className="flex items-center gap-1 px-3 py-2 rounded-full bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition-all"
          >
            ⏹ Stop AI Speech
          </button>
        </nav>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        {activeTab === "simplifier" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div>
              <TaskSimplifier onAddToBoard={handleAddToBoard} />
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold text-stone-700">Control Center</div>
                  <div className="text-xs text-stone-500">Drag & drop, track progress, and assign to employees</div>
                </div>
                <div className="text-xs text-stone-500">Employee: <span className="font-medium text-stone-700">{settings.employeeName}</span></div>
              </div>
              <KanbanBoard />
            </div>
          </div>
        )}

        {activeTab === "board" && <KanbanBoard />}

        {activeTab === "settings" && <SettingsPanel />}      </main>

      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-800 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-lg transition-all duration-300 pointer-events-none ${
          toastVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        {toast}
      </div>
    </div>
  );
}