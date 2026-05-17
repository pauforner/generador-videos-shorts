import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { getConfig, setConfig, isConfigured } from './store'
import { generateVideo } from './pipeline/orchestrator'
import type { AppConfig, GenerateRequest } from '../shared/types'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: '#0a0a0b',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerIpc()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function registerIpc(): void {
  ipcMain.handle('config:get', () => getConfig())

  ipcMain.handle('config:set', (_e, partial: Partial<AppConfig>) => setConfig(partial))

  ipcMain.handle('config:isConfigured', () => isConfigured())

  ipcMain.handle('dialog:pickFolder', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:pickMp3', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Audio', extensions: ['mp3', 'm4a', 'wav'] }]
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('shell:openPath', (_e, path: string) => shell.openPath(path))

  ipcMain.handle('shell:showInFolder', (_e, path: string) => shell.showItemInFolder(path))

  ipcMain.handle('video:generate', async (event, request: GenerateRequest) => {
    return generateVideo(request, (progress) => {
      event.sender.send('video:progress', progress)
    })
  })
}
