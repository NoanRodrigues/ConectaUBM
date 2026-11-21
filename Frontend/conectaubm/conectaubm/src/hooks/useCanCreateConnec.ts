import { useSyncExternalStore } from 'react';
import { isMobileDevice, onInputModeChange } from '@/utils/device';

/** Connecs só são criados em celulares e tablets. No computador, eles continuam visíveis. */
export function useCanCreateConnec(): boolean {
  return useSyncExternalStore(onInputModeChange, isMobileDevice, () => false);
}
