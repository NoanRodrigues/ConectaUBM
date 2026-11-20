import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CreateConnecModal } from '@/components/modals/CreateConnecModal';
import { CreatePostModal } from '@/components/modals/CreatePostModal';
import { EditProfileModal } from '@/components/modals/EditProfileModal';
import { ShareModal } from '@/components/modals/ShareModal';
import { AvatarLightbox } from '@/components/ui/AvatarLightbox';
import type { SharePayload } from '@/services/shareService';
import type { ConnecDraft, ID, PostDraft } from '@/types';
import { CONNEC_MOBILE_ONLY } from '@/utils/connecs';
import { isMobileDevice } from '@/utils/device';
import { useToast } from './ToastContext';

export type ComposerStart = 'text' | 'image' | 'video';

export interface ShareTarget extends SharePayload {
  /** Quando é uma publicação, o compartilhamento entra na contagem do post. */
  postId?: ID;
  heading: string;
}

interface UIContextValue {
  /** `draft` abre o criador já preenchido (ex.: reutilizar a imagem de um Connec antigo). */
  openComposer: (start?: ComposerStart, draft?: PostDraft) => void;
  /** Novo Connec; `initial` publica de novo um Connec do histórico. */
  openConnecComposer: (initial?: ConnecDraft) => void;
  openEditProfile: () => void;
  openShare: (target: ShareTarget) => void;
  /** Foto de perfil ampliada, sem sair da página. */
  openAvatar: (userId: ID) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

/** Modais globais, acessíveis de qualquer página: criar publicação, editar perfil e compartilhar. */
export function UIProvider({ children }: { children: ReactNode }) {
  const [composer, setComposer] = useState<{ open: boolean; start: ComposerStart; key: number; draft?: PostDraft }>({
    open: false,
    start: 'text',
    key: 0,
  });
  const [connecComposer, setConnecComposer] = useState<{ open: boolean; key: number; initial?: ConnecDraft }>({ open: false, key: 0 });
  const [editingProfile, setEditingProfile] = useState(false);
  const [share, setShare] = useState<ShareTarget | null>(null);
  const [avatarFor, setAvatarFor] = useState<ID | null>(null);
  const openAvatar = useCallback((userId: ID) => setAvatarFor(userId), []);

  const openComposer = useCallback((start: ComposerStart = 'text', draft?: PostDraft) => {
    setComposer((current) => ({ open: true, start, key: current.key + 1, draft }));
  }, []);
  const { toast } = useToast();
  const openConnecComposer = useCallback(
    (initial?: ConnecDraft) => {
      // Todo caminho que abre o criador passa por aqui: no computador, só explica onde criar
      if (!isMobileDevice()) {
        toast(CONNEC_MOBILE_ONLY);
        return;
      }
      setConnecComposer((current) => ({ open: true, key: current.key + 1, initial }));
    },
    [toast],
  );
  const openEditProfile = useCallback(() => setEditingProfile(true), []);
  const openShare = useCallback((target: ShareTarget) => setShare(target), []);

  const value = useMemo(
    () => ({ openComposer, openConnecComposer, openEditProfile, openShare, openAvatar }),
    [openComposer, openConnecComposer, openEditProfile, openShare, openAvatar],
  );

  return (
    <UIContext.Provider value={value}>
      {children}
      <CreatePostModal
        key={composer.key}
        open={composer.open}
        start={composer.start}
        initial={composer.draft}
        onClose={() => setComposer((current) => ({ ...current, open: false }))}
      />
      {connecComposer.open && (
        <CreateConnecModal
          key={connecComposer.key}
          open
          initial={connecComposer.initial}
          onClose={() => setConnecComposer((current) => ({ ...current, open: false }))}
        />
      )}
      {editingProfile && <EditProfileModal onClose={() => setEditingProfile(false)} />}
      <ShareModal target={share} onClose={() => setShare(null)} />
      {avatarFor && <AvatarLightbox key={avatarFor} userId={avatarFor} onClose={() => setAvatarFor(null)} />}
    </UIContext.Provider>
  );
}

/** Para componentes que também aparecem fora das páginas logadas (ex.: Avatar na tela de login). */
export function useOptionalUI(): UIContextValue | null {
  return useContext(UIContext);
}

export function useUI(): UIContextValue {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI precisa estar dentro de <UIProvider>.');
  return context;
}
