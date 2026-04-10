// A "buddy" is a character instance the user has configured.
// Multiple buddies can share the same characterKey (visual template) but differ in name/app.
export interface BuddyConfig {
  id: string          // UUID — stable identity
  name: string        // user-facing label e.g. "My Robot"
  characterKey: string // key into CHARACTER_DEFS e.g. "iron-man"
  exePath: string | null
  active: boolean
}

export interface WaterReminderConfig {
  buddyId: string | null  // which buddy speaks the reminder
  intervalMinutes: number
  active: boolean
  alwaysVisible: boolean
}

export interface Task {
  id: string // crypto.randomUUID()
  title: string
  dueAt: number // Unix timestamp ms
  completed: boolean
}

export interface TaskReminderConfig {
  buddyId: string | null
  active: boolean
  alwaysVisible: boolean
}

export interface AppStore {
  buddies: BuddyConfig[]
  waterReminder: WaterReminderConfig
  taskReminder: TaskReminderConfig
  tasks: Task[]
}

export interface DetectedApp {
  name: string
  path: string
}
