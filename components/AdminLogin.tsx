
import React, { useState } from 'react';
import { X, ShieldCheck, Lock, AlertTriangle, Loader2 } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../services/supabaseClient';

interface AdminLoginProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setError('');
    setIsLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !data.session) {
        setError('Acceso denegado. Credenciales inválidas.');
        return;
      }

      // Verify role on backend
      const response = await fetch('/api/v1/admin/verify', {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`
        }
      });

      if (!response.ok) {
        await supabase.auth.signOut();
        setError('No tienes permisos administrativos.');
        return;
      }

      onSuccess();
    } catch (err: any) {
      setError('Error en la puerta de enlace administrativa.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-900/20 rounded-full blur-[100px]" />
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl relative z-10 animate-fade-in-up">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
           <div className="flex items-center gap-2">
             <ShieldCheck className="w-5 h-5 text-emerald-500" />
             <span className="font-mono text-sm font-bold tracking-widest text-emerald-500">ADMIN_GATEWAY_V1</span>
           </div>
           <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
             <X className="w-5 h-5" />
           </button>
        </div>

        <div className="p-8">
           <div className="text-center mb-8">
             <Logo className="w-12 h-12 text-white mx-auto mb-4" />
             <h2 className="text-2xl font-bold">God Mode Access</h2>
             <p className="text-zinc-500 text-sm mt-1">Panel de Control Administrativo</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-5">
             <div>
               <label className="block text-xs font-mono text-zinc-400 mb-1">IDENTIFICADOR (EMAIL)</label>
               <input 
                 type="email" 
                 autoFocus
                 required
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                 placeholder="admin@justino.app"
               />
             </div>
             
             <div>
               <label className="block text-xs font-mono text-zinc-400 mb-1">CLAVE MAESTRA</label>
               <input 
                 type="password" 
                 required
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
               />
             </div>

             {error && (
               <div className="flex items-center gap-2 text-red-400 text-xs bg-red-900/20 p-3 rounded border border-red-900/50">
                 <AlertTriangle className="w-4 h-4" />
                 {error}
               </div>
             )}

             <button 
               type="submit"
               disabled={isLoading}
               className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
             >
               {isLoading ? (
                 <Loader2 className="w-4 h-4 animate-spin" />
               ) : (
                 <>
                   <Lock className="w-4 h-4" />
                   AUTENTICAR
                 </>
               )}
             </button>
           </form>

           <div className="mt-8 text-center">
             <p className="text-[10px] text-zinc-600 font-mono">
               IP: {Math.random().toString(16).substr(2, 8).toUpperCase()} :: SESSION_ID: {Date.now()}
             </p>
           </div>
        </div>
      </div>
    </div>
  );
};
