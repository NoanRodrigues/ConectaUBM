import { cn } from '@/utils/cn';

/**
 * Símbolo do ConectaUBM. A imagem fica em public/logo.png (branca, com fundo transparente),
 * por isso o logo aparece sempre sobre as áreas azul-marinho da interface.
 * Para trocar a marca, basta substituir esse arquivo.
 */
export function LogoMark({ className }: { className?: string }) {
  return <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className={cn('size-9 shrink-0 object-contain', className)} />;
}

interface LogoProps {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  /** Mostra só o símbolo (sidebar recolhida). */
  compact?: boolean;
}

export function Logo({ className, markClassName, textClassName, compact = false }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={markClassName} />
      <span className={cn('font-display text-[1.3rem] leading-none tracking-tight text-white', compact && 'sr-only', textClassName)}>
        <span className="font-medium">Conecta</span>
        <span className="font-extrabold">UBM</span>
      </span>
    </span>
  );
}
