import React, { useState } from 'react';
import { X, ShieldAlert, Key, Terminal, Eye, EyeOff, Loader2, Cpu, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { Logo } from './Logo';

interface AdminLoginProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onClose }) => {
  const [username, setUsername] = useState('');
  const [key1, setKey1] = useState('');
  const [key2, setKey2] = useState('');
  const [showKey1, setShowKey1] = useState(false);
  const [showKey2, setShowKey2] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [decryptingStep, setDecryptingStep] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setDecryptingStep('INICIANDO ENLACE NEURAL CYBERPUNK...');

    try {
      // Step simulation for authentic cyberpunk feel
      await new Promise(r => setTimeout(r, 400));
      setDecryptingStep('VALIDANDO SECUENCIA TRISMEGISTO (2FA)...');
      
      const response = await fetch('/api/v1/admin/hermes-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          key1: key1.trim(),
          key2: key2.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'CREDENCIALES INVÁLIDAS // ACCESO DENEGADO');
      }

      setDecryptingStep('DESENCRIPTANDO MATRIZ DE DATOS HERMES...');
      sessionStorage.setItem('hermes_admin_token', data.token);
      sessionStorage.setItem('justino_admin_active', 'true');
      sessionStorage.setItem('hermes_operator', data.operator || 'HERMES');
      
      await new Promise(r => setTimeout(r, 600));
      setDecryptingStep('ACCESO TOTAL CONCEDIDO. CARGANDO HUD...');
      await new Promise(r => setTimeout(r, 400));

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'FALLO EN LA PUERTA DE ENLACE DE SEGURIDAD.');
    } finally {
      setIsLoading(false);
      setDecryptingStep('');
    }
  };

  const autofillHermes = () => {
    setUsername('HERMES');
    setKey1('Hola soy yo');
    setKey2('Trismegisto');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-mono selection:bg-emerald-500 selection:text-black">
      
      {/* CYBERPUNK BACKGROUND GRID & NEON AMBIENCE */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d410_1px,transparent_1px),linear-gradient(to_bottom,#10b98110_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* TERMINAL CRT SCANLINE OVERLAY */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.7)_100%)]" />

      <div className="w-full max-w-lg bg-[#070d1d]/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.15)] relative z-10 overflow-hidden">
        
        {/* TOP STATUS BAR */}
        <div className="px-6 py-4 bg-black/60 border-b border-emerald-500/20 flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-emerald-400 font-bold tracking-widest uppercase">HERMES PROTOCOL v4.9</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400 tracking-wider">CLEARANCE: OWNER</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-red-400 transition-colors p-1 flex items-center gap-1 hover:bg-white/5 rounded"
            title="Abortar acceso"
          >
            <span className="text-[10px]">[ESC // ABORT]</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          
          {/* LOGO & TERMINAL BANNER */}
          <div className="text-center space-y-2 border-b border-white/5 pb-6">
            <div className="inline-flex items-center justify-center p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl mb-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Logo className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white uppercase flex items-center justify-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400 inline" />
              Terminal de Control Hermes
            </h2>
            <p className="text-xs text-slate-400 tracking-wide">
              Panel Maestro de Operaciones &middot; Justino AI Legal
            </p>
          </div>

          {/* CREDENTIALS FORM */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* FIELD 1: USUARIO */}
            <div>
              <label className="block text-[11px] font-bold text-emerald-400 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>[01] USUARIO OPERADOR</span>
                <span className="text-[9px] text-slate-500">DEFAULT: HERMES</span>
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/80 border border-emerald-500/30 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-all font-mono placeholder:text-slate-600 uppercase"
                  placeholder="HERMES"
                />
                <Cpu className="w-4 h-4 text-emerald-500/50 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* FIELD 2: CLAVE 1 */}
            <div>
              <label className="block text-[11px] font-bold text-cyan-400 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>[02] CLAVE PRIMARIA</span>
                <span className="text-[9px] text-slate-500">FASE 1</span>
              </label>
              <div className="relative">
                <input 
                  type={showKey1 ? "text" : "password"} 
                  required
                  value={key1}
                  onChange={(e) => setKey1(e.target.value)}
                  className="w-full bg-black/80 border border-cyan-500/30 rounded-xl py-3 px-4 text-white text-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-mono placeholder:text-slate-600"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowKey1(!showKey1)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-cyan-400 transition-colors"
                >
                  {showKey1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* FIELD 3: CLAVE 2 (TRISMEGISTO) */}
            <div>
              <label className="block text-[11px] font-bold text-amber-400 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>[03] CLAVE SECUNDARIA (TRISMEGISTO)</span>
                <span className="text-[9px] text-slate-500">FASE 2</span>
              </label>
              <div className="relative">
                <input 
                  type={showKey2 ? "text" : "password"} 
                  required
                  value={key2}
                  onChange={(e) => setKey2(e.target.value)}
                  className="w-full bg-black/80 border border-amber-500/30 rounded-xl py-3 px-4 text-white text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all font-mono placeholder:text-slate-600"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowKey2(!showKey2)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-amber-400 transition-colors"
                >
                  {showKey2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* ERROR ALERT */}
            {error && (
              <div className="flex items-center gap-3 text-red-400 text-xs bg-red-950/40 p-3.5 rounded-xl border border-red-500/40 animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* PROGRESS DECRYPTING FEEDBACK */}
            {isLoading && (
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span className="tracking-wide animate-pulse">{decryptingStep}</span>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 mt-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-black font-black text-sm tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.4)] disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  DESENCRIPTANDO MATRIZ...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  DESBLOQUEAR TERMINAL HERMES
                </>
              )}
            </button>
          </form>

          {/* HELPER QUICK ACCESS LINK */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[11px] text-slate-500">
            <span>MODO SEGURO ACTIVO</span>
            <button 
              type="button" 
              onClick={autofillHermes}
              className="text-slate-400 hover:text-emerald-400 underline decoration-dotted transition-colors"
            >
              [ Cargar Credenciales Hermes ]
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
