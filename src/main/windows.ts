import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

export function createSettingsWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 900,
    height: 640,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    title: 'Desklings',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  win.on('ready-to-show', () => win.show())

  // Hide to tray instead of quitting
  win.on('close', (e) => {
    e.preventDefault()
    win.hide()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    // Dev URL points to project root; index.html is at /src/renderer/index.html
    win.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/src/renderer/index.html')
  } else {
    win.loadFile(join(__dirname, '../renderer/src/renderer/index.html'))
  }

  return win
}

export function createOverlayWindow(): BrowserWindow {
  const { workArea, workAreaSize } = screen.getPrimaryDisplay()
  const height = 140

  const win = new BrowserWindow({
    width: workAreaSize.width,
    height,
    x: workArea.x,
    y: workArea.y + workArea.height - height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/overlay.js'),
      sandbox: false,
    },
  })

  win.setIgnoreMouseEvents(true, { forward: true })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/src/overlay/index.html')
  } else {
    win.loadFile(join(__dirname, '../renderer/src/overlay/index.html'))
  }

  return win
}
