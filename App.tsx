
import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { LandingPageV2 } from './components/LandingPageV2';
import { OnboardingModal } from './components/OnboardingModal';
import { Dashboard } from './components/Dashboard';
import { LoginModal } from './components/LoginModal';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { User, AppView, Message, VaultFile } from './types';
import { supabase } from './services/supabaseClient';
import { config } from './config';
import { uploadToVault } from './services/justino-service';

const createInitialWelcomeMessage = (preferredName?: string): Message => {
  const displayName = preferredName ? preferredName.trim() : '';
  const greeting = displayName ? `Hola **${displayName}**` : `Hola`;
  return {
    id: 'welcome',
    text: `${greeting}, bienvenido a tu expediente. Soy Justino, tu guía legal digital. Te encuentras en un sitio blindado y seguro; tu información está protegida al 100% y nadie más que tú tiene acceso.\n\nMi objetivo es resolver tu situación legal de principio a fin. Yo me encargaré de explicarte tus opciones, generar cada documento que necesites y decirte exactamente dónde y cómo entregarlos para que tú mismo tomes el control de tu caso sin necesidad de intermediarios ni gastos excesivos.\n\nPara comenzar a trazar tu estrategia, cuéntame: ¿En qué ciudad te encuentras y qué situación legal vamos a solucionar hoy?`,
    sender: 'bot',
    timestamp: new Date(),
  };
};

