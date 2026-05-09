"use client";

import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 1000 * 60 * 60 * 24) {
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      setShowPrompt(true);
    } else {
      const handler = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowPrompt(true);
      };

      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-[#0F1A14] text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4">
        <div className="bg-[#1A7A4A] p-2.5 rounded-xl">
          <Download className="w-6 h-6" />
        </div>
        
        <div className="flex-1">
          <p className="font-semibold text-sm">Save to Home Screen</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {isIOS 
              ? "Tap the share button and 'Add to Home Screen'" 
              : "Install FanPass for quick access to your tickets."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isIOS ? (
            <button 
              onClick={handleInstall}
              className="bg-[#1A7A4A] px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#0F4D2E] transition-colors"
            >
              Install
            </button>
          ) : (
            <div className="bg-white/10 p-2 rounded-lg">
              <Share className="w-4 h-4" />
            </div>
          )}
          
          <button 
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
