import { useEffect, useState } from 'react';

/**
 * Horário atual que se atualiza sozinho. Usado para os tempos dos Connecs ("5s", "3min")
 * e para tirar do carrossel, na hora certa, o que completou 24 horas.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(handle);
  }, [intervalMs]);
  return now;
}