function App() {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const hasPaymentSuccess = Boolean(
    urlParams?.get('session_id') || 
    urlParams?.get('paid') || 
    urlParams?.get('success') || 
    urlParams?.get('payment')
  );

  const [view, setView] = useState<AppView>(hasPaymentSuccess ? 'onboarding' : 'landing');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(hasPaymentSuccess ? 2 : 1);
  
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([createInitialWelcomeMessage()]);
  const [vaultFiles, setVaultFiles] = useState<VaultFile[]>([]);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);

  // The new high-converting landing page (LandingPageV2) is now the DEFAULT for root (/) and /lp.
  // The previous landing page remains preserved and accessible for traffic via /v1, /respaldo, /original, ?v=1, etc.
  const detectIsPreviousLanding = (): boolean => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.toLowerCase();
    return (
      path.startsWith('/v1') || 
      path.startsWith('/respaldo') || 
      path.startsWith('/original') || 
      path.startsWith('/antigua') ||
      params.get('v') === '1' || 
      params.get('version') === '1' || 
      params.get('respaldo') === 'true' ||
      hash.includes('v1') ||
      hash.includes('respaldo')
    );
  };

  const [isPreviousLanding, setIsPreviousLanding] = useState<boolean>(detectIsPreviousLanding);

  useEffect(() => {
    const handleUrlChange = () => {
      setIsPreviousLanding(detectIsPreviousLanding());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Detect payment return or session_id in URL upon mount or state changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isPaid = Boolean(
      params.get('session_id') || 
      params.get('paid') || 
      params.get('success') || 
      params.get('payment')
    );
    if (isPaid) {
      setView('onboarding');
      setOnboardingStep(2);
    }
  }, []);

  // Helper to ensure user profile & case record in Supabase
  const ensureUserProfileAndCase = async (userId: string, email: string, preferredName?: string) => {
    if (!supabase) return;
    try {
      let targetUserId = userId;
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId);
      if (!isValidUuid) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          targetUserId = session.user.id;
        } else {
          console.warn("Skipping direct profile upsert for non-UUID temporary user:", targetUserId);
          return;
        }
      }

      const cleanUsername = preferredName 
        ? preferredName.toLowerCase().replace(/[^a-z0-9_.-]/g, '')
        : (email ? email.split('@')[0] : 'usuario');

      const displayName = preferredName || email.split('@')[0];

      await supabase.from('profiles').upsert({
        id: targetUserId,
        email: email,
        full_name: displayName,
        display_name: displayName,
        username: cleanUsername,
        has_active_access: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      const { data: existingCases } = await supabase
        .from('legal_cases')
        .select('id')
        .eq('user_id', targetUserId)
        .limit(1);

      if (existingCases && existingCases.length > 0) {
        setCurrentCaseId(existingCases[0].id);
      } else {
        const { data: newCase } = await supabase.from('legal_cases').insert([{
          user_id: targetUserId,
          title: `Expediente de ${displayName || 'Principal'}`,
          case_type: 'general',
          status: 'active',
          state_jurisdiction: 'Nacional / México',
          city_jurisdiction: 'Por definir',
          updated_at: new Date().toISOString()
        }]).select('id').single();

        if (newCase?.id) {
          setCurrentCaseId(newCase.id);
        }
      }
    } catch (err) {
      console.warn("Could not ensure profile/case in Supabase:", err);
    }
  };

  useEffect(() => {
    if (!supabase) return;

    // Supabase Auth Listener (The Single Source of Truth)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const params = new URLSearchParams(window.location.search);
      const isPaidPending = Boolean(
        params.get('session_id') || 
        params.get('paid') || 
        params.get('success') || 
        params.get('payment')
      );

      // If user just returned from payment, do NOT auto-jump to dashboard: wait for them to submit username/password in onboarding modal
      if (isPaidPending) {
        return;
      }

      if (session?.user) {
        const userMeta = (session.user.user_metadata as any) || {};
        const storedPref = typeof localStorage !== 'undefined' ? localStorage.getItem('justino_preferred_name') : '';
        let preferredName = userMeta.preferred_name || storedPref || userMeta.username || session.user.email?.split('@')[0] || 'Usuario';
        let cleanUsername = userMeta.username || session.user.email?.split('@')[0] || 'Usuario';

        // Query profiles table directly from Supabase to get the exact database name
        try {
          const { data: dbProfile } = await supabase
            .from('profiles')
            .select('full_name, display_name, username')
            .eq('id', session.user.id)
            .maybeSingle();

          if (dbProfile) {
            if (dbProfile.full_name && dbProfile.full_name.trim()) {
              preferredName = dbProfile.full_name.trim();
            } else if (dbProfile.display_name && dbProfile.display_name.trim()) {
              preferredName = dbProfile.display_name.trim();
            }
            if (dbProfile.username && dbProfile.username.trim()) {
              cleanUsername = dbProfile.username.trim();
            }
          }
        } catch (dbErr) {
          console.warn("Error fetching Supabase profile in auth listener:", dbErr);
        }

        const loggedUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          username: cleanUsername,
          preferredName: preferredName
        };
        setUser(loggedUser);

        // Update welcome message dynamically with real name
        setMessages(prev => {
          if (prev.length <= 1) {
            return [createInitialWelcomeMessage(preferredName)];
          }
          return prev;
        });

        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('justino_preferred_name', preferredName);
          localStorage.setItem('justino_username', cleanUsername);
        }
        
        // Auto-provision profile and default case in Supabase
        await ensureUserProfileAndCase(session.user.id, session.user.email || '', preferredName);

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
  }, [view]);

  // Sincronización de datos del usuario (Cloud First)
  useEffect(() => {
    if (user && (view === 'dashboard' || view === 'admin-dashboard')) {
        const fetchCloudData = async () => {
            if (!supabase || !user.id) return;

            try {
                const { data: msgs, error: msgError } = await supabase
                    .from('case_messages')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: true });
                
                if (msgs && !msgError) {
                    if (msgs.length === 0) {
                        setMessages([createInitialWelcomeMessage(user.preferredName || user.username)]);
                    } else {
                        const formattedMessages: Message[] = msgs.map(m => ({
                            id: m.id || String(m.created_at),
                            text: m.content || '',
                            sender: m.role === 'user' ? 'user' : 'bot',
                            timestamp: new Date(m.created_at || Date.now())
                        }));
                        setMessages(formattedMessages);
                    }
                } else if (messages.length <= 1) {
                    setMessages([createInitialWelcomeMessage(user.preferredName || user.username)]);
                }

                const { data: files, error: fileError } = await supabase
                    .from('case_vault_documents')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (files && !fileError && files.length > 0) {
                    const formattedFiles: VaultFile[] = files.map(f => ({
                        id: f.id,
                        name: f.title,
                        type: f.type || 'application/pdf',
                        content: f.legal_content,
                        url: f.url,
                        origin: (f.origin || 'generated') as 'generated' | 'uploaded',
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
    // Modo de prueba temporal: el pago de Stripe está deshabilitado para pruebas de uso
    // Al hacer clic en empezar mi caso, lleva directamente a la creación de usuario
    setOnboardingStep(2);
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const cancelLogin = () => {
    setShowLoginModal(false);
  };

  const handleLoginSuccess = (loggedUser?: User) => {
    if (loggedUser) {
      setUser(loggedUser);
    }
    setShowLoginModal(false);
    setView('dashboard');
  };

  const completeOnboarding = (testUser?: User) => {
    const activeUser = testUser || user || {
      id: 'user_' + Date.now(),
      email: 'usuario@justino.app',
      username: 'usuario'
    };
    
    setUser(activeUser);
    
    // Clear URL query parameters cleanly
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    setView('dashboard');

    if (activeUser.id && activeUser.email) {
      ensureUserProfileAndCase(activeUser.id, activeUser.email, activeUser.preferredName).catch(console.warn);
    }
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('justino_admin_active');
      sessionStorage.clear();
      
      // Clean up Supabase tokens from localStorage
      if (typeof localStorage !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase') || key.startsWith('justino_session'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }

      if (supabase) {
        await supabase.auth.signOut().catch((err) => {
          console.warn("Supabase signOut notice:", err);
        });
      }
    } catch (err) {
      console.warn("Logout error handled gracefully:", err);
    } finally {
      setUser(null);
      setMessages([createInitialWelcomeMessage()]);
      setVaultFiles([]);
      setView('landing');
    }
  };

  const handleAdminLogout = async () => {
    try {
      sessionStorage.removeItem('justino_admin_active');
      sessionStorage.removeItem('hermes_admin_token');
      sessionStorage.removeItem('hermes_operator');
      sessionStorage.clear();
      if (supabase) {
        await supabase.auth.signOut().catch(() => {});
      }
    } catch (err) {
      console.warn("Admin logout notice:", err);
    } finally {
      setUser(null);
      setShowLoginModal(false);
      setView('landing');
    }
  };

  const handleNewMessage = (msg: Message) => {
    if (messages.some(m => m.id === msg.id)) {
      return;
    }

    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) {
        return prev;
      }
      return [...prev, msg];
    });

    // Fire-and-forget background sync to Supabase case_messages
    if (supabase && user?.id) {
      (async () => {
        try {
          let targetCaseId = currentCaseId;
          if (!targetCaseId) {
            const { data: c } = await supabase
              .from('legal_cases')
              .select('id')
              .eq('user_id', user.id)
              .limit(1);
            if (c && c.length > 0) {
              targetCaseId = c[0].id;
              setCurrentCaseId(targetCaseId);
            }
          }

          if (!targetCaseId) {
            const displayName = user.preferredName || user.username || 'Principal';
            const { data: newC } = await supabase
              .from('legal_cases')
              .insert([{
                user_id: user.id,
                title: `Expediente de ${displayName}`,
                case_type: 'general',
                status: 'active',
                state_jurisdiction: 'Nacional / México',
                city_jurisdiction: 'Por definir'
              }])
              .select('id')
              .single();
            if (newC?.id) {
              targetCaseId = newC.id;
              setCurrentCaseId(targetCaseId);
            }
          }

          if (targetCaseId) {
            await supabase.from('case_messages').insert([{
              case_id: targetCaseId,
              user_id: user.id,
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.text,
              sources: []
            }]);
          }
        } catch (syncErr) {
          console.warn("Background case_message sync notice:", syncErr);
        }
      })();
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
        isPreviousLanding ? (
          <LandingPage 
            onStart={handleStart} 
            onLogin={handleLoginClick}
            onAdminAccess={() => setView('admin-login')} 
            hasExistingSession={hasExistingSession} 
          />
        ) : (
          <LandingPageV2 
            onStart={handleStart} 
            onLogin={handleLoginClick}
            onAdminAccess={() => setView('admin-login')} 
            hasExistingSession={hasExistingSession} 
          />
        )
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

      {view === 'dashboard' && (
        <Dashboard 
          user={user || { id: 'user_active', email: 'usuario@justino.app', username: 'Usuario' }} 
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
