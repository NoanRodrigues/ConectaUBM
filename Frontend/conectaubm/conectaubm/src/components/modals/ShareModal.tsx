import { useState } from 'react';
import { Camera, Check, Copy, Mail, MessageCircle, Share2, type LucideIcon } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import type { ShareTarget } from '@/context/UIContext';
import { canNativeShare, copyText, emailLink, nativeShare, whatsappLink } from '@/services/shareService';
import { cn } from '@/utils/cn';

interface ShareModalProps {
  target: ShareTarget | null;
  onClose: () => void;
}

interface Option {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: string;
  run: () => void | Promise<void>;
}

/** Menu de compartilhamento: WhatsApp, Instagram, e-mail, copiar link e a folha nativa do sistema. */
export function ShareModal({ target, onClose }: ShareModalProps) {
  const { registerShare } = useApp();
  const { success, error } = useToast();
  const [copied, setCopied] = useState(false);

  if (!target) return null;

  const count = () => {
    if (target.postId) registerShare(target.postId);
  };

  const open = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

  const copy = async (message: string) => {
    const ok = await copyText(target.url);
    if (!ok) {
      error('Não foi possível copiar o link. Selecione o endereço abaixo e copie manualmente.');
      return false;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
    success(message);
    return true;
  };

  const options: Option[] = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      hint: 'Enviar para um contato ou grupo',
      icon: MessageCircle,
      tone: 'bg-[#1fa855]/20 text-[#5fe39a]',
      run: () => {
        open(whatsappLink(target));
        count();
        onClose();
      },
    },
    {
      id: 'instagram',
      label: 'Instagram',
      hint: 'Copia o link para colar no story ou no direct',
      icon: Camera,
      tone: 'bg-[#d6409f]/20 text-[#ff8fcf]',
      run: async () => {
        if (await copy('Link copiado. Cole no seu story ou direct do Instagram.')) {
          open('https://www.instagram.com/');
          count();
          onClose();
        }
      },
    },
    {
      id: 'email',
      label: 'E-mail',
      hint: 'Abrir no seu aplicativo de e-mail',
      icon: Mail,
      tone: 'bg-warn/15 text-warn',
      run: () => {
        window.location.href = emailLink(target);
        count();
        onClose();
      },
    },
  ];

  if (canNativeShare()) {
    options.push({
      id: 'native',
      label: 'Outros aplicativos',
      hint: 'Escolher entre os apps instalados no aparelho',
      icon: Share2,
      tone: 'bg-brand/40 text-brand-100',
      run: async () => {
        if (await nativeShare(target)) {
          count();
          onClose();
        }
      },
    });
  }

  return (
    <Modal open onClose={onClose} title={target.heading} size="sm">
      <ul className="space-y-1">
        {options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              className="flex w-full items-center gap-3.5 rounded-2xl p-2.5 text-left transition-colors hover:bg-white/[0.06]"
              onClick={() => void option.run()}
            >
              <span className={cn('grid size-11 shrink-0 place-items-center rounded-squircle', option.tone)}>
                <option.icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[0.9375rem] font-semibold text-white">{option.label}</span>
                <span className="block truncate text-[0.8125rem] text-mist">{option.hint}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-line bg-ink-850 p-1.5 pl-4">
        <input
          readOnly
          value={target.url}
          aria-label="Link para compartilhar"
          className="min-w-0 flex-1 truncate bg-transparent text-sm text-fog outline-none"
          onFocus={(event) => event.target.select()}
        />
        <button
          type="button"
          className={cn(
            'inline-flex h-9 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition-colors',
            copied ? 'bg-online/15 text-online' : 'theme-dark bg-brand text-white hover:bg-brand-500',
          )}
          onClick={async () => {
            if (await copy('Link copiado.')) count();
          }}
        >
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? 'Copiado' : 'Copiar link'}
        </button>
      </div>
    </Modal>
  );
}
