export type CharacterId = 'ninja' | 'samurai' | 'robot' | 'android' | 'hero' | 'astronaut'

export interface CharacterConfig {
  id: CharacterId
  name: string
  assignedAppPath: string | null
  active: boolean
}

export interface WaterReminderConfig {
  characterId: CharacterId
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
  characterId: CharacterId
  active: boolean
  alwaysVisible: boolean
}

export interface AppStore {
  characters: CharacterConfig[]
  waterReminder: WaterReminderConfig
  taskReminder: TaskReminderConfig
  tasks: Task[]
}

export interface DetectedApp {
  name: string
  path: string
}
