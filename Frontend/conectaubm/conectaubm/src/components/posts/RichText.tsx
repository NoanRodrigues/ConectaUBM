import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ME, useApp } from '@/context/AppContext';
import type { ID, User } from '@/types';
import { cn } from '@/utils/cn';
import { firstName } from '@/utils/format';
import { mentionLabel, RICH_TOKEN, toPlainText } from '@/utils/mentions';
import { usernameOf } from '@/utils/users';

interface RichTextProps {
  text: string;
  className?: string;
  /** `span` permite usar o texto dentro de um parágrafo já existente. */
  as?: 'p' | 'span';
  /** Cor das menções. Dentro de balões coloridos (mensagens enviadas), use um tom que contraste. */
  mentionClassName?: string;
}

const MENTION = 'font-semibold text-brand-300 hover:underline';

/**
 * Texto de publicações, comentários e mensagens:
 * hashtags viram busca e menções (`@[id]`, ou `@{me}` nos dados antigos) viram link para o perfil.
 */
export function RichText({ text, className, as: Tag = 'p', mentionClassName }: RichTextProps) {
  const { me, users } = useApp();
  const parts = text.split(RICH_TOKEN);
  return (
    <Tag className={cn('whitespace-pre-line break-words', className)}>
      {parts.map((part, index) => {
        if (part === '@{me}') {
          return (
            <Link key={index} to={`/perfil/${ME}`} className={mentionClassName ?? 'font-semibold text-brand-200 hover:underline'}>
              @{firstName(me.name)}
            </Link>
          );
        }
        if (part.startsWith('@[') && part.endsWith(']')) {
          const user: User | undefined = users[part.slice(2, -1)];
          if (!user) return <Fragment key={index}>{mentionLabel(undefined)}</Fragment>;
          return (
            <Link key={index} to={`/perfil/${user.id}`} title={`@${usernameOf(user)}`} className={mentionClassName ?? MENTION}>
              {mentionLabel(user)}
            </Link>
          );
        }
        if (part.startsWith('#') && part.length > 1) {
          return (
            <Link key={index} to={`/pesquisa?q=${encodeURIComponent(part)}`} className="font-medium text-brand-300 hover:underline">
              {part}
            </Link>
          );
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </Tag>
  );
}

/** Versão em texto puro (prévias, notificações, compartilhamento). */
export function plainText(text: string, users: Record<ID, User>): string {
  return toPlainText(text, users, ME);
}
