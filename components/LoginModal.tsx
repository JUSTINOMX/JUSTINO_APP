
// Added React to imports to fix missing namespace error
import React, { useState } from 'react';
// Consistently importing ShieldCheck at the top with other lucide-react icons
import { X, Lock, Eye, EyeOff, AlertCircle, ArrowRight, User as UserIcon, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { Logo } from './Logo';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

interface LoginModalProps {
  onSuccess: (user: User) => void;
  onClose: () => void;
}

// React.FC requires React to be imported
export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setError('');
    setIsLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          setError('Correo o contraseña incorrectos.');
        } else {
          setError(authError.message);
        }
        return;
      }

      onSuccess({ id: 'temp', email }); // App.tsx onAuthStateChange will handle the real user state
    } catch (err: any) {
      console.error(err);
      setError('Error de conexión. Intenta nuevamente.');
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
            <p className="text-slate-500 mt-2">Accede a tu caso desde cualquier dispositivo.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            <div>
              <label className="block text-xs font-black text-navy-900 mb-2 uppercase tracking-widest">Correo Electrónico</label>
              <div className="relative group">
                <input 
                  type="email" 
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300"
                  placeholder="tu@email.com"
                />
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 w-5 h-5 transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-navy-900 mb-2 uppercase tracking-widest">Contraseña</label>
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
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100 animate-pulse-fast">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-navy-900 text-white rounded-2xl font-bold shadow-xl hover:bg-navy-800 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 transform active:scale-95"
            >
              {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                  <>
                    Abrir Expediente
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-4">
             <button
               type="button"
               onClick={() => onSuccess({ id: 'demo-user-preview', email: 'demo@justino.app' })}
               className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
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
