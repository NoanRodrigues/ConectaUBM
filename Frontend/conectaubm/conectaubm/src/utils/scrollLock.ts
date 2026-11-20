/**
 * Trava a rolagem da página enquanto há uma janela aberta por cima (modal, confirmação, imagem ampliada).
 *
 * As travas são contadas: a página só volta a rolar quando a última janela fecha. Assim, duas janelas
 * sobrepostas que fecham juntas (por exemplo, "Criar publicação" e "Descartar publicação?") não deixam
 * a página presa, o que acontecia quando cada janela guardava e restaurava o estilo por conta própria.
 */
let locks = 0;
let previousOverflow = '';

export function lockScroll(): () => void {
  if (locks === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  locks += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks -= 1;
    if (locks === 0) document.body.style.overflow = previousOverflow;
  };
}
