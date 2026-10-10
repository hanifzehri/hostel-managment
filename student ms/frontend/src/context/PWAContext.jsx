import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PWAContext = createContext();

export const PWAProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(() => window.__deferredPrompt || null);
  const [isInstallable, setIsInstallable] = useState(() => !!window.__deferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installError, setInstallError] = useState(null);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Check standalone display mode (Windows PWA or installed app)
  const checkStandalone = useCallback(() => {
    try {
      const isStandalone =
        window.matchMedia?.('(display-mode: standalone)')?.matches ||
        window.matchMedia?.('(display-mode: window-controls-overlay)')?.matches ||
        window.navigator?.standalone === true ||
        document.referrer.includes('android-app://');
      if (isStandalone) {
        setIsInstalled(true);
        return true;
      }
      if (typeof navigator !== 'undefined' && 'getInstalledRelatedApps' in navigator) {
        navigator.getInstalledRelatedApps().then((apps) => {
          if (Array.isArray(apps) && apps.length > 0) {
            setIsInstalled(true);
          }
        }).catch(() => {});
      }
      return false;
    } catch (e) {
      return false;
    }
  }, []);

  useEffect(() => {
    checkStandalone();
    const mediaQuery = window.matchMedia?.('(display-mode: standalone)');
    mediaQuery?.addEventListener?.('change', checkStandalone);

    // Pick up early prompt if already captured by head script
    if (window.__deferredPrompt) {
      setDeferredPrompt(window.__deferredPrompt);
      setIsInstallable(true);
    }

    // Listen for custom event from head script
    const handlePromptReady = (e) => {
      const prompt = e.detail || window.__deferredPrompt;
      if (prompt) {
        setDeferredPrompt(prompt);
        setIsInstallable(true);
        setInstallError(null);
      }
    };
    window.addEventListener('pwa-deferred-prompt-ready', handlePromptReady);

    // Standard beforeinstallprompt listener
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.__deferredPrompt = e;
      setDeferredPrompt(e);
      setIsInstallable(true);
      setInstallError(null);
      console.log('[PWA] beforeinstallprompt event captured and ready for desktop installation.');
    };

    // App installed event listener
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      window.__deferredPrompt = null;
      setInstallSuccess(true);
      setInstallError(null);
      console.log('[PWA] Royal Hostel PWA installed successfully on desktop.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery?.removeEventListener?.('change', checkStandalone);
      window.removeEventListener('pwa-deferred-prompt-ready', handlePromptReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [checkStandalone]);

  const installApp = async () => {
    setInstallError(null);
    setInstallSuccess(false);

    // 1. If already installed
    if (isInstalled || checkStandalone()) {
      return {
        prompted: false,
        alreadyInstalled: true,
        message: 'Royal Hostel Khuzdar is already installed as a desktop application on this device.',
      };
    }

    // 2. Check prompt availability
    const promptEvent = deferredPrompt || window.__deferredPrompt;
    if (!promptEvent) {
      return {
        prompted: false,
        hasPrompt: false,
        message: 'Automatic installation prompt is currently unavailable in this browser session. Please install using the browser address bar icon or menu.',
      };
    }

    setIsInstalling(true);
    try {
      if (typeof promptEvent.prompt !== 'function') {
        throw new Error('Install prompt method is not supported in this browser.');
      }

      // Trigger native browser install dialog
      await promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;

      // Event is single-use: clear it immediately after use
      setDeferredPrompt(null);
      window.__deferredPrompt = null;
      setIsInstallable(false);
      setIsInstalling(false);

      if (choiceResult && choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setInstallSuccess(true);
        return { prompted: true, accepted: true };
      } else {
        return {
          prompted: true,
          accepted: false,
          message: 'Installation was dismissed by the user.',
        };
      }
    } catch (err) {
      console.warn('[PWA_INSTALL_HANDLED_ERROR]', err);
      // Safely clear consumed or corrupted prompt
      setDeferredPrompt(null);
      window.__deferredPrompt = null;
      setIsInstallable(false);
      setIsInstalling(false);
      setInstallError(err.message || 'Browser prevented launching install dialog.');
      return {
        prompted: false,
        error: err.message,
        message: 'Could not launch automatic prompt. Please use the browser address bar icon or Apps menu.',
      };
    }
  };

  return (
    <PWAContext.Provider
      value={{
        isInstallable: !!deferredPrompt || isInstallable,
        isInstalled,
        isInstalling,
        hasPrompt: !!deferredPrompt || !!window.__deferredPrompt,
        installError,
        installSuccess,
        setInstallError,
        installApp,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    return {
      isInstallable: false,
      isInstalled: false,
      isInstalling: false,
      hasPrompt: false,
      installError: null,
      installSuccess: false,
      setInstallError: () => {},
      installApp: async () => ({ prompted: false }),
    };
  }
  return context;
};
