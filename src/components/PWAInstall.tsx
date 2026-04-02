'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app was installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      toast.success('Приложение установлено!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        toast.success('Установка началась...');
      } else {
        toast.info('Установка отменена');
      }
    } catch (error) {
      console.error('Install error:', error);
    } finally {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-[#0066cc] rounded-xl p-4 shadow-lg shadow-[#0066cc]/25 z-50 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm">Установить приложение</h3>
          <p className="text-white/80 text-xs mt-1">
            Добавьте СПС TTS на главный экран для быстрого доступа
          </p>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-white/60 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          onClick={handleInstall}
          className="flex-1 bg-white text-[#0066cc] hover:bg-white/90"
        >
          <Download className="w-4 h-4 mr-2" />
          Установить
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowPrompt(false)}
          className="text-white/80 hover:text-white hover:bg-white/10"
        >
          Позже
        </Button>
      </div>
    </div>
  );
}
