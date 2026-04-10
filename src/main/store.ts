import Store from 'electron-store'
import type { AppStore } from '../shared/ipc-types'

const DEFAULT_STORE: AppStore = {
  buddies: [],
  waterReminder: {
    buddyId: null,
    intervalMinutes: 60,
    active: false,
    alwaysVisible: false,
  },
  taskReminder: {
    buddyId: null,
    active: false,
    alwaysVisible: false,
  },
  tasks: [],
}

export const store = new Store<AppStore>({
  defaults: DEFAULT_STORE,
})
