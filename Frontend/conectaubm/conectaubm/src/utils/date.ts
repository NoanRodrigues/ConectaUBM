const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** ISO de "agora menos X". Usado para datar os dados simulados em relação ao primeiro acesso. */
export function ago(parts: { d?: number; h?: number; m?: number; s?: number }): string {
  const ms = (parts.d ?? 0) * DAY + (parts.h ?? 0) * HOUR + (parts.m ?? 0) * MINUTE + (parts.s ?? 0) * 1000;
  return new Date(Date.now() - ms).toISOString();
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** "agora", "12 min", "3 h", "ontem" (entre 24 e 48 h), "4 d", "12 de out." */
export function timeAgo(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  if (diff < MINUTE) return 'agora';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} h`;
  const days = Math.floor(diff / DAY);
  if (days === 1) return 'ontem';
  if (days < 7) return `${days} d`;
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

/**
 * Tempo compacto dos Connecs ativos: "5s", "56s", "1min", "3min", "3h", "21h".
 * Calculado a partir da data real de publicação; `now` permite atualizar a tela a cada segundo.
 */
export function connecAge(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  if (diff < MINUTE) return `${Math.max(1, Math.floor(diff / 1000))}s`;
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}min`;
  return `${Math.floor(diff / HOUR)}h`;
}

/**
 * Mesma lógica para os destaques, com períodos maiores:
 * "21h", "1 dia", "4 dias", "1 semana", "8 semanas", "3 meses", "1 ano".
 */
export function highlightAge(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  if (diff < DAY) return connecAge(iso, now);
  const days = Math.floor(diff / DAY);
  if (days < 7) return `${days} ${days === 1 ? 'dia' : 'dias'}`;
  if (days < 60) {
    const weeks = Math.floor(days / 7);
    return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  }
  if (days < 365) return `${Math.floor(days / 30)} meses`;
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'ano' : 'anos'}`;
}

/** "14 de nov. de 2026, 14:32" */
export function fullDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "14:32" */
export function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** Horário curto para listas de conversa: "14:32", "ontem", "seg.", "12/10". */
export function listTime(iso: string): string {
  const date = new Date(iso);
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY);
  if (days <= 0) return clock(iso);
  if (days === 1) return 'ontem';
  if (days < 7) return date.toLocaleDateString('pt-BR', { weekday: 'short' });
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/** Separador de dias no chat: "Hoje", "Ontem", "12 de novembro". */
export function dayLabel(iso: string): string {
  const date = new Date(iso);
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY);
  if (days <= 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}

export function sameDay(a: string, b: string): boolean {
  return startOfDay(new Date(a)) === startOfDay(new Date(b));
}

export function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 5) return 'Boa madrugada';
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** "novembro de 2026" */
export function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
