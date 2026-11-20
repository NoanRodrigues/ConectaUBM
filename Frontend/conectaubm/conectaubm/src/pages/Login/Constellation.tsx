import { Avatar } from '@/components/ui/Avatar';
import { useMemo } from 'react';
import { buildMockUsers } from '@/data/mockUsers';
import { cn } from '@/utils/cn';

interface Node {
  id: string;
  x: number;
  y: number;
  size: string;
  label?: string;
}

const NODES: Node[] = [
  { id: 'thiago', x: 17, y: 20, size: 'size-16', label: 'Eng. de Software' },
  { id: 'marina', x: 52, y: 11, size: 'size-12', label: 'Direito' },
  { id: 'bia', x: 83, y: 24, size: 'size-16', label: 'Psicologia' },
  { id: 'helena', x: 31, y: 49, size: 'size-20', label: 'Enfermagem' },
  { id: 'rafael', x: 66, y: 47, size: 'size-14', label: 'Educação Física' },
  { id: 'yasmin', x: 89, y: 62, size: 'size-12', label: 'Biomedicina' },
  { id: 'isadora', x: 13, y: 77, size: 'size-12', label: 'Veterinária' },
  { id: 'nicole', x: 47, y: 83, size: 'size-16', label: 'Música' },
  { id: 'jonas', x: 76, y: 87, size: 'size-12', label: 'Eng. Elétrica' },
];

const EDGES: Array<[string, string]> = [
  ['thiago', 'marina'],
  ['marina', 'bia'],
  ['thiago', 'helena'],
  ['marina', 'rafael'],
  ['helena', 'rafael'],
  ['bia', 'yasmin'],
  ['rafael', 'yasmin'],
  ['helena', 'isadora'],
  ['helena', 'nicole'],
  ['nicole', 'jonas'],
  ['rafael', 'jonas'],
  ['rafael', 'nicole'],
  ['bia', 'rafael'],
];

const byId = Object.fromEntries(NODES.map((node) => [node.id, node]));

/**
 * Assinatura visual do ConectaUBM: estudantes de cursos diferentes ligados em rede.
 * As linhas "correm" de um ponto a outro; os avatares entram em sequência ao carregar.
 */
export function Constellation({ className }: { className?: string }) {
  // Avatares ilustrativos: a tela de entrada aparece antes de existir sessão.
  const users = useMemo(() => buildMockUsers(), []);
  return (
    <div className={cn('relative', className)} aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
        {EDGES.map(([from, to], index) => {
          const a = byId[from];
          const b = byId[to];
          return (
            <g key={`${from}-${to}`} className="animate-fade-in" style={{ animationDelay: `${500 + index * 60}ms`, animationDuration: '600ms' }}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#4ea3e8" strokeOpacity="0.28" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#b5d9f8"
                strokeOpacity="0.9"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="2 62"
                vectorEffect="non-scaling-stroke"
                className="animate-dash"
                style={{ animationDelay: `${-index * 0.45}s`, animationDuration: `${2.8 + (index % 4) * 0.5}s` }}
              />
            </g>
          );
        })}
      </svg>

      {NODES.map((node, index) => {
        const user = users[node.id];
        if (!user) return null;
        return (
          <div
            key={node.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div className="flex animate-pop-in flex-col items-center gap-2" style={{ animationDelay: `${index * 70}ms`, animationDuration: '420ms' }}>
              <span className="rounded-squircle bg-ink p-1 shadow-[0_0_0_1px_rgba(134,193,242,0.4),0_10px_30px_-8px_rgba(28,83,144,0.9)]">
                <Avatar user={user} className={node.size} />
              </span>
              {node.label && (
                <span className="whitespace-nowrap rounded-full border border-white/10 bg-ink-700/90 px-2.5 py-1 text-[0.6875rem] font-semibold text-brand-100 backdrop-blur">
                  {node.label}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
