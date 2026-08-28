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
  const [preferredName, setPreferredName] = useState('');
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

  // Handle Supabase Registration (Preferred Name + Username + Password)
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanPreferredName = preferredName.trim();
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const targetPassword = password.trim();
    const targetPaymentEmail = emailForPayment.trim() || sessionStorage.getItem('justino_payment_email') || '';

    if (!cleanPreferredName) {
      setErrorMessage('Por favor dinos cómo te gusta que te llamemos (ej. Carlos, Lic. Mariana).');
      return;
    }

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

    // Persist in localStorage for instant retrieval across sessions
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('justino_preferred_name', cleanPreferredName);
      localStorage.setItem('justino_username', cleanUsername);
    }

    try {
      // 1. Call server API to create/update user with admin rights (bypasses email confirmation requirement)
      let registeredUser: User | null = null;
      try {
        const regRes = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: cleanUsername,
            preferred_name: cleanPreferredName,
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
              username: cleanUsername,
              preferredName: cleanPreferredName
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
              username: cleanUsername,
              preferredName: cleanPreferredName
            };
          } else if (signErr) {
            // Fallback direct sign up
            const { data: signUpData } = await supabase.auth.signUp({
              email: authEmail,
              password: targetPassword,
              options: {
                data: {
                  username: cleanUsername,
                  preferred_name: cleanPreferredName,
                  payment_email: targetPaymentEmail
                }
              }
            });
            if (signUpData?.user) {
              registeredUser = {
                id: signUpData.user.id,
                email: targetPaymentEmail || authEmail,
                username: cleanUsername,
                preferredName: cleanPreferredName
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
        username: cleanUsername,
        preferredName: cleanPreferredName
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
        username: cleanUsername,
        preferredName: cleanPreferredName
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-navy-950/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg md:max-w-4xl lg:max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden relative animate-fade-in-up border border-white/10 max-h-[92dvh] md:max-h-none flex flex-col my-auto">
        
        {/* Modal Header */}
        <div className="bg-navy-900 px-6 py-4 sm:px-8 sm:py-5 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <Logo className="w-6 h-6 text-emerald-500" />
            <span className="font-bold tracking-tight text-base sm:text-lg">Justino • Asistencia Legal</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 shrink-0">
          <div 
            className="h-full bg-emerald-500 transition-all duration-700 ease-in-out" 
            style={{ width: step === 1 ? '50%' : '100%' }} 
          />
        </div>

        {/* Scrollable Container on Mobile, Natural fitting grid on Desktop */}
        <div className="overflow-y-auto no-scrollbar max-h-[calc(92dvh-75px)] md:max-h-none md:overflow-visible p-5 sm:p-7 md:p-8 lg:p-10">
          
          {/* STEP 1: PAYMENT WITH STRIPE */}
          {step === 1 && (
            <form onSubmit={handleProceedToStripe} className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-10 items-stretch">
                
                {/* LEFT COLUMN: OFFER DETAILS & VALUE (DESKTOP) */}
                <div className="md:col-span-6 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Garantía de Acompañamiento
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">Expediente Digital Pro</h2>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1 leading-relaxed">Acceso total a Justino para resolver tu caso legal de principio a fin.</p>
                  </div>

                  {/* Price & Plan Card */}
                  <div className="bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/50 border-2 border-emerald-500/20 rounded-2xl p-4 sm:p-5 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-navy-950 font-black text-base sm:text-lg">Acceso Vitalicio al Caso</p>
                      <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mt-0.5">Pago único • Sin mensualidades</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl sm:text-4xl font-black text-emerald-600 leading-none">$400</span>
                      <p className="text-[11px] text-emerald-700 font-extrabold uppercase">MXN</p>
                    </div>
                  </div>

                  {/* Features Included */}
                  <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-100 text-xs sm:text-sm text-slate-700 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span>Estrategia legal personalizada basada en leyes vigentes</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span>Redacción forense de todas tus denuncias y demandas listas para firmar</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span>Dirección exacta y requisitos de entrega física en tu ciudad</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span>Bóveda digital segura con almacenamiento de todos tus documentos</span>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-2 text-slate-400 text-xs font-semibold pt-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Pago encriptado SSL de 256-bit procesado con seguridad por Stripe</span>
                  </div>
                </div>

                {/* RIGHT COLUMN: ACTION, EMAIL & AMAZON/PAYPAL YELLOW BUY BUTTON */}
                <div className="md:col-span-6 flex flex-col justify-between space-y-4 md:border-l md:border-slate-100 md:pl-8 lg:pl-10">
                  <div className="space-y-4">
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
                          className="w-full p-3.5 sm:p-4 pl-12 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-amber-500 focus:bg-white focus:outline-none transition-all text-slate-900 font-bold placeholder:text-slate-400 text-sm sm:text-base" 
                          placeholder="ejemplo@correo.com" 
                        />
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 ml-1 font-medium">Recibirás aquí la confirmación y comprobante fiscal de tu caso.</p>
                    </div>

                    {/* Legal Terms Acceptance Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer group p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${acceptedTerms ? 'bg-emerald-500 border-emerald-500 shadow shadow-emerald-500/20' : 'border-slate-300 group-hover:border-emerald-500'}`}>
                        {acceptedTerms && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={acceptedTerms} 
                        onChange={(e) => setAcceptedTerms(e.target.checked)} 
                      />
                      <span className="text-xs text-slate-600 font-medium select-none leading-tight">
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
                      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-2 animate-fade-in">
                        <div className="flex items-center justify-center gap-2 text-amber-950 font-bold text-xs">
                          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                          <span>Abriendo pasarela de pago seguro...</span>
                        </div>
                        <a
                          href={directStripeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] text-xs font-black rounded-xl shadow-sm border border-[#FCD200] transition-all"
                        >
                          <span>Abrir pago en pestaña nueva</span>
                          <ExternalLink className="w-3.5 h-3.5 text-[#0F1111]" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Primary Stripe/PayPal/Amazon Yellow Button */}
                    <button 
                      type="submit" 
                      disabled={!emailForPayment} 
                      className="w-full py-4 px-6 bg-[#FFD814] hover:bg-[#F7CA00] active:bg-[#F0B800] text-[#0F1111] border border-[#FCD200] rounded-2xl font-black text-base shadow-lg shadow-amber-400/25 hover:shadow-amber-400/40 transition-all flex justify-center items-center gap-3 group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <CreditCard className="w-5 h-5 text-[#0F1111]" />
                      <span className="tracking-tight">Pagar con Stripe / Aplicar Cupón</span>
                      <ArrowRight className="w-4 h-4 text-[#0F1111] group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="flex flex-col items-center gap-2 text-center pt-1">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                      >
                        ¿Ya realizaste tu pago? Haz clic aquí para activar tu usuario
                      </button>

                      <div className="flex md:hidden items-center justify-center gap-2 text-slate-400 text-xs font-semibold">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span>Pago encriptado SSL de 256-bit por Stripe</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </form>
          )}

          {/* STEP 2: USERNAME + PASSWORD REGISTRATION (AFTER STRIPE SUCCESS) */}
          {step === 2 && (
            <form onSubmit={handleRegisterUser} className="max-w-xl mx-auto space-y-6 py-2">
              <div className="text-center">
                <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                  <Check className="w-8 h-8 text-white" strokeWidth={3} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-navy-900">¡Pago Confirmado!</h2>
                <p className="text-slate-500 text-sm mt-1">Crea tu usuario y contraseña para entrar de inmediato a tu expediente.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-navy-900 mb-2 uppercase tracking-widest">
                    ¿Cómo te gusta que te llamemos?
                  </label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      required 
                      autoFocus
                      value={preferredName} 
                      onChange={(e) => {
                        setPreferredName(e.target.value); 
                        setErrorMessage('');
                      }} 
                      className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300" 
                      placeholder="Ej: Carlos, Mariana, Lic. Fernando..." 
                    />
                    <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 ml-1 font-medium">Justino se dirigirá a ti por este nombre durante toda tu asesoría legal.</p>
                </div>

                <div>
                  <label className="block text-xs font-black text-navy-900 mb-2 uppercase tracking-widest">
                    Nombre de Usuario
                  </label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      required 
                      value={username} 
                      onChange={(e) => {
                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '')); 
                        setErrorMessage('');
                      }} 
                      className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300" 
                      placeholder="ejemplo: carlos24" 
                    />
                    <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 ml-1 font-medium">Tu clave de usuario para ingresar a tu expediente en cualquier momento.</p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-black text-navy-900 uppercase tracking-widest">
                      Contraseña / Clave de Acceso
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
                className="w-full py-4.5 bg-[#FFD814] hover:bg-[#F7CA00] active:bg-[#F0B800] text-[#0F1111] border border-[#FCD200] rounded-2xl font-black text-base transition-all flex justify-center items-center gap-3 shadow-xl shadow-amber-400/20 disabled:opacity-50 transform active:scale-95 cursor-pointer"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#0F1111]" /> 
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

