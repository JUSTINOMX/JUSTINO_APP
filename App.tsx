
import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { OnboardingModal } from './components/OnboardingModal';
import { Dashboard } from './components/Dashboard';
import { LoginModal } from './components/LoginModal';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { User, AppView, Message, VaultFile } from './types';
import { supabase } from './services/supabaseClient';
import { config } from './config';
import { uploadToVault } from './services/justino-service';

const INITIAL_WELCOME_MESSAGE: Message = {
  id: 'welcome',
  text: `Hola, soy Justino, tu guía legal digital. Te encuentras en un sitio blindado y seguro; tu información está protegida al 100% y nadie más que tú tiene acceso.\n\nMi objetivo es resolver tu situación legal de principio a fin. Yo me encargaré de explicarte tus opciones, generar cada documento que necesites y decirte exactamente dónde y cómo entregarlos para que tú mismo tomes el control de tu caso sin necesidad de intermediarios ni gastos excesivos.\n\nPara comenzar a trazar tu estrategia, cuéntame: ¿En qué ciudad te encuentras y qué situación legal vamos a solucionar hoy?`,
  sender: 'bot',
  timestamp: new Date(),
};

function App() {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const hasSessionId = Boolean(urlParams?.get('session_id'));

  const [view, setView] = useState<AppView>(hasSessionId ? 'onboarding' : 'landing');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(hasSessionId ? 2 : 1);
  
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([INITIAL_WELCOME_MESSAGE]);
  const [vaultFiles, setVaultFiles] = useState<VaultFile[]>([]);

  // Detect session_id in URL upon mount or state changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId && !user) {
      setView('onboarding');
      setOnboardingStep(2);
    }
  }, [user]);

  useEffect(() => {
    if (!supabase) return;

    // Supabase Auth Listener (The Single Source of Truth)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const loggedUser: User = {
          id: session.user.id,
          email: session.user.email || ''
        };
        setUser(loggedUser);
        
        // Admin detection (Hint from session storage, but backend protects data)
        const isAdminSession = sessionStorage.getItem('justino_admin_active') === 'true';
        
        if (isAdminSession) {
           setView('admin-dashboard');
        } else if (view === 'landing' || view === 'onboarding') {
           setView('dashboard');
        }
      } else {
        setUser(null);
        if (view !== 'landing' && view !== 'onboarding' && view !== 'admin-login') {
          setView('landing');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sincronización de datos del usuario (Cloud First)
  useEffect(() => {
    if (user && (view === 'dashboard' || view === 'admin-dashboard')) {
        const fetchCloudData = async () => {
            if (!supabase || !user.id) return;

            try {
                const { data: msgs, error: msgError } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('case_id', user.id)
                    .order('timestamp', { ascending: true });
                
                if (msgs && !msgError) {
                    if (msgs.length === 0) {
                        setMessages([INITIAL_WELCOME_MESSAGE]);
                    } else {
                        const formattedMessages: Message[] = msgs.map(m => ({
                            id: m.id,
                            text: m.text,
                            sender: m.sender,
                            timestamp: new Date(m.timestamp),
                            attachment: m.attachment || undefined
                        }));
                        setMessages(formattedMessages);
                    }
                }

                const { data: files, error: fileError } = await supabase
                    .from('documents')
                    .select('*')
                    .eq('case_id', user.id)
                    .order('created_at', { ascending: false });

                if (files && !fileError) {
                    const formattedFiles: VaultFile[] = files.map(f => ({
                        id: f.id,
                        name: f.name,
                        type: f.type,
                        content: f.content,
                        url: f.url,
                        origin: f.origin as 'generated' | 'uploaded',
                        date: f.created_at
                    }));
                    setVaultFiles(formattedFiles);
                }
            } catch (e) {
                console.error("Sync Error:", e);
            }
        };

        fetchCloudData();
    }
  }, [user, view]);

  const handleStart = () => {
    setView('onboarding');
    setOnboardingStep(1);
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const cancelLogin = () => {
    setShowLoginModal(false);
  };

  const handleLoginSuccess = (testUser?: User) => {
    if (testUser && !user) {
      setUser(testUser);
    }
    setShowLoginModal(false);
    setView('dashboard');
  };

  const completeOnboarding = async (testUser?: User) => {
    if (testUser) {
      setUser(testUser);
    } else if (!user) {
      setUser({ id: 'user-' + Date.now(), email: 'cliente@justino.app' });
    }
    
    // Clear URL query parameters cleanly
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    setView('dashboard');
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('justino_admin_active');
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setVaultFiles([]);
    setView('landing');
  };

  const handleAdminLogout = async () => {
    sessionStorage.removeItem('justino_admin_active');
    if (supabase) {
      await supabase.auth.signOut();
    }
    setView('landing');
  };

  const handleNewMessage = async (msg: Message) => {
    if (messages.some(m => m.id === msg.id)) {
      return;
    }

    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) {
        return prev;
      }
      return [...prev, msg];
    });

    if (supabase && user?.id) {
        try {
            await supabase.from('messages').insert([{
                id: msg.id,
                case_id: user.id,
                text: msg.text,
                sender: msg.sender,
                timestamp: msg.timestamp.toISOString(),
                attachment: msg.attachment || null
            }]);
        } catch (e) {}
    }
  };

  // Cargar vaultFiles iniciales desde localStorage si aplica
  useEffect(() => {
    try {
      const savedLocalVault = localStorage.getItem('justino_local_vault');
      if (savedLocalVault) {
        const parsed = JSON.parse(savedLocalVault);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVaultFiles(prev => {
            const existingIds = new Set(prev.map(f => f.id));
            const newItems = parsed.filter(item => !existingIds.has(item.id));
            return [...prev, ...newItems];
          });
        }
      }
    } catch (e) {
      console.warn("Error reading local vault storage", e);
    }
  }, []);

  const handleAddFile = async (name: string, type: string, content: string, origin: 'generated' | 'uploaded' = 'generated') => {
    // 1. Optimistic & Local Storage Update
    const tempId = 'vault-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const tempFile: VaultFile = {
      id: tempId,
      name,
      type,
      date: new Date().toISOString(),
      content,
      origin
    };

    setVaultFiles(prev => {
      const updated = [tempFile, ...prev];
      try {
        localStorage.setItem('justino_local_vault', JSON.stringify(updated.slice(0, 30)));
      } catch (e) {}
      return updated;
    });

    // 2. Cloud Persistence (si está configurado Supabase)
    if (user?.id) {
        try {
            const savedFile = await uploadToVault(user.id, name, type, content, origin);
            if (savedFile) {
                // Replace temp with real cloud data
                setVaultFiles(prev => {
                  const updated = prev.map(f => f.id === tempId ? {
                    id: savedFile.id,
                    name: savedFile.name,
                    type: savedFile.type,
                    date: savedFile.created_at,
                    content: savedFile.content,
                    url: savedFile.url,
                    origin: savedFile.origin
                  } : f);
                  try {
                    localStorage.setItem('justino_local_vault', JSON.stringify(updated.slice(0, 30)));
                  } catch (e) {}
                  return updated;
                });
            }
        } catch (error) {
            console.warn("Conservando archivo en Bóveda local debido a límite/ausencia de nube:", error);
            // MANTENER tempFile en local state para que NUNCA desaparezca de la Bóveda del usuario
        }
    }
  };

  const hasExistingSession = !!user;

  return (
    <>
      {(view === 'landing' || view === 'onboarding') && (
        <LandingPage 
            onStart={handleStart} 
            onLogin={handleLoginClick}
            onAdminAccess={() => setView('admin-login')} 
            hasExistingSession={hasExistingSession} 
        />
      )}

      {showLoginModal && (
        <LoginModal onSuccess={handleLoginSuccess} onClose={cancelLogin} />
      )}

      {view === 'onboarding' && (
        <OnboardingModal 
          onComplete={completeOnboarding} 
          onClose={() => setView('landing')} 
          initialStep={onboardingStep}
        />
      )}

      {view === 'dashboard' && user && (
        <Dashboard 
          user={user} 
          messages={messages} 
          vaultFiles={vaultFiles}
          onNewMessage={handleNewMessage}
          onAddFile={handleAddFile}
          onLogout={handleLogout}
        />
      )}

      {view === 'admin-login' && (
          <AdminLogin 
            onSuccess={() => {
              sessionStorage.setItem('justino_admin_active', 'true');
              setView('admin-dashboard');
            }} 
            onClose={() => setView('landing')} 
          />
      )}

      {view === 'admin-dashboard' && (
          <AdminDashboard onLogout={handleAdminLogout} />
      )}
    </>
  );
}

export default App;
