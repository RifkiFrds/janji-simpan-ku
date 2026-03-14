import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showManualInstall, setShowManualInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  // Track user interactions
  useEffect(() => {
    const handleInteraction = () => {
      if (!userInteracted) {
        console.log('User interacted with app');
        setUserInteracted(true);
      }
    };

    // Listen for various user interactions
    const events = ['click', 'touchstart', 'keydown', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, [userInteracted]);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      // Check for standalone mode (Android/Chrome)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Check for iOS standalone mode
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      // Check if app was installed before (localStorage flag)
      const wasInstalled = localStorage.getItem('pwa-installed') === 'true';

      const installed = isStandalone || isInWebAppiOS || wasInstalled;
      console.log('PWA Install check:', { isStandalone, isInWebAppiOS, wasInstalled, installed });
      setIsInstalled(installed);
    };

    checkInstalled();

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
      setShowManualInstall(false);
    };

    const handleAppInstalled = () => {
      console.log('App was installed');
      localStorage.setItem('pwa-installed', 'true');
      setIsInstalled(true);
      setShowPrompt(false);
      setShowManualInstall(false);
      setDeferredPrompt(null);
    };

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show manual install button after some interaction and time
    const timer = setTimeout(() => {
      if (!showPrompt && !isInstalled && !deferredPrompt && userInteracted) {
        console.log('Showing manual install button after user interaction');
        setShowManualInstall(true);
      }
    }, 5000); // Show after 5 seconds of interaction

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, [showPrompt, isInstalled, deferredPrompt, userInteracted]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Use native prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstalled(true);
      } else {
        console.log('User dismissed the install prompt');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } else {
      // Manual install - show instructions
      alert('Untuk menginstall aplikasi:\n\n1. Di Chrome: Klik ikon menu (⋮) > "Install JanjiKu"\n2. Di Safari iOS: Klik ikon share > "Tambahkan ke Layar Utama"\n3. Di Firefox: Klik ikon install di address bar');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowManualInstall(false);
  };

  // Don't show anything if already installed
  if (isInstalled) return null;

  // Show native install prompt if available
  if (showPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-24 left-4 right-4 z-50 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg mx-auto max-w-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Download className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Install JanjiKu</h3>
              <p className="text-sm opacity-90">Install aplikasi untuk pengalaman terbaik</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={handleInstall}
          className="w-full mt-3 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        >
          Install Sekarang
        </Button>
      </div>
    );
  }

  // Show manual install button as fallback
  if (showManualInstall) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <Button
          onClick={handleInstall}
          className="rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          size="lg"
        >
          <Smartphone className="h-5 w-5 mr-2" />
          Install App
        </Button>
      </div>
    );
  }

  return null;
}