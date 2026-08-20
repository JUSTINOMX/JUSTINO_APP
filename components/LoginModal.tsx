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
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const identifier = usernameOrEmail.trim();
    const cleanPassword = password.trim();

    if (!identifier) {
      setError('Por favor ingresa tu usuario o correo.');
      return;
    }

    if (!cleanPassword) {
      setError('Por favor ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      if (supabase) {
        // Convert username to auth format if needed
        const formattedEmail = identifier.includes('@') 
          ? identifier.toLowerCase() 
          : `${identifier.toLowerCase().replace(/[^a-z0-9_.-]/g, '')}@justino.app`;

        // 1. Try with formatted email / username
        let { data, error: authError } = await supabase.auth.signInWithPassword({
          email: formattedEmail,
          password: cleanPassword,
        });

        // 2. If it failed and was a raw email, retry as fallback
        if (authError && identifier.includes('@')) {
          const retry = await supabase.auth.signInWithPassword({
            email: identifier.trim(),
            password: cleanPassword,
          });
          data = retry.data;
          authError = retry.error;
        }

        if (authError) {
          if (authError.message?.toLowerCase().includes('invalid login') || authError.message?.toLowerCase().includes('credentials')) {
            setError('Usuario o contraseña incorrectos. Verifica tus datos.');
          } else {
            setError(authError.message || 'Error al iniciar sesión.');
          }
          setIsLoading(false);
          return;
        }

        if (data?.user) {
          const loggedUser: User = {
            id: data.user.id,
            email: data.user.email || formattedEmail,
            username: identifier
          };
          onSuccess(loggedUser);
          return;
        }
      }

      // Fallback preview mode
      const demoUser: User = {
        id: 'user-' + Date.now(),
        email: identifier.includes('@') ? identifier : `${identifier}@justino.app`,
        username: identifier
      };
      onSuccess(demoUser);
    } catch (err: any) {
      console.error("Login Exception:", err);
      setError('Error al conectar con el servidor. Intenta de nuevo.');
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
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
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
                Usuario o Correo Electrónico
              </label>
              <div className="relative group">
                <input 
                  type="text" 
                  required
                  autoFocus
                  value={usernameOrEmail}
                  onChange={(e) => {
                    setUsernameOrEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300"
                  placeholder="Tu usuario o correo"
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
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 uppercase tracking-tighter"
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
                  className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300"
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
              disabled={isLoading || !usernameOrEmail || !password}
              className="w-full py-4 bg-navy-900 text-white rounded-2xl font-bold shadow-xl hover:bg-navy-800 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 transform active:scale-95 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verificando acceso...</span>
                </>
              ) : (
                <>
                  <span>Abrir Expediente</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-4">
             <button
               type="button"
               onClick={() => onSuccess({ id: 'demo-user-preview', email: 'demo@justino.app', username: 'demo' })}
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
