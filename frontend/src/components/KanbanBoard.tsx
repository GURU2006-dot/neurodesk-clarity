import { useState } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'
import { useStore, Task, Status, Priority } from '../store'
import { useSound } from '../hooks/useSound'

const COLUMNS: { id: Status; label: string; color: string; dot: string }[] = [
  { id: 'todo',  label: 'To Do',  color: 'bg-blue-50',   dot: 'bg-blue-400' },
  { id: 'doing', label: 'Doing',  color: 'bg-amber-50',  dot: 'bg-amber-400' },
  { id: 'done',  label: 'Done',   color: 'bg-green-50',  dot: 'bg-green-500' },
]

const PRIORITY_STYLES: Record<Priority, string> = {
  low:    'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high:   'bg-red-100 text-red-800',
}

function TaskCard({
  task,
  index,
}: {
  task: Task
  index: number
}) {
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
          className={`bg-white border rounded-xl p-3.5 mb-2.5 cursor-grab transition-all
            ${snapshot.isDragging
              ? 'border-emerald-300 shadow-lg rotate-1 scale-[1.02]'
              : 'border-stone-200 hover:border-stone-300 hover:-translate-y-0.5'
            }`}
        >
          {editing ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
              className="w-full text-sm border border-emerald-300 rounded-lg px-2 py-1 font-[inherit]
                         focus:outline-none focus:border-emerald-500 mb-2"
            />
          ) : (
            <>
              <p
                className="text-sm font-medium text-stone-800 mb-1 leading-relaxed cursor-text"
                onDoubleClick={() => { setEditing(true); play('click') }}
                title="Double-click to edit"
              >
                {task.title}
              </p>
              <p className="text-xs text-stone-500 mb-2">Assigned to: {task.owner || 'Unassigned'}</p>
            </>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => { cyclePriority(task.id); play('click') }}
              onMouseEnter={() => play('hover')}
              title="Click to change priority"
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full cursor-pointer
                          transition-all hover:opacity-80 ${PRIORITY_STYLES[task.priority]}`}
            >
              {task.priority}
            </button>
            <div className="ml-auto flex gap-1">
              <button
                onClick={() => { setEditing(true); play('click') }}
                onMouseEnter={() => play('hover')}
                className="text-stone-400 hover:text-stone-600 text-xs px-1.5 py-0.5 rounded transition-colors"
                title="Edit task"
              >
                ✏️
              </button>
              <button
                onClick={() => { deleteTask(task.id); play('click') }}
                onMouseEnter={() => play('hover')}
                className="text-stone-400 hover:text-red-500 text-xs px-1.5 py-0.5 rounded transition-colors"
                title="Delete task"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}

export default function KanbanBoard() {
  const { tasks, addTask, moveTask, reorderTasks, settings } = useStore()
  const { play } = useSound()
  const [quickInputs, setQuickInputs] = useState<Record<Status, string>>({
    todo: '', doing: '', done: '',
  })

  const statusCounts = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    doing: tasks.filter((t) => t.status === 'doing').length,
    done: tasks.filter((t) => t.status === 'done').length,
  }
  const ownerCounts = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.owner] = (acc[t.owner] ?? 0) + 1
    return acc
  }, {})

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return

    const destStatus = destination.droppableId as Status

    if (destination.droppableId !== source.droppableId) {
      moveTask(draggableId, destStatus)
      play(destStatus === 'done' ? 'success' : 'drop')
    } else {
      // Reorder within column
      const colTasks = tasks.filter((t) => t.status === source.droppableId)
      const otherTasks = tasks.filter((t) => t.status !== source.droppableId)
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
    setQuickInputs((q) => ({ ...q, [status]: '' }))
    play('success')
  }

  return (
    <div>
      <div className="mb-4 rounded-2xl border border-stone-200 bg-white p-3">
        <div className="flex flex-wrap gap-3 items-center mb-2">
          <div className="text-sm font-semibold text-stone-700">Task Timeline</div>
          <span className="text-xs text-stone-500">Owner: {settings.employeeName || 'Unknown'}</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">To Do: {statusCounts.todo}</div>
          <div className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">Doing: {statusCounts.doing}</div>
          <div className="rounded-full bg-green-50 px-2 py-1 text-green-700">Done: {statusCounts.done}</div>
          {Object.entries(ownerCounts).map(([owner, count]) => (
            <div key={owner} className="rounded-full bg-stone-100 px-2 py-1 text-stone-700">
              {owner}: {count}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-xl font-medium">Task Board</h2>
        <button
          onClick={() => { addTask('New task', 'todo', 'medium'); play('success') }}
          onMouseEnter={() => play('hover')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-700 text-white
                     font-medium text-sm hover:bg-emerald-800 transition-all active:scale-95"
        >
          + New Task
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id)
            return (
              <div key={col.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                {/* Column header */}
                <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-stone-100">
                  <div className={`w-3 h-3 rounded-full ${col.dot}`} />
                  <span className="font-medium text-sm text-stone-700">{col.label}</span>
                  <span className="ml-auto bg-stone-100 text-stone-500 text-xs font-medium
                                   px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                {/* Drop zone */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-3 min-h-[140px] transition-colors
                        ${snapshot.isDraggingOver ? 'bg-emerald-50' : ''}`}
                    >
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="text-center py-8 text-stone-400 text-sm">
                          Drop tasks here
                        </div>
                      )}
                      {colTasks.map((task, index) => (
                        <TaskCard key={task.id} task={task} index={index} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* Quick-add input */}
                <div className="px-3 pb-3 border-t border-stone-100 pt-2">
                  <input
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm
                               bg-stone-50 font-[inherit] focus:outline-none focus:border-emerald-400"
                    placeholder="Quick add… (press Enter)"
                    value={quickInputs[col.id]}
                    onChange={(e) =>
                      setQuickInputs((q) => ({ ...q, [col.id]: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd(col.id)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </DragDropContext>
    </div>
  )
}
