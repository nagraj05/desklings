import type {
  CharacterConfig,
  WaterReminderConfig,
  TaskReminderConfig,
  Task,
  DetectedApp,
  AppStore,
} from '../shared/ipc-types'

interface SettingsApi {
  getStore: () => Promise<AppStore>
  setCharacters: (chars: CharacterConfig[]) => Promise<void>
  setWaterReminder: (config: WaterReminderConfig) => Promise<void>
  setTaskReminder: (config: TaskReminderConfig) => Promise<void>
  setTasks: (tasks: Task[]) => Promise<void>
  detectApps: () => Promise<DetectedApp[]>
  browseApp: () => Promise<string | null>
  onCharactersUpdated: (cb: (chars: CharacterConfig[]) => void) => void
}

declare global {
  interface Window {
    api: SettingsApi
  }
}
