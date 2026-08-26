import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, AlertCircle, Lock, Eye, EyeOff, User as UserIcon, CreditCard, ShieldCheck, UserCheck } from 'lucide-react';
import { Logo } from './Logo';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

interface OnboardingModalProps {
  onComplete: (user?: User) => void;
  onClose: () => void;
  initialStep?: number;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, onClose, initialStep = 1 }) => {
  // Check URL parameters for active session_id from Stripe
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const sessionId = urlParams?.get('session_id');
  const savedPaymentEmail = typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('justino_payment_email') || '') : '';

  // If returning from Stripe with a session_id, go to Step 2 (Register in Supabase); otherwise Step 1 (Payment with Stripe)
  const [step, setStep] = useState<number>(sessionId ? 2 : (initialStep === 3 ? 2 : 1));
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [emailForPayment, setEmailForPayment] = useState(savedPaymentEmail);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state if session_id is detected
  useEffect(() => {
    if (sessionId) {
      setStep(2);
      const storedEmail = sessionStorage.getItem('justino_payment_email') || '';
      if (storedEmail) {
        setEmailForPayment(storedEmail);
        // Pre-fill username default suggestion based on email prefix if not set
        const suggested = storedEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_.-]/g, '');
        if (suggested && !username) {
          setUsername(suggested);
        }
      }
    }
  }, [sessionId]);

  // Handle Redirection to Stripe Checkout
  const handleProceedToStripe = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const targetEmail = emailForPayment.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setErrorMessage("Por favor ingresa un correo electrónico válido para tu recibo y expediente.");
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage("Debes aceptar los términos y responsabilidades legales para continuar.");
      return;
    }
    
    // Save email in session storage so it persists when returning from Stripe
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('justino_payment_email', targetEmail);
    }

    setIsLoading(true);
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
        body: JSON.stringify({ email: targetEmail })
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON API Response from Stripe:", text);
        throw new Error("No se pudo conectar con el servicio de pagos. Verifica la configuración de Stripe.");
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al procesar la solicitud de pago.");
      }

      if (data.url) {
        // Redirect directly to Stripe hosted checkout page
        window.location.href = data.url;
      } else {
        throw new Error("No se recibió el enlace de pago de Stripe.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Error al iniciar el pago con Stripe. Intenta de nuevo.");
      setIsLoading(false);
    }
  };

  // Handle Supabase Registration (Username + Password)
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const targetPassword = password.trim();
    const targetPaymentEmail = emailForPayment.trim() || sessionStorage.getItem('justino_payment_email') || '';

    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage('El nombre de usuario debe contener al menos 3 caracteres (letras, números o guiones).');
      return;
    }

    if (!targetPassword || targetPassword.length < 6) {
      setErrorMessage('La contraseña debe contener al menos 6 caracteres.');
      return;
    }

    // Format auth email for Supabase Auth internal store
    const authEmail = `${cleanUsername}@justino.app`;

    setIsRegistering(true);
    try {
      if (supabase) {
        // 1. Attempt to create the user account in Supabase
        const { data: signUpData, error: authError } = await supabase.auth.signUp({
          email: authEmail,
          password: targetPassword,
          options: {
            data: {
              username: cleanUsername,
              payment_email: targetPaymentEmail
            }
          }
        });

        if (authError) {
          // If already registered with this username, attempt to log in
          if (authError.message?.toLowerCase().includes('already') || authError.message?.toLowerCase().includes('registered')) {
            const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
              email: authEmail,
              password: targetPassword
            });

            if (loginErr) {
              setErrorMessage("Este nombre de usuario ya está registrado. Ingresa tu contraseña correcta o elige otro nombre de usuario.");
              setIsRegistering(false);
              return;
            }

            if (loginData.user) {
              // Ensure profile record in Supabase
              await supabase.from('profiles').upsert({
                id: loginData.user.id,
                email: targetPaymentEmail || authEmail,
                has_active_access: true,
                updated_at: new Date().toISOString()
              }, { onConflict: 'id' });

              // Clean URL from session_id
              if (typeof window !== 'undefined' && window.location.search) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
              onComplete({ id: loginData.user.id, email: targetPaymentEmail || authEmail, username: cleanUsername });
              return;
            }
          }

          setErrorMessage(authError.message);
          setIsRegistering(false);
          return;
        }

        if (signUpData.user) {
          // Automatically create/update the profile & legal case in Supabase
          try {
            await supabase.from('profiles').upsert({
              id: signUpData.user.id,
              email: targetPaymentEmail || authEmail,
              has_active_access: true,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

            await supabase.from('legal_cases').upsert({
              id: signUpData.user.id,
              user_id: signUpData.user.id,
              title: `Expediente de ${cleanUsername}`,
              case_type: 'general',
              status: 'active'
            }, { onConflict: 'id' });
          } catch (pErr) {
            console.warn("Profile/Case upsert note:", pErr);
          }

          // Clean URL from session_id
          if (typeof window !== 'undefined' && window.location.search) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          onComplete({ id: signUpData.user.id, email: targetPaymentEmail || authEmail, username: cleanUsername });
          return;
        }
      }

      // Fallback for environment without live Supabase
      const localUser: User = {
        id: 'user-' + Date.now(),
        email: targetPaymentEmail || authEmail,
        username: cleanUsername
      };
      if (typeof window !== 'undefined' && window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      onComplete(localUser);
    } catch (err: any) {
      console.error("Auth Exception:", err);
      setErrorMessage("Error al activar la cuenta. Intenta de nuevo.");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/90 backdrop-blur-md">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative animate-fade-in-up border border-white/10">
        
        {/* Modal Header */}
        <div className="bg-navy-900 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Logo className="w-6 h-6 text-emerald-500" />
            <span className="font-bold tracking-tight">Justino • Asistencia Legal</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition-colors"
            title="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100">
          <div 
            className="h-full bg-emerald-500 transition-all duration-700 ease-in-out" 
            style={{ width: step === 1 ? '50%' : '100%' }} 
          />
        </div>

        <div className="p-8">
          
          {/* STEP 1: PAYMENT WITH STRIPE */}
          {step === 1 && (
            <form onSubmit={handleProceedToStripe} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-navy-900">Expediente Digital Pro</h2>
                <p className="text-slate-500 text-sm mt-1">Acceso total a Justino para resolver tu caso legal de principio a fin.</p>
              </div>

              {/* Price & Plan Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-5 flex justify-between items-center shadow-inner">
                <div>
                  <p className="text-emerald-950 font-bold text-base">Acceso Vitalicio al Caso</p>
                  <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wider">Pago único • Sin mensualidades</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-emerald-700 leading-none">$400</span>
                  <p className="text-[10px] text-emerald-600 font-bold">MXN</p>
                </div>
              </div>

              {/* Features Included */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Estrategia legal personalizada basada en leyes vigentes</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Redacción forense de todas tus denuncias y demandas listas para firmar</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Dirección exacta y requisitos de entrega física en tu ciudad</span>
                </div>
              </div>

              {/* Email Input for Invoice / Receipt */}
              <div>
                <label className="block text-xs font-black text-navy-900 mb-2 uppercase tracking-widest">
                  Correo Electrónico para Recibo de Pago
                </label>
                <div className="relative group">
                  <input 
                    type="email" 
                    required 
                    autoFocus
                    value={emailForPayment} 
                    onChange={(e) => {
                      setEmailForPayment(e.target.value); 
                      setErrorMessage('');
                    }} 
                    className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300" 
                    placeholder="ejemplo@correo.com" 
                  />
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
              </div>

              {/* Legal Terms Acceptance Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${acceptedTerms ? 'bg-emerald-500 border-emerald-500 shadow shadow-emerald-500/20' : 'border-slate-300 group-hover:border-emerald-500'}`}>
                  {acceptedTerms && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={acceptedTerms} 
                  onChange={(e) => setAcceptedTerms(e.target.checked)} 
                />
                <span className="text-xs text-slate-600 font-medium select-none">
                  Acepto los términos del servicio y confirmo que los hechos que narraré a Justino son verídicos.
                </span>
              </label>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Primary Stripe Button */}
              <button 
                type="submit" 
                disabled={isLoading || !emailForPayment} 
                className="w-full py-4.5 bg-[#635BFF] hover:bg-[#5851e5] text-white rounded-2xl font-bold text-base shadow-xl hover:shadow-indigo-500/25 transition-all flex justify-center items-center gap-3 group active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pagar con Stripe / Aplicar Cupón
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-3 text-slate-400 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Pago encriptado SSL de 256-bit por Stripe</span>
              </div>
            </form>
          )}

          {/* STEP 2: USERNAME + PASSWORD REGISTRATION (AFTER STRIPE SUCCESS) */}
          {step === 2 && (
            <form onSubmit={handleRegisterUser} className="space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                  <Check className="w-8 h-8 text-white" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-bold text-navy-900">¡Pago Confirmado!</h2>
                <p className="text-slate-500 text-sm mt-1">Crea tu usuario y contraseña para entrar de inmediato a tu expediente.</p>
              </div>

              <div className="space-y-4">
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
                        setErrorMessage('');
                      }} 
                      className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300" 
                      placeholder="ejemplo: edwinsolis" 
                    />
                    <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 ml-1 font-medium">Usarás este usuario para volver a entrar a tu caso en cualquier momento.</p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-black text-navy-900 uppercase tracking-widest">
                      Crea tu Contraseña / Clave
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
                        setErrorMessage('');
                      }} 
                      className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300" 
                      placeholder="Mínimo 6 caracteres" 
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isRegistering || !username || !password} 
                className="w-full py-4.5 bg-navy-900 hover:bg-navy-800 text-white rounded-2xl font-bold text-base transition-all flex justify-center items-center gap-3 shadow-xl shadow-navy-900/20 disabled:opacity-50 transform active:scale-95 cursor-pointer"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> 
                    Activando tu caso...
                  </>
                ) : (
                  "Activar Cuenta y Comenzar con Justino"
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
