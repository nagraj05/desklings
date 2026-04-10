import type { BuddyConfig, WaterReminderConfig, TaskReminderConfig, Task } from '../shared/ipc-types'

interface OverlayApi {
  setIgnoreMouseEvents: (ignore: boolean) => Promise<void>
  characterClicked: (payload: { buddyId: string; role: 'general' | 'water' | 'task' }) => void
  sendReady: () => void
  onConfigUpdate: (cb: (config: { buddies: BuddyConfig[]; waterReminder: WaterReminderConfig; taskReminder: TaskReminderConfig }) => void) => void
  onFireWaterReminder: (cb: (payload: { buddyId: string }) => void) => void
  onFireTaskReminder: (cb: (payload: { task: Task; buddyId: string }) => void) => void
}

declare global {
  interface Window {
    overlayApi: OverlayApi
  }
}
