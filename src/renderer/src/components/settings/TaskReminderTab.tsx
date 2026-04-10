import React, { useState } from 'react'
import { CharacterCard } from '../shared/CharacterCard'
import { Toggle } from '../shared/Toggle'
import type { Task, TaskReminderConfig, CharacterId } from '../../../../shared/ipc-types'

const CHARACTER_IDS: CharacterId[] = ['ninja', 'samurai', 'robot', 'android', 'hero', 'astronaut']

interface Props {
  config: TaskReminderConfig
  tasks: Task[]
  onConfigChange: (updated: TaskReminderConfig) => void
  onTasksChange: (updated: Task[]) => void
}

export function TaskReminderTab({ config, tasks, onConfigChange, onTasksChange }: Props): React.JSX.Element {
  const [newTitle, setNewTitle] = useState('')
  const [newDue, setNewDue] = useState('')

  const update = (patch: Partial<TaskReminderConfig>): void =>
    onConfigChange({ ...config, ...patch })

  const addTask = (): void => {
    if (!newTitle.trim() || !newDue) return
    const task: Task = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      dueAt: new Date(newDue).getTime(),
      completed: false,
    }
    onTasksChange([...tasks, task])
    setNewTitle('')
    setNewDue('')
  }

  const toggleComplete = (id: string): void => {
    onTasksChange(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }

  const deleteTask = (id: string): void => {
    onTasksChange(tasks.filter((t) => t.id !== id))
  }

  const pending = tasks.filter((t) => !t.completed)
  const done = tasks.filter((t) => t.completed)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-100 mb-1">Task Reminder</h2>
        <p className="text-sm text-slate-400">
          Add tasks with due times. Your character will alert you when they're due.
        </p>
      </div>

      {/* Enable / visibility */}
      <div className="flex gap-6">
        <Toggle
          checked={config.active}
          onChange={(v) => update({ active: v })}
          label="Enable task alerts"
        />
        <Toggle
          checked={config.alwaysVisible}
          onChange={(v) => update({ alwaysVisible: v })}
          label="Always visible on screen"
        />
      </div>

      {/* Character picker */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-300">Alert character</label>
        <div className="grid grid-cols-6 gap-3">
          {CHARACTER_IDS.map((id) => (
            <CharacterCard
              key={id}
              id={id}
              selected={config.characterId === id}
              onClick={() => update({ characterId: id })}
              size={3}
            />
          ))}
        </div>
      </div>

      {/* Add task */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">Add Task</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Task title…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="datetime-local"
            value={newDue}
            onChange={(e) => setNewDue(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={addTask}
            disabled={!newTitle.trim() || !newDue}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm font-bold text-white transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {pending.length === 0 && done.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-4">No tasks yet. Add one above!</p>
        )}

        {pending.map((task) => (
          <TaskRow key={task.id} task={task} onToggle={toggleComplete} onDelete={deleteTask} />
        ))}

        {done.length > 0 && (
          <>
            <p className="text-xs text-slate-500 pt-2 font-semibold uppercase tracking-wide">Completed</p>
            {done.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={toggleComplete} onDelete={deleteTask} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}): React.JSX.Element {
  const due = new Date(task.dueAt)
  const isOverdue = !task.completed && task.dueAt < Date.now()

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
        task.completed
          ? 'border-slate-700/50 bg-slate-800/30 opacity-50'
          : isOverdue
            ? 'border-red-700 bg-red-950/30'
            : 'border-slate-700 bg-slate-800/60'
      }`}
    >
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        className="w-4 h-4 accent-indigo-500 cursor-pointer"
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
          {task.title}
        </p>
        <p className={`text-xs ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
          {isOverdue && !task.completed ? '⚠ Overdue · ' : ''}
          {due.toLocaleString()}
        </p>
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="text-slate-500 hover:text-red-400 transition-colors text-lg leading-none"
        title="Delete"
      >
        ×
      </button>
    </div>
  )
}
