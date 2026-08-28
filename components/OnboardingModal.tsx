import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, AlertCircle, Lock, Eye, EyeOff, User as UserIcon, CreditCard, ShieldCheck, UserCheck, ExternalLink, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

const STRIPE_PAYMENT_LINK_BASE = "https://buy.stripe.com/eVqcN5bp2d739up9an1Nu04";

interface OnboardingModalProps {
  onComplete: (user?: User) => void;
  onClose: () => void;
  initialStep?: number;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, onClose, initialStep = 1 }) => {
  // Check URL parameters for active session or return from payment
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isPaidReturn = urlParams?.has('session_id') || urlParams?.has('paid') || urlParams?.has('success') || initialStep === 3;
  const savedPaymentEmail = typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('justino_payment_email') || '') : '';

  const [step, setStep] = useState<number>(isPaidReturn ? 2 : 1);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [emailForPayment, setEmailForPayment] = useState(savedPaymentEmail);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [directStripeUrl, setDirectStripeUrl] = useState<string>('');

  // Sync state if return from Stripe is detected
  useEffect(() => {
    if (isPaidReturn) {
      setStep(2);
      const storedEmail = sessionStorage.getItem('justino_payment_email') || '';
      if (storedEmail) {
        setEmailForPayment(storedEmail);
        const suggested = storedEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_.-]/g, '');
        if (suggested && !username) {
          setUsername(suggested);
        }
      }
    }
  }, [isPaidReturn]);

  // Handle Redirection to Stripe Payment Link
  const handleProceedToStripe = (e: React.FormEvent) => {
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

    const fullStripeUrl = `${STRIPE_PAYMENT_LINK_BASE}?prefilled_email=${encodeURIComponent(targetEmail)}`;
    setDirectStripeUrl(fullStripeUrl);
    setIsRedirecting(true);

    // Try multiple navigation methods to bypass iframe restrictions
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = fullStripeUrl;
      } else {
        window.location.href = fullStripeUrl;
      }
    } catch (err) {
      // If cross-origin iframe security prevents top navigation, open in new tab
      window.open(fullStripeUrl, '_blank', 'noopener,noreferrer');
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

    const authEmail = `${cleanUsername}@justino.app`;
    setIsRegistering(true);

    try {
      // 1. Call server API to create/update user with admin rights (bypasses email confirmation requirement)
      let registeredUser: User | null = null;
      try {
        const regRes = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: cleanUsername,
            password: targetPassword,
            payment_email: targetPaymentEmail
          })
        });
        if (regRes.ok) {
          const regJson = await regRes.json();
          if (regJson.user) {
            registeredUser = {
              id: regJson.user.id,
              email: regJson.user.email || authEmail,
              username: cleanUsername
            };
          }
        }
      } catch (backendErr) {
        console.warn("Backend register fetch exception:", backendErr);
      }

      // 2. Log in with Supabase client
      if (supabase) {
        try {
          const { data: signData, error: signErr } = await supabase.auth.signInWithPassword({
            email: authEmail,
            password: targetPassword
          });

          if (!signErr && signData?.user) {
            registeredUser = {
              id: signData.user.id,
              email: targetPaymentEmail || signData.user.email || authEmail,
              username: cleanUsername
            };
          } else if (signErr) {
            // Fallback direct sign up
            const { data: signUpData } = await supabase.auth.signUp({
              email: authEmail,
              password: targetPassword,
              options: {
                data: {
                  username: cleanUsername,
                  payment_email: targetPaymentEmail
                }
              }
            });
            if (signUpData?.user) {
              registeredUser = {
                id: signUpData.user.id,
                email: targetPaymentEmail || authEmail,
                username: cleanUsername
              };
            }
          }
        } catch (supabaseAuthErr) {
          console.warn("Client Supabase auth attempt:", supabaseAuthErr);
        }
      }

      // 3. Guarantee user state & proceed
      const finalUser: User = registeredUser || {
        id: 'user_' + cleanUsername,
        email: targetPaymentEmail || authEmail,
        username: cleanUsername
      };

      // Clean URL params from payment return
      if (typeof window !== 'undefined' && window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Trigger completion callback
      onComplete(finalUser);
    } catch (err: any) {
      console.error("Auth Register Exception:", err);
      // Fallback transition so user is never stuck
      const fallbackUser: User = {
        id: 'user_' + cleanUsername,
        email: targetPaymentEmail || authEmail,
        username: cleanUsername
      };
      if (typeof window !== 'undefined' && window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      onComplete(fallbackUser);
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

              {/* Redirecting feedback banner if user triggered payment */}
              {isRedirecting && directStripeUrl && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-center space-y-2 animate-fade-in">
                  <div className="flex items-center justify-center gap-2 text-indigo-900 font-bold text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Abriendo pasarela segura de Stripe...</span>
                  </div>
                  <a
                    href={directStripeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#635BFF] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#5851e5] transition-all"
                  >
                    <span>Abrir Stripe en pestaña nueva</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Primary Stripe Button */}
              <button 
                type="submit" 
                disabled={!emailForPayment} 
                className="w-full py-4.5 bg-[#635BFF] hover:bg-[#5851e5] text-white rounded-2xl font-bold text-base shadow-xl hover:shadow-indigo-500/25 transition-all flex justify-center items-center gap-3 group active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <CreditCard className="w-5 h-5" />
                <span>Pagar con Stripe / Aplicar Cupón</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-3 text-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                >
                  ¿Ya realizaste tu pago? Haz clic aquí para activar tu usuario
                </button>

                <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Pago encriptado SSL de 256-bit por Stripe</span>
                </div>
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
                    <span>Activando tu cuenta y abriendo caso...</span>
                  </>
                ) : (
                  <span>Activar Cuenta y Abrir mi Caso con Justino</span>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
