import React, { useEffect, useState, useCallback } from 'react'
import type { AppStore, BuddyConfig, WaterReminderConfig, TaskReminderConfig, Task } from '../../shared/ipc-types'
import { BuddiesPanel } from './components/panels/BuddiesPanel'
import { LibraryPanel } from './components/panels/LibraryPanel'
import { WaterPanel } from './components/panels/WaterPanel'
import { GeneralPanel } from './components/panels/GeneralPanel'

type Panel = 'buddies' | 'library' | 'water' | 'general'

const NAV: { id: Panel; label: string; icon: string }[] = [
  { id: 'buddies', label: 'Buddies', icon: '🤖' },
  { id: 'library', label: 'Characters', icon: '🗂️' },
  { id: 'water', label: 'Water', icon: '💧' },
  { id: 'general', label: 'General', icon: '⚙️' },
]

function App(): React.JSX.Element {
  const [panel, setPanel] = useState<Panel>('buddies')
  const [store, setStore] = useState<AppStore | null>(null)

  useEffect(() => {
    window.api.getStore().then(setStore)
  }, [])

  const saveBuddies = useCallback(async (buddies: BuddyConfig[]): Promise<void> => {
    setStore((s) => s ? { ...s, buddies } : s)
    await window.api.setBuddies(buddies)
  }, [])

  const saveWater = useCallback(async (config: WaterReminderConfig): Promise<void> => {
    setStore((s) => s ? { ...s, waterReminder: config } : s)
    await window.api.setWaterReminder(config)
  }, [])

  const saveTaskConfig = useCallback(async (config: TaskReminderConfig): Promise<void> => {
    setStore((s) => s ? { ...s, taskReminder: config } : s)
    await window.api.setTaskReminder(config)
  }, [])

  const saveTasks = useCallback(async (tasks: Task[]): Promise<void> => {
    setStore((s) => s ? { ...s, tasks } : s)
    await window.api.setTasks(tasks)
  }, [])

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: '#0d0d14', color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Custom title bar — draggable */}
      <div
        className="app-drag flex items-center justify-between px-4 shrink-0"
        style={{ height: 36, background: '#0a0a11', borderBottom: '1px solid #1e1e2e' }}
      >
        <div className="app-no-drag flex items-center gap-2">
          <span style={{ fontSize: 16 }}>🤖</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#a5b4fc' }}>Desklings</span>
        </div>
        {/* Window controls */}
        <div className="app-no-drag flex items-center gap-1">
          <WinBtn
            color="#f59e0b"
            title="Minimize"
            onClick={() => (window as unknown as { api: { minimize?: () => void } }).api.minimize?.()}
          />
          <WinBtn
            color="#ef4444"
            title="Close"
            onClick={() => (window as unknown as { api: { closeWindow?: () => void } }).api.closeWindow?.()}
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav
          className="flex flex-col gap-1 p-3 shrink-0"
          style={{ width: 180, background: '#0f0f1c', borderRight: '1px solid #1e1e2e' }}
        >
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setPanel(n.id)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all"
              style={{
                background: panel === n.id ? '#1e1e3a' : 'transparent',
                color: panel === n.id ? '#a5b4fc' : '#64748b',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (panel !== n.id) (e.currentTarget as HTMLElement).style.color = '#cbd5e1'
              }}
              onMouseLeave={(e) => {
                if (panel !== n.id) (e.currentTarget as HTMLElement).style.color = '#64748b'
              }}
            >
              <span style={{ fontSize: 18 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}

          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 11, color: '#334155', textAlign: 'center', paddingBottom: 4 }}>
            v1.0.0
          </div>
        </nav>

        {/* Panel content */}
        <main className="flex-1 overflow-y-auto" style={{ background: '#0d0d14' }}>
          {!store ? (
            <div className="flex items-center justify-center h-full" style={{ color: '#334155', fontSize: 14 }}>
              Loading…
            </div>
          ) : (
            <>
              {panel === 'buddies' && (
                <BuddiesPanel
                  buddies={store.buddies}
                  onChange={saveBuddies}
                />
              )}
              {panel === 'library' && <LibraryPanel />}
              {panel === 'water' && (
                <WaterPanel
                  config={store.waterReminder}
                  buddies={store.buddies}
                  onChange={saveWater}
                />
              )}
              {panel === 'general' && (
                <GeneralPanel
                  config={store.taskReminder}
                  tasks={store.tasks}
                  buddies={store.buddies}
                  onConfigChange={saveTaskConfig}
                  onTasksChange={saveTasks}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function WinBtn({
  color,
  title,
  onClick,
}: {
  color: string
  title: string
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: color,
        border: 'none',
        cursor: 'pointer',
        opacity: 0.8,
        padding: 0,
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.8')}
    />
  )
}

export default App
