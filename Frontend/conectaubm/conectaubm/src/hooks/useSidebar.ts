import { useCallback, useSyncExternalStore } from 'react';

/**
 * Estado da barra lateral (expandida ou recolhida em ícones).
 * Sem escolha do usuário, segue a largura da tela: expandida a partir de 1280px.
 * Ao clicar no botão, a escolha passa a valer e fica salva neste dispositivo.
 */
const KEY = 'conectaubm:sidebar:v1';
const WIDE = '(min-width: 1280px)';

type Choice = 'expanded' | 'collapsed';

const listeners = new Set<() => void>();
let choice: Choice | null = readChoice();

function readChoice(): Choice | null {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === 'expanded' || saved === 'collapsed' ? saved : null;
  } catch {
    return null; // armazenamento bloqueado: vale só a largura da tela
  }
}

function isExpanded(): boolean {
  if (choice) return choice === 'expanded';
  return typeof window !== 'undefined' && window.matchMedia(WIDE).matches;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const media = window.matchMedia(WIDE);
  media.addEventListener('change', listener);
  return () => {
    listeners.delete(listener);
    media.removeEventListener('change', listener);
  };
}

export function useSidebar(): { expanded: boolean; toggle: () => void } {
  const expanded = useSyncExternalStore(subscribe, isExpanded, () => true);

  const toggle = useCallback(() => {
    choice = isExpanded() ? 'collapsed' : 'expanded';
    try {
      localStorage.setItem(KEY, choice);
    } catch {
      // segue valendo só nesta sessão
    }
    listeners.forEach((listener) => listener());
  }, []);

  return { expanded, toggle };
}
