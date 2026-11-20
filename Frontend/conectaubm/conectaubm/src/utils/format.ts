let counter = 0;

/** Identificador local. Com a API, os ids passam a vir do servidor. */
export function uid(prefix = 'id'): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? singular : pluralForm;
}

/** 1240 → "1,2 mil" */
export function compact(count: number): string {
  if (count < 1000) return String(count);
  return `${(count / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** Remove acentos e caixa para comparar textos em buscas. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function periodLabel(period: number | null): string | null {
  return period ? `${period}º período` : null;
}

export function hashString(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Link público de uma rota da aplicação (HashRouter). */
export function appLink(path: string): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#${path}`;
}
