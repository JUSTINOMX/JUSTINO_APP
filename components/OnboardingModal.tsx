
import React, { useState } from 'react';
import { X, Check, ExternalLink, Loader2, AlertCircle, Lock, Eye, EyeOff, User as UserIcon, CreditCard, Zap } from 'lucide-react';
import { Logo } from './Logo';
import { User } from '../types';
import { config } from '../config';
import { supabase } from '../services/supabaseClient';

interface OnboardingModalProps {
  onComplete: (user?: User) => void;
  onClose: () => void;
  initialStep?: number;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, onClose, initialStep = 1 }) => {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const sessionId = urlParams?.get('session_id');
  const savedPaymentEmail = typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('justino_payment_email') || '') : '';

  const [step, setStep] = useState(sessionId ? 3 : initialStep);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [email, setEmail] = useState(savedPaymentEmail);
  const [emailForPayment, setEmailForPayment] = useState(savedPaymentEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const handleNext = () => {
    if (step === 1 && acceptedTerms) setStep(2);
  };

  const handlePay = async () => {
    if (!emailForPayment) {
      setRegisterError("Por favor ingresa tu correo para el recibo.");
      return;
    }
    
    // Save email in session storage so it persists when returning from Stripe
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('justino_payment_email', emailForPayment);
    }

    setIsLoading(true);
    setRegisterError('');
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
      }

      const response = await fetch("/api/v1/stripe/create-checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({ email: emailForPayment })
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON API Response:", text);
        throw new Error("La pasarela de Stripe no está lista en el servidor o requiere la variable STRIPE_SECRET_KEY. Puedes usar los botones sin pago abajo para probar la creación de cuenta.");
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al procesar la solicitud de pago.");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "No se obtuvo la URL de redirección a Stripe.");
      }
    } catch (err: any) {
      console.error(err);
      setRegisterError(err.message || "Error al iniciar pago. Intenta de nuevo.");
      setIsLoading(false);
    }
  };

  // Check for successful payment return
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session_id');
    if (sid) {
      setStep(3);
      const storedEmail = sessionStorage.getItem('justino_payment_email');
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    const targetEmail = email.trim();
    const targetPassword = password.trim();

    if (!targetEmail || !targetPassword) {
      setRegisterError('Por favor introduce tu correo y clave.');
      return;
    }

    setIsRegistering(true);
    try {
      if (supabase) {
        const { data, error: authError } = await supabase.auth.signUp({
          email: targetEmail,
          password: targetPassword,
        });

        if (authError) {
          // If already registered in Supabase, sign in automatically
          if (authError.message?.toLowerCase().includes('already') || authError.message?.toLowerCase().includes('registered')) {
            const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
              email: targetEmail,
              password: targetPassword
            });

            if (loginErr) {
              setRegisterError("Este correo ya está registrado con otra clave. Introduce tu clave correcta o usa otro correo.");
              setIsRegistering(false);
              return;
            }

            if (loginData.user) {
              if (typeof window !== 'undefined' && window.location.search) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
              onComplete({ id: loginData.user.id, email: loginData.user.email || targetEmail });
              return;
            }
          }

          setRegisterError(authError.message);
          setIsRegistering(false);
          return;
        }

        if (data.user) {
          if (typeof window !== 'undefined' && window.location.search) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          onComplete({ id: data.user.id, email: data.user.email || targetEmail });
          return;
        }
      }

      // Fallback/direct mode (when Supabase is not connected or in local preview mode)
      const localUser: User = {
        id: 'user-' + Date.now(),
        email: targetEmail
      };
      if (typeof window !== 'undefined' && window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      onComplete(localUser);
    } catch (err: any) {
      console.error(err);
      setRegisterError("Error al crear la cuenta. Intenta de nuevo.");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/95 backdrop-blur-md">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative animate-fade-in-up border border-white/10">
        <div className="bg-navy-900 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Logo className="w-6 h-6 text-emerald-500" />
            <span className="font-bold tracking-tight">Protocolo Justino</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="h-1.5 w-full bg-slate-100">
          <div className="h-full bg-emerald-500 transition-all duration-700 ease-in-out" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-navy-900">Validación Jurídica</h2>
                <p className="text-slate-500 mt-2">Justino requiere tu acceptance de los protocolos.</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-sm text-slate-600 space-y-3">
                <div className="flex gap-3">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p><strong>Privacidad:</strong> Tus datos sensibles viajan encriptados.</p>
                </div>
                <div className="flex gap-3">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p><strong>Veracidad:</strong> Justino asume que los hechos narrados son reales.</p>
                </div>
              </div>
              <label className="flex items-start gap-4 cursor-pointer group p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${acceptedTerms ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-slate-300 group-hover:border-emerald-500'}`}>
                  {acceptedTerms && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </div>
                <input type="checkbox" className="hidden" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                <span className="text-sm text-slate-700 font-medium select-none">Acepto los términos y responsabilidades legales del servicio.</span>
              </label>
              <button onClick={handleNext} disabled={!acceptedTerms} className="w-full py-4 bg-navy-900 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-navy-800 disabled:opacity-30 disabled:grayscale transition-all transform active:scale-95">Continuar</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-navy-900">Membresía Vitalicia</h2>
                <p className="text-slate-500 mt-2">Acceso total a Justino para este caso específico.</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-6 flex justify-between items-center shadow-inner">
                <div>
                  <p className="text-emerald-900 font-bold text-lg">Expediente Pro</p>
                  <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wider">Pago único • Sin rentas</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-emerald-700 leading-none">$400</span>
                  <p className="text-[10px] text-emerald-600 font-bold">MXN</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative group">
                  <label className="block text-xs font-black text-navy-900 mb-2 uppercase tracking-widest">Tu Correo para Facturación</label>
                  <input 
                    type="email" 
                    required 
                    value={emailForPayment} 
                    onChange={(e) => {setEmailForPayment(e.target.value); setRegisterError('');}} 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300" 
                    placeholder="tu@email.com" 
                  />
                  {registerError && <p className="text-[10px] text-red-600 mt-1 font-bold">{registerError}</p>}
                </div>

                <button 
                  onClick={handlePay} 
                  disabled={isLoading} 
                  className="w-full py-5 bg-[#635BFF] hover:bg-[#5851e5] text-white rounded-2xl font-bold text-lg shadow-xl transition-all flex justify-center items-center gap-3 group active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-6 h-6" />
                      Pagar con Stripe
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-4 opacity-50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secure Checkout</span>
                  <div className="h-4 w-px bg-slate-200"></div>
                  <div className="flex gap-2">
                    <div className="w-6 h-4 bg-slate-200 rounded-sm"></div>
                    <div className="w-6 h-4 bg-slate-200 rounded-sm"></div>
                    <div className="w-6 h-4 bg-slate-200 rounded-sm"></div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 text-center space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Pago Protegido por Stripe 
                </p>

                {/* Banner Modo Prueba / Preview */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2.5">
                  <p className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center justify-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-600" /> Modo Prueba / Preview Activo
                  </p>
                  <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                    Pasarela en pausa temporal para pruebas. Accede directamente al expediente de Justino:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button 
                      type="button"
                      onClick={() => setStep(3)} 
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow transition-all"
                    >
                      Crear Cuenta (Sin Pago)
                    </button>
                    <button 
                      type="button"
                      onClick={() => onComplete({ id: 'demo-user-preview', email: emailForPayment || 'demo@justino.app' })} 
                      className="flex-1 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl font-bold text-xs shadow transition-all"
                    >
                      Entrar Directo como Demo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                  <Check className="w-10 h-10 text-white" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-bold text-navy-900">¡Pago Validado!</h2>
                <p className="text-slate-500 mt-2">Crea tus credenciales de acceso privadas.</p>
              </div>
              <div className="space-y-5">
                <div className="relative group">
                  <label className="block text-xs font-black text-navy-900 mb-2 uppercase tracking-widest">Correo Electrónico</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      required 
                      autoFocus
                      value={email} 
                      onChange={(e) => {setEmail(e.target.value); setRegisterError('');}} 
                      className={`w-full p-4 pl-12 bg-slate-50 border-2 rounded-2xl focus:outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300 ${registerError ? 'border-red-300 bg-red-50' : 'border-slate-100 focus:border-emerald-500 focus:bg-white focus:shadow-lg focus:shadow-emerald-500/5'}`} 
                      placeholder="tu@email.com" 
                    />
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  {registerError && <p className="text-[10px] text-red-600 mt-2 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {registerError}</p>}
                </div>
                
                <div className="relative group">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-black text-navy-900 uppercase tracking-widest">Clave de Acceso</label>
                    <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 uppercase tracking-tighter"
                    >
                        {showPassword ? <><EyeOff className="w-3 h-3" /> Ocultar</> : <><Eye className="w-3 h-3" /> Mostrar</>}
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white focus:outline-none focus:shadow-lg focus:shadow-emerald-500/5 transition-all text-slate-900 font-bold placeholder:text-slate-300" 
                      placeholder="Tu contraseña secreta" 
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isRegistering || !email || !password} 
                className="w-full py-5 bg-navy-900 text-white rounded-2xl font-bold text-lg hover:bg-navy-800 transition-all flex justify-center items-center gap-3 shadow-2xl shadow-navy-900/20 disabled:opacity-50 transform active:scale-95"
              >
                {isRegistering ? <><Loader2 className="w-6 h-6 animate-spin" /> Encriptando Bóveda...</> : "Empezar Mi Caso Ahora"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
