import React, { useState } from 'react'
import type { BuddyConfig, TaskReminderConfig, Task } from '../../../../shared/ipc-types'

interface Props {
  config: TaskReminderConfig
  tasks: Task[]
  buddies: BuddyConfig[]
  onConfigChange: (config: TaskReminderConfig) => Promise<void>
  onTasksChange: (tasks: Task[]) => Promise<void>
}

export function GeneralPanel({ config, tasks, buddies, onConfigChange, onTasksChange }: Props): React.JSX.Element {
  const [newTitle, setNewTitle] = useState('')
  const [newDue, setNewDue] = useState('')
  const activeBuddies = buddies.filter((b) => b.active)

  const updateConfig = (partial: Partial<TaskReminderConfig>): void => {
    onConfigChange({ ...config, ...partial })
  }

  const addTask = async (): Promise<void> => {
    if (!newTitle.trim()) return
    const task: Task = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      dueAt: newDue ? new Date(newDue).getTime() : Date.now() + 60 * 60_000,
      completed: false,
    }
    await onTasksChange([...tasks, task])
    setNewTitle('')
    setNewDue('')
  }

  const toggleTask = async (id: string): Promise<void> => {
    await onTasksChange(tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const deleteTask = async (id: string): Promise<void> => {
    await onTasksChange(tasks.filter((t) => t.id !== id))
  }

  return (
    <div className="p-6 flex flex-col gap-8 max-w-lg">
      {/* Task Reminder section */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>Task Reminder</h2>
        <p style={{ fontSize: 13, color: '#475569', margin: '0 0 20px' }}>
          Get alerted when tasks are due.
        </p>

        <Row label="Enable task alerts">
          <Toggle checked={config.active} onChange={(v) => updateConfig({ active: v })} />
        </Row>

        {config.active && (
          <>
            <div style={{ marginTop: 16 }}>
              <Row label="Reminder buddy">
                <select
                  value={config.buddyId ?? ''}
                  onChange={(e) => updateConfig({ buddyId: e.target.value || null })}
                  style={selectStyle}
                >
                  <option value="">Any active buddy</option>
                  {activeBuddies.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </Row>
            </div>

            <div style={{ marginTop: 16 }}>
              <Row label="Always keep buddy on screen">
                <Toggle
                  checked={config.alwaysVisible}
                  onChange={(v) => updateConfig({ alwaysVisible: v })}
                />
              </Row>
            </div>
          </>
        )}
      </div>

      {/* Task list */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: '0 0 12px' }}>Tasks</h3>

        {/* Add task form */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="New task…"
            style={{ ...inputStyle, flex: 1 }}
          />
          <input
            type="datetime-local"
            value={newDue}
            onChange={(e) => setNewDue(e.target.value)}
            style={{ ...inputStyle, colorScheme: 'dark', width: 180 }}
          />
          <button
            onClick={addTask}
            disabled={!newTitle.trim()}
            style={{
              background: newTitle.trim() ? '#6366f1' : '#1e1e2e',
              border: 'none',
              borderRadius: 6,
              padding: '0 16px',
              fontSize: 13,
              color: newTitle.trim() ? '#fff' : '#334155',
              cursor: newTitle.trim() ? 'pointer' : 'default',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Add
          </button>
        </div>

        {/* Task list */}
        {tasks.length === 0 ? (
          <div style={{ fontSize: 13, color: '#334155', padding: '16px 0' }}>
            No tasks yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tasks
              .slice()
              .sort((a, b) => a.dueAt - b.dueAt)
              .map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}
          </div>
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
  onToggle: () => void
  onDelete: () => void
}): React.JSX.Element {
  const due = new Date(task.dueAt)
  const overdue = !task.completed && Date.now() > task.dueAt

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#12121f',
        border: `1px solid ${overdue ? '#7f1d1d' : '#1e1e2e'}`,
        borderRadius: 8,
        padding: '8px 12px',
        opacity: task.completed ? 0.5 : 1,
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: `2px solid ${task.completed ? '#6366f1' : '#334155'}`,
          background: task.completed ? '#6366f1' : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          flexShrink: 0,
        }}
      >
        {task.completed && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>}
      </button>

      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            color: '#e2e8f0',
            textDecoration: task.completed ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </div>
        <div style={{ fontSize: 11, color: overdue ? '#ef4444' : '#334155', marginTop: 2 }}>
          {overdue ? 'Overdue · ' : ''}
          {due.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <button
        onClick={onDelete}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#334155',
          cursor: 'pointer',
          fontSize: 14,
          padding: '0 2px',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#334155')}
      >
        ✕
      </button>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <span style={{ fontSize: 14, color: '#94a3b8' }}>{label}</span>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }): React.JSX.Element {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: checked ? '#6366f1' : '#1e1e2e',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        flexShrink: 0,
        padding: 0,
        transition: 'background 0.2s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
        }}
      />
    </button>
  )
}

const selectStyle: React.CSSProperties = {
  background: '#0d0d14',
  border: '1px solid #1e1e2e',
  borderRadius: 6,
  padding: '7px 10px',
  fontSize: 13,
  color: '#e2e8f0',
  outline: 'none',
  minWidth: 180,
}

const inputStyle: React.CSSProperties = {
  background: '#0d0d14',
  border: '1px solid #1e1e2e',
  borderRadius: 6,
  padding: '8px 10px',
  fontSize: 13,
  color: '#e2e8f0',
  outline: 'none',
}
