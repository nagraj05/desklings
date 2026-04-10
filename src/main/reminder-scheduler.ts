import { BrowserWindow } from 'electron'
import type { WaterReminderConfig, TaskReminderConfig, Task } from '../shared/ipc-types'

export class ReminderScheduler {
  private waterTimer: ReturnType<typeof setInterval> | null = null
  private taskTimer: ReturnType<typeof setInterval> | null = null
  private notifiedTaskIds = new Set<string>()

  startWater(config: WaterReminderConfig, overlayWin: BrowserWindow): void {
    this.stopWater()
    if (!config.active) return

    this.waterTimer = setInterval(
      () => {
        if (!overlayWin.isDestroyed()) {
          overlayWin.webContents.send('overlay:fire-water-reminder', {
            characterId: config.characterId,
          })
        }
      },
      config.intervalMinutes * 60_000,
    )
  }

  stopWater(): void {
    if (this.waterTimer) {
      clearInterval(this.waterTimer)
      this.waterTimer = null
    }
  }

  startTaskCheck(
    tasks: Task[],
    reminderConfig: TaskReminderConfig,
    overlayWin: BrowserWindow,
  ): void {
    this.stopTaskCheck()
    if (!reminderConfig.active) return

    this.taskTimer = setInterval(() => {
      if (overlayWin.isDestroyed()) return
      const now = Date.now()
      const window = 65_000 // 65s window to catch tasks due in this minute

      for (const task of tasks) {
        if (!task.completed && task.dueAt <= now && task.dueAt > now - window) {
          if (!this.notifiedTaskIds.has(task.id)) {
            this.notifiedTaskIds.add(task.id)
            overlayWin.webContents.send('overlay:fire-task-reminder', {
              task,
              characterId: reminderConfig.characterId,
            })
          }
        }
      }
    }, 60_000)
  }

  stopTaskCheck(): void {
    if (this.taskTimer) {
      clearInterval(this.taskTimer)
      this.taskTimer = null
    }
  }

  clearNotifiedTask(taskId: string): void {
    this.notifiedTaskIds.delete(taskId)
  }

  stopAll(): void {
    this.stopWater()
    this.stopTaskCheck()
  }
}
