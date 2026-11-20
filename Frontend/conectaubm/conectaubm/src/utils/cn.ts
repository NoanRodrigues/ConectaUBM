type ClassValue = string | number | false | null | undefined;

/** Junta classes condicionais: cn('a', cond && 'b'). */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
