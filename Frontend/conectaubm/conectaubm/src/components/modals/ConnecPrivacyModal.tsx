import { useState } from 'react';
import { AudiencePicker } from '@/components/connecs/AudiencePicker';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import type { Connec } from '@/types';

interface ConnecPrivacyModalProps {
  connec: Connec | null;
  onClose: () => void;
}

/** Muda quem pode ver um Connec já publicado. Vale só para ele (e para onde ele aparece, como os destaques). */
export function ConnecPrivacyModal({ connec, onClose }: ConnecPrivacyModalProps) {
  const { updateConnecPrivacy } = useApp();
  const { success } = useToast();
  const [privacy, setPrivacy] = useState(connec?.privacy ?? { audience: 'everyone' as const, userIds: [] });
  const [error, setError] = useState<string | null>(null);

  if (!connec) return null;

  const save = () => {
    try {
      updateConnecPrivacy(connec.id, privacy);
      success('Privacidade do Connec atualizada.');
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar.');
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Quem pode ver este Connec"
      description="A escolha vale só para este Connec, inclusive nos destaques."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>Salvar</Button>
        </>
      }
    >
      <AudiencePicker
        value={privacy}
        error={error}
        onChange={(next) => {
          setPrivacy(next);
          setError(null);
        }}
      />
    </Modal>
  );
}
