import React, { useEffect, useState } from 'react'
import { GeneralTab } from './components/settings/GeneralTab'
import { WaterReminderTab } from './components/settings/WaterReminderTab'
import { TaskReminderTab } from './components/settings/TaskReminderTab'
import type { AppStore, CharacterConfig, WaterReminderConfig, TaskReminderConfig, Task } from '../../shared/ipc-types'

type Tab = 'general' | 'water' | 'task'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: '🎮' },
  { id: 'water', label: 'Water Reminder', icon: '💧' },
  { id: 'task', label: 'Task Reminder', icon: '📋' },
]

function App(): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('general')
  const [store, setStore] = useState<AppStore | null>(null)

  useEffect(() => {
    window.api.getStore().then(setStore)
    window.api.onCharactersUpdated((chars) =>
      setStore((s) => s ? { ...s, characters: chars } : s)
    )
  }, [])

  if (!store) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Loading…
      </div>
    )
  }

  const saveCharacters = async (chars: CharacterConfig[]): Promise<void> => {
    setStore({ ...store, characters: chars })
    await window.api.setCharacters(chars)
  }

  const saveWater = async (config: WaterReminderConfig): Promise<void> => {
    setStore({ ...store, waterReminder: config })
    await window.api.setWaterReminder(config)
  }

  const saveTaskConfig = async (config: TaskReminderConfig): Promise<void> => {
    setStore({ ...store, taskReminder: config })
    await window.api.setTaskReminder(config)
  }

  const saveTasks = async (tasks: Task[]): Promise<void> => {
    setStore({ ...store, tasks })
    await window.api.setTasks(tasks)
  }

  return (
    <div className="flex flex-col h-full bg-[#0f0f1a]">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800">
        <span className="text-2xl">🏠</span>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">Desklings</h1>
        <span className="ml-auto text-xs text-slate-500">v1.0.0</span>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-800 px-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
              tab === t.id
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'general' && (
          <GeneralTab characters={store.characters} onChange={saveCharacters} />
        )}
        {tab === 'water' && (
          <WaterReminderTab config={store.waterReminder} onChange={saveWater} />
        )}
        {tab === 'task' && (
          <TaskReminderTab
            config={store.taskReminder}
            tasks={store.tasks}
            onConfigChange={saveTaskConfig}
            onTasksChange={saveTasks}
          />
        )}
      </div>
    </div>
  )
}

export default App
