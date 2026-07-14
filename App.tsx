
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

function App() {
  const [view, setView] = useState<AppView>('landing');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [vaultFiles, setVaultFiles] = useState<VaultFile[]>([]);

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
                    const formattedMessages: Message[] = msgs.map(m => ({
                        id: m.id,
                        text: m.text,
                        sender: m.sender,
                        timestamp: new Date(m.timestamp),
                        attachment: m.attachment || undefined
                    }));
                    
                    setMessages(formattedMessages);
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

  const handleLoginSuccess = () => {
    setView('dashboard');
  };

  const completeOnboarding = async () => {
    setView('dashboard');
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('justino_admin_active');
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setMessages([]);
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

  const handleAddFile = async (name: string, type: string, content: string, origin: 'generated' | 'uploaded' = 'generated') => {
    // 1. Optimistic Update
    const tempId = Date.now().toString();
    const tempFile: VaultFile = {
      id: tempId,
      name,
      type,
      date: new Date().toISOString(),
      content,
      origin
    };
    setVaultFiles(prev => [tempFile, ...prev]);

    // 2. Real Persistence
    if (user?.id) {
        try {
            const savedFile = await uploadToVault(user.id, name, type, content, origin);
            if (savedFile) {
                // Replace temp with real data
                setVaultFiles(prev => prev.map(f => f.id === tempId ? {
                    id: savedFile.id,
                    name: savedFile.name,
                    type: savedFile.type,
                    date: savedFile.created_at,
                    content: savedFile.content,
                    url: savedFile.url,
                    origin: savedFile.origin
                } : f));
            }
        } catch (error) {
            console.error("Failed to save file to Vault:", error);
            // Revert optimistic update
            setVaultFiles(prev => prev.filter(f => f.id !== tempId));
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
        <LoginModal onSuccess={() => setShowLoginModal(false)} onClose={cancelLogin} />
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
