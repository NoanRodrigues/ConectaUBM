import { useCallback, useId, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type RefObject } from 'react';
import { ME, useApp } from '@/context/AppContext';
import type { ID, User } from '@/types';
import { serializeMentions, type InsertedMention } from '@/utils/mentions';
import { searchUsers } from '@/utils/users';

type Field = HTMLInputElement | HTMLTextAreaElement;

interface Options {
  value: string;
  setValue: (value: string) => void;
  inputRef: RefObject<Field | null>;
  /** Só estas pessoas aparecem (ex.: participantes do grupo). */
  only?: ID[];
  /** Inclui o próprio usuário (para compartilhar o próprio perfil numa conversa). */
  includeMe?: boolean;
  /** Quem aparece primeiro (ex.: participantes do grupo). Padrão: suas conexões. */
  priority?: ID[];
  limit?: number;
}

/** "@" no começo do texto ou depois de espaço/parêntese, seguido do que já foi digitado. */
const TRIGGER = /(?:^|[\s(])@([\p{L}\p{N}._-]{0,30})$/u;

export interface MentionList {
  id: string;
  open: boolean;
  items: User[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  pick: (user: User) => void;
}

/**
 * Menções com @ em qualquer campo de texto (publicação, comentário, conversa).
 * O texto na tela mostra "@Nome"; `serialize` troca pelo formato salvo `@[id]`,
 * ligado ao id real da pessoa (nomes repetidos ou alterados não quebram a menção).
 */
export function useMentionInput({ value, setValue, inputRef, only, includeMe = false, priority, limit = 6 }: Options) {
  const { users, myConnectionIds } = useApp();
  const listId = useId();
  const [trigger, setTrigger] = useState<{ start: number; end: number; query: string } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const inserted = useRef<InsertedMention[]>([]);

  const items = useMemo(() => {
    if (!trigger) return [];
    return searchUsers(users, trigger.query, {
      only,
      exclude: includeMe ? [] : [ME],
      priority: [ME, ...(priority ?? myConnectionIds)],
      limit,
    });
  }, [trigger, users, only, includeMe, priority, myConnectionIds, limit]);

  const open = Boolean(trigger) && items.length > 0;

  const detect = useCallback((text: string, caret: number | null) => {
    if (caret === null) return setTrigger(null);
    const match = TRIGGER.exec(text.slice(0, caret));
    if (!match) return setTrigger(null);
    setTrigger({ start: caret - match[1].length - 1, end: caret, query: match[1] });
    setActiveIndex(0);
  }, []);

  const pick = useCallback(
    (user: User) => {
      if (!trigger) return;
      const label = user.name;
      const insert = `@${label} `;
      const next = value.slice(0, trigger.start) + insert + value.slice(trigger.end);
      inserted.current = [...inserted.current, { userId: user.id, label }];
      setValue(next);
      setTrigger(null);
      const caret = trigger.start + insert.length;
      requestAnimationFrame(() => {
        const field = inputRef.current;
        if (!field) return;
        field.focus();
        field.setSelectionRange(caret, caret);
      });
    },
    [trigger, value, setValue, inputRef],
  );

  const onChange = (event: ChangeEvent<Field>) => {
    setValue(event.target.value);
    detect(event.target.value, event.target.selectionStart);
  };

  /** Devolve true quando a tecla foi usada pela lista de sugestões. */
  const onKeyDown = (event: KeyboardEvent<Field>): boolean => {
    if (!open) return false;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((index) => (index + step + items.length) % items.length);
      return true;
    }
    if ((event.key === 'Enter' || event.key === 'Tab') && !event.nativeEvent.isComposing) {
      event.preventDefault();
      pick(items[activeIndex] ?? items[0]);
      return true;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setTrigger(null);
      return true;
    }
    return false;
  };

  const syncCaret = (event: { currentTarget: Field }) => detect(event.currentTarget.value, event.currentTarget.selectionStart);

  const inputProps = {
    onChange,
    onSelect: syncCaret,
    onBlur: () => window.setTimeout(() => setTrigger(null), 120),
    role: 'combobox' as const,
    'aria-autocomplete': 'list' as const,
    'aria-expanded': open,
    'aria-controls': open ? listId : undefined,
    'aria-activedescendant': open ? `${listId}-${activeIndex}` : undefined,
  };

  const list: MentionList = { id: listId, open, items, activeIndex, setActiveIndex, pick };

  return {
    inputProps,
    onKeyDown,
    list,
    close: () => setTrigger(null),
    /** Texto pronto para salvar, com as menções como `@[id]`. */
    serialize: (text: string = value) => serializeMentions(text, inserted.current),
    reset: () => {
      inserted.current = [];
      setTrigger(null);
    },
  };
}
