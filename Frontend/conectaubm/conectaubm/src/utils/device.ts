/**
 * Detecção de aparelho móvel para a criação de Connecs.
 *
 * Usa as características do dispositivo, nunca a largura da janela: um computador com a janela
 * reduzida continua sendo computador. É móvel quem tem tela de toque E, além disso, usa o toque como
 * forma principal de interação (sem mouse) ou se identifica como celular/tablet (inclui o iPadOS,
 * que se apresenta como Mac). Notebooks com tela de toque, que usam mouse/trackpad, ficam de fora.
 */

interface NavigatorWithUAData extends Navigator {
  userAgentData?: { mobile?: boolean };
}

const TOUCH_PRIMARY = '(hover: none) and (pointer: coarse)';

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const nav = navigator as NavigatorWithUAData;
  const hasTouch = (nav.maxTouchPoints ?? 0) > 0 || 'ontouchstart' in window;
  if (!hasTouch) return false;

  const touchPrimary = window.matchMedia?.(TOUCH_PRIMARY).matches ?? false;
  const uaMobile = nav.userAgentData?.mobile === true || /Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|Kindle/i.test(nav.userAgent);
  const iPadOS = /Macintosh/.test(nav.userAgent) && nav.maxTouchPoints > 1;
  return touchPrimary || uaMobile || iPadOS;
}

/** Mudança de forma de interação (ex.: tablet que ganha ou perde um teclado com trackpad). */
export function onInputModeChange(listener: () => void): () => void {
  const media = window.matchMedia?.(TOUCH_PRIMARY);
  media?.addEventListener('change', listener);
  return () => media?.removeEventListener('change', listener);
}
