import { useState } from 'react'
import {
  DragDropContext, Droppable, Draggable, DropResult,
} from '@hello-pangea/dnd'
import { useStore, Task, Status, Priority } from '../store'
import { useSound } from '../hooks/useSound'

const COLUMNS: { id: Status; label: string; emoji: string; color: string; dot: string }[] = [
  { id: 'todo',  label: 'Not Started',  emoji: '📌', color: 'bg-blue-50',  dot: 'bg-blue-400'  },
  { id: 'doing', label: 'Working On It',emoji: '⚡', color: 'bg-amber-50', dot: 'bg-amber-400' },
  { id: 'done',  label: 'Finished! 🎉', emoji: '✅', color: 'bg-green-50', dot: 'bg-green-500' },
]

const PRIORITY_STYLES: Record<Priority, string> = {
  low:    'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high:   'bg-red-100 text-red-800',
}

const PRIORITY_LABELS: Record<Priority, string> = {
  low:    '🟢 Easy',
  medium: '🟡 Medium',
  high:   '🔴 Hard',
}

function TaskCard({ task, index }: { task: Task; index: number }) {
  const { deleteTask, cyclePriority, updateTaskTitle } = useStore()
  const { play } = useSound()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)

  const commitEdit = () => {
    if (title.trim()) updateTaskTitle(task.id, title.trim())
    setEditing(false)
    play('click')
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white border rounded-2xl p-4 mb-3 cursor-grab transition-all
            ${snapshot.isDragging
              ? 'border-emerald-300 shadow-xl rotate-1 scale-[1.02]'
              : 'border-stone-200 hover:border-emerald-200 hover:shadow-sm hover:-translate-y-0.5'
            }`}
        >
          {editing ? (
            <input
              autoFocus value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => e.key === 'Enter' && commitEdit()}
              className="w-full text-sm border border-emerald-300 rounded-xl px-3 py-2 font-[inherit]
                         focus:outline-none focus:border-emerald-500 mb-2"
            />
          ) : (
            <>
              <p className="text-sm font-semibold text-stone-800 mb-1 leading-relaxed"
                onDoubleClick={() => { setEditing(true); play('click') }}
                title="Double-click to edit">
                {task.title}
              </p>
              <p className="text-xs text-stone-400 mb-2">👤 {task.owner || 'Unassigned'}</p>
            </>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => { cyclePriority(task.id); play('click') }}
              title="Click to change difficulty"
              className={`text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer
                          transition-all hover:opacity-80 ${PRIORITY_STYLES[task.priority]}`}>
              {PRIORITY_LABELS[task.priority]}
            </button>
            <div className="ml-auto flex gap-1">
              <button onClick={() => { setEditing(true); play('click') }}
                className="text-stone-300 hover:text-stone-600 text-sm px-1.5 py-0.5 rounded transition-colors"
                title="Edit task">✏️</button>
              <button onClick={() => { deleteTask(task.id); play('click') }}
                className="text-stone-300 hover:text-red-400 text-sm px-1.5 py-0.5 rounded transition-colors"
                title="Remove task">✕</button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}

interface KanbanBoardProps {
  hideDone?: boolean
}

export default function KanbanBoard({ hideDone = false }: KanbanBoardProps) {
  const { tasks, addTask, moveTask, reorderTasks, settings } = useStore()
  const { play } = useSound()
  const [quickInputs, setQuickInputs] = useState<Record<Status, string>>({
    todo: '', doing: '', done: '',
  })

  // Filter done tasks if hideDone
  const visibleTasks = hideDone ? tasks.filter(t => t.status !== 'done') : tasks

  const statusCounts = {
    todo:  tasks.filter(t => t.status === 'todo').length,
    doing: tasks.filter(t => t.status === 'doing').length,
    done:  tasks.filter(t => t.status === 'done').length,
  }

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const destStatus = destination.droppableId as Status
    if (destination.droppableId !== source.droppableId) {
      moveTask(draggableId, destStatus)
      play(destStatus === 'done' ? 'celebrate' : 'drop')
    } else {
      const colTasks = tasks.filter(t => t.status === source.droppableId)
      const otherTasks = tasks.filter(t => t.status !== source.droppableId)
      const [moved] = colTasks.splice(source.index, 1)
      colTasks.splice(destination.index, 0, moved)
      reorderTasks([...otherTasks, ...colTasks])
      play('drop')
    }
  }

  const handleQuickAdd = (status: Status) => {
    const val = quickInputs[status].trim()
    if (!val) return
    addTask(val, status, 'medium')
    setQuickInputs(q => ({ ...q, [status]: '' }))
    play('success')
  }

  const visibleColumns = hideDone
    ? COLUMNS.filter(c => c.id !== 'done')
    : COLUMNS

  return (
    <div>
      {/* Summary bar */}
      <div className="mb-4 rounded-2xl border border-stone-200 bg-white p-3">
        <div className="flex flex-wrap gap-2 items-center mb-2">
          <div className="text-sm font-bold text-stone-700">📊 Task Summary</div>
          <span className="text-xs text-stone-400">👤 {settings.employeeName || 'Unknown'}</span>
          {hideDone && statusCounts.done > 0 && (
            <span className="text-xs text-stone-400 italic">({statusCounts.done} completed tasks hidden)</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 font-medium">📌 Not Started: {statusCounts.todo}</div>
          <div className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 font-medium">⚡ Working On It: {statusCounts.doing}</div>
          <div className="rounded-full bg-green-50 px-3 py-1 text-green-700 font-medium">✅ Finished: {statusCounts.done}</div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-stone-800">Your Tasks</h2>
        <button
          onClick={() => { addTask('New task', 'todo', 'medium'); play('success') }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-700 text-white
                     font-semibold text-sm hover:bg-emerald-800 transition-all active:scale-95 shadow-sm">
          + Add Task
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className={`grid gap-4 ${visibleColumns.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
          {visibleColumns.map(col => {
            const colTasks = visibleTasks.filter(t => t.status === col.id)
            return (
              <div key={col.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                {/* Column header */}
                <div className="flex items-center gap-2 px-4 py-3.5 border-b border-stone-100">
                  <span className="text-lg">{col.emoji}</span>
                  <span className="font-bold text-sm text-stone-700">{col.label}</span>
                  <span className="ml-auto bg-stone-100 text-stone-500 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                {/* Drop zone */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-3 min-h-[120px] transition-colors
                        ${snapshot.isDraggingOver ? 'bg-emerald-50' : ''}`}>
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="text-center py-8 text-stone-300 text-sm">
                          {col.id === 'todo'  ? '✨ Add tasks here'     :
                           col.id === 'doing' ? '⚡ Drag tasks here'    :
                                                '🎉 Finished tasks here'}
                        </div>
                      )}
                      {colTasks.map((task, index) => (
                        <TaskCard key={task.id} task={task} index={index} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* Quick add */}
                {col.id !== 'done' && (
                  <div className="px-3 pb-3 pt-2 border-t border-stone-100">
                    <input
                      className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm
                                 bg-stone-50 font-[inherit] focus:outline-none focus:border-emerald-400"
                      placeholder={col.id === 'todo' ? "Add a task… (press Enter)" : "Quick add…"}
                      value={quickInputs[col.id]}
                      onChange={e => setQuickInputs(q => ({ ...q, [col.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleQuickAdd(col.id)}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </DragDropContext>
    </div>
  )
}