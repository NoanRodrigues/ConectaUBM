import { useCallback, useEffect, useRef, useState } from 'react';

function prefersReducedMotion(): boolean {
  return (
    document.documentElement.classList.contains('reduce-motion') ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Carrossel horizontal de rolagem nativa (Connecs e destaques).
 *
 * - Toque: o próprio navegador cuida do arraste, livre e com inércia; nada é travado de cartão em cartão.
 * - Mouse/trackpad: `next` avança até o cartão que aparecia cortado à direita ficar inteiro na primeira
 *   posição; `prev` faz o caminho inverso. `edges` diz se ainda há o que ver de cada lado, para as setas.
 *
 * O contêiner precisa ser `relative` para que `offsetLeft` dos cartões seja medido a partir dele.
 */
export function useRail<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const atStart = el.scrollLeft <= 2;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
    setEdges((current) => (current.atStart === atStart && current.atEnd === atEnd ? current : { atStart, atEnd }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    const mutation = new MutationObserver(update);
    mutation.observe(el, { childList: true });
    return () => {
      el.removeEventListener('scroll', update);
      resize.disconnect();
      mutation.disconnect();
    };
  }, [update]);

  const scrollToX = (el: T, left: number) => {
    el.scrollTo({ left: Math.max(0, left), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  const items = (el: T) => Array.from(el.children).filter((child): child is HTMLElement => child instanceof HTMLElement);

  const next = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const padding = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    const viewRight = el.scrollLeft + el.clientWidth;
    // Primeiro cartão que não cabe inteiro na tela: ele passa a ser o primeiro à esquerda
    const partial = items(el).find((item) => item.offsetLeft + item.offsetWidth > viewRight + 1);
    const target = partial ? partial.offsetLeft - padding : el.scrollWidth;
    scrollToX(el, target > el.scrollLeft + 1 ? target : el.scrollLeft + el.clientWidth * 0.8);
  }, []);

  const prev = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const padding = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    const list = items(el);
    const firstVisible = list.find((item) => item.offsetLeft + item.offsetWidth > el.scrollLeft + padding + 1);
    if (!firstVisible) return scrollToX(el, 0);
    const step = list.length > 1 ? list[1].offsetLeft - list[0].offsetLeft : firstVisible.offsetWidth;
    // Volta uma "página": os cartões anteriores ocupam a tela e o que era o primeiro fica cortado à direita
    const ideal = firstVisible.offsetLeft - padding - (el.clientWidth - step);
    const aligned = list.find((item) => item.offsetLeft - padding >= ideal - 1);
    scrollToX(el, aligned ? aligned.offsetLeft - padding : 0);
  }, []);

  return { ref, edges, next, prev };
}
