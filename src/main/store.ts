import Store from 'electron-store'
import type { AppStore } from '../shared/ipc-types'

const DEFAULT_STORE: AppStore = {
  characters: [
    { id: 'ninja', name: 'Ninja', assignedAppPath: null, active: false },
    { id: 'samurai', name: 'Samurai', assignedAppPath: null, active: false },
    { id: 'robot', name: 'Robot', assignedAppPath: null, active: false },
    { id: 'android', name: 'Android', assignedAppPath: null, active: false },
    { id: 'hero', name: 'Hero', assignedAppPath: null, active: false },
    { id: 'astronaut', name: 'Astronaut', assignedAppPath: null, active: false },
  ],
  waterReminder: {
    characterId: 'robot',
    intervalMinutes: 60,
    active: false,
    alwaysVisible: false,
  },
  taskReminder: {
    characterId: 'android',
    active: false,
    alwaysVisible: false,
  },
  tasks: [],
}

export const store = new Store<AppStore>({
  defaults: DEFAULT_STORE,
})
