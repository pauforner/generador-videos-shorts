import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppConfig,
  GenerateRequest,
  GenerateResult,
  ProgressEvent
} from '../shared/types'

const api = {
  getConfig: (): Promise<AppConfig> => ipcRenderer.invoke('config:get'),
  setConfig: (partial: Partial<AppConfig>): Promise<AppConfig> =>
    ipcRenderer.invoke('config:set', partial),
  isConfigured: (): Promise<boolean> => ipcRenderer.invoke('config:isConfigured'),
  pickFolder: (): Promise<string | null> => ipcRenderer.invoke('dialog:pickFolder'),
  pickMp3: (): Promise<string | null> => ipcRenderer.invoke('dialog:pickMp3'),
  openPath: (path: string): Promise<string> => ipcRenderer.invoke('shell:openPath', path),
  showInFolder: (path: string): Promise<void> =>
    ipcRenderer.invoke('shell:showInFolder', path),
  generateVideo: (request: GenerateRequest): Promise<GenerateResult> =>
    ipcRenderer.invoke('video:generate', request),
  onProgress: (cb: (e: ProgressEvent) => void): (() => void) => {
    const listener = (_: unknown, e: ProgressEvent): void => cb(e)
    ipcRenderer.on('video:progress', listener)
    return () => ipcRenderer.off('video:progress', listener)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
