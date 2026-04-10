import { Tray, Menu, BrowserWindow, app, nativeImage } from 'electron'
import { join } from 'path'

export function createTray(settingsWindow: BrowserWindow): Tray {
  const iconPath = join(__dirname, '../../resources/tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath)
  const tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon)

  tray.setToolTip('Desklings')

  const updateMenu = (): void => {
    const isVisible = settingsWindow.isVisible()
    const menu = Menu.buildFromTemplate([
      {
        label: isVisible ? 'Hide Settings' : 'Show Settings',
        click: () => {
          if (settingsWindow.isVisible()) {
            settingsWindow.hide()
          } else {
            settingsWindow.show()
            settingsWindow.focus()
          }
          updateMenu()
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit()
        },
      },
    ])
    tray.setContextMenu(menu)
  }

  updateMenu()

  tray.on('click', () => {
    if (settingsWindow.isVisible()) {
      settingsWindow.hide()
    } else {
      settingsWindow.show()
      settingsWindow.focus()
    }
    updateMenu()
  })

  return tray
}
