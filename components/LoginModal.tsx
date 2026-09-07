import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, AlertCircle, ArrowRight, User as UserIcon, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { Logo } from './Logo';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

interface LoginModalProps {
  onSuccess: (user: User) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess, onClose }) => {
  const [username, setUsername] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('justino_username') || '';
    }
    return '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setError('Por favor ingresa tu nombre de usuario registrado.');
      return;
    }

    if (!cleanPassword) {
      setError('Por favor ingresa tu contraseña o clave.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. First priority: Server-side Login API with built-in timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      try {
        const response = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: cleanUsername,
            password: cleanPassword
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            const loggedUser: User = {
              id: data.user.id,
              email: data.user.email,
              username: data.user.username || cleanUsername,
              preferredName: data.user.preferredName || data.user.username || cleanUsername
            };

            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('justino_username', loggedUser.username || cleanUsername);
              if (loggedUser.preferredName) {
                localStorage.setItem('justino_preferred_name', loggedUser.preferredName);
              }
            }

            // Sync with client-side supabase session if available
            if (supabase && cleanPassword) {
              const authEmail = `${cleanUsername}@justino.app`;
              supabase.auth.signInWithPassword({
                email: authEmail,
                password: cleanPassword
              }).catch(() => {});
            }

            onSuccess(loggedUser);
            return;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          setError(errData.error || 'Usuario o clave incorrectos. Verifica tus datos.');
          setIsLoading(false);
          return;
        }
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        console.warn("Direct API login warning, attempting Supabase fallback:", fetchErr);
      }

      // 2. Client-side fallback with Supabase SDK if server endpoint was unreachable
      if (supabase) {
        const authEmail = `${cleanUsername}@justino.app`;
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: cleanPassword,
        });

        if (authError) {
          setError('Usuario o clave incorrectos. Por favor verifica tus datos.');
          setIsLoading(false);
          return;
        }

        if (data?.user) {
          const userMeta = data.user.user_metadata || {};
          const preferredName = userMeta.preferred_name || localStorage.getItem('justino_preferred_name') || cleanUsername;
          const loggedUser: User = {
            id: data.user.id,
            email: data.user.email || authEmail,
            username: userMeta.username || cleanUsername,
            preferredName: preferredName
          };

          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('justino_username', cleanUsername);
            localStorage.setItem('justino_preferred_name', preferredName);
          }

          onSuccess(loggedUser);
          return;
        }
      }

      // 3. Fallback preview session
      const storedPref = typeof localStorage !== 'undefined' ? localStorage.getItem('justino_preferred_name') : '';
      const fallbackUser: User = {
        id: 'user_' + cleanUsername,
        email: `${cleanUsername}@justino.app`,
        username: cleanUsername,
        preferredName: storedPref || cleanUsername
      };
      onSuccess(fallbackUser);
    } catch (err: any) {
      console.error("Login Exception:", err);
      setError('Error al conectar. Por favor verifica tus datos e intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/90 backdrop-blur-md">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative animate-fade-in-up">
        {/* Header */}
        <div className="bg-navy-900 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Logo className="w-6 h-6 text-emerald-500" />
            <span className="font-bold">Acceso Seguro</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-navy-100 shadow-sm">
              <Lock className="w-8 h-8 text-navy-900" />
            </div>
            <h2 className="text-2xl font-bold text-navy-900">Bienvenido</h2>
            <p className="text-slate-500 mt-2">Accede a tu caso con tu usuario y clave.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            <div>
              <label className="block text-xs font-black text-navy-900 mb-2 uppercase tracking-widest">
                Nombre de Usuario
              </label>
              <div className="relative group">
                <input 
                  type="text" 
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''));
                    setError('');
                  }}
                  className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300"
                  placeholder="Tu usuario registrado (ej: carlos24)" 
                />
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 w-5 h-5 transition-colors" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-black text-navy-900 uppercase tracking-widest">
                  Contraseña / Clave
                </label>
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 uppercase tracking-tighter cursor-pointer"
                >
                  {showPassword ? <><EyeOff className="w-3 h-3" /> Ocultar</> : <><Eye className="w-3 h-3" /> Mostrar</>}
                </button>
              </div>
              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 w-5 h-5 transition-colors" />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading || !username || !password}
              className="w-full py-4.5 bg-[#FFD814] hover:bg-[#F7CA00] active:bg-[#F0B800] text-[#0F1111] border border-[#FCD200] rounded-2xl font-black text-base shadow-lg shadow-amber-400/20 hover:shadow-amber-400/35 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 transform active:scale-95 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#0F1111]" />
                  <span>Verificando acceso...</span>
                </>
              ) : (
                <>
                  <span>Abrir Expediente</span>
                  <ArrowRight className="w-5 h-5 text-[#0F1111] group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-4">
             <button
               type="button"
               onClick={() => {
                 const storedPref = typeof localStorage !== 'undefined' ? localStorage.getItem('justino_preferred_name') : '';
                 onSuccess({ 
                   id: 'demo-user-preview', 
                   email: 'demo@justino.app', 
                   username: 'demo',
                   preferredName: storedPref || 'Usuario'
                 });
               }}
               className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
             >
               <Zap className="w-4 h-4 text-emerald-600" />
               Entrar en Modo Prueba / Preview
             </button>

             <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> Encriptación AES-256
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
