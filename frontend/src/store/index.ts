import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Priority = 'low' | 'medium' | 'high'
export type Status = 'todo' | 'doing' | 'done'

export interface Task {
  id: string
  title: string
  status: Status
  priority: Priority
  owner: string
  createdAt: number
}

export interface Settings {
  groqApiKey: string
  model: string
  fontSize: number
  fontFamily: string
  soundEnabled: boolean
  autoReadAloud: boolean
  ttsEnabled: boolean
  speechRate: number
  highContrast: boolean
  employeeName: string
}

interface AppState {
  tasks: Task[]
  settings: Settings
  addTask: (title: string, status?: Status, priority?: Priority, owner?: string) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, status: Status) => void
  cyclePriority: (id: string) => void
  updateTaskTitle: (id: string, title: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  reorderTasks: (tasks: Task[]) => void
}

const defaultSettings: Settings = {
  groqApiKey: '',
  model: 'llama3-70b-8192',
  fontSize: 16,
  fontFamily: 'Lexend',
  soundEnabled: true,
  autoReadAloud: false,
  ttsEnabled: true,
  speechRate: 0.9,
  highContrast: false,
  employeeName: 'Alex'
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      tasks: [],
      settings: defaultSettings,

      addTask: (title, status = 'todo', priority = 'medium', owner = 'Me') =>
        set((s) => ({
          tasks: [
            ...s.tasks,
            {
              id: `t_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              title,
              status,
              priority,
              owner,
              createdAt: Date.now(),
            },
          ],
        })),


      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      moveTask: (id, status) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
        })),

      cyclePriority: (id) =>
        set((s) => {
          const order: Priority[] = ['low', 'medium', 'high']
          return {
            tasks: s.tasks.map((t) =>
              t.id === id
                ? { ...t, priority: order[(order.indexOf(t.priority) + 1) % 3] }
                : t
            ),
          }
        }),

      updateTaskTitle: (id, title) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, title } : t)),
        })),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      reorderTasks: (tasks) => set({ tasks }),
    }),
    { name: 'neurodesk-store' }
  )
)
