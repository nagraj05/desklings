import type { CharacterId, CharacterConfig, WaterReminderConfig, TaskReminderConfig, Task } from '../shared/ipc-types'

interface OverlayApi {
  setIgnoreMouseEvents: (ignore: boolean) => Promise<void>
  characterClicked: (payload: { characterId: CharacterId; role: 'general' | 'water' | 'task' }) => void
  sendReady: () => void
  getResourcePath: (characterId: CharacterId) => Promise<string>
  onConfigUpdate: (cb: (config: { characters: CharacterConfig[]; waterReminder: WaterReminderConfig; taskReminder: TaskReminderConfig }) => void) => void
  onFireWaterReminder: (cb: (payload: { characterId: CharacterId }) => void) => void
  onFireTaskReminder: (cb: (payload: { task: Task; characterId: CharacterId }) => void) => void
}

declare global {
  interface Window {
    overlayApi: OverlayApi
  }
}
