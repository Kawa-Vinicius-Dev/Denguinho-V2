import { useSyncExternalStore } from 'react'
import { installMethod, isIos, isStandalone, pwa } from '../lib/pwa'

export function usePwaState() {
  return useSyncExternalStore(pwa.subscribe, pwa.getState, pwa.getState)
}

export function useInstallApp() {
  const { canPrompt, installed } = usePwaState()
  const standalone = isStandalone()
  return {
    method: installMethod({ standalone, installed, canPrompt, ios: isIos() }),
    standalone,
    install: pwa.promptInstall,
  }
}
