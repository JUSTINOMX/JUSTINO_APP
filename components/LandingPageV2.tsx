import React, { useState } from 'react';
import { 
  ArrowRight, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Key, 
  Scale, 
  FolderKanban, 
  HelpCircle,
  Sparkles,
  ArrowDown,
  Building2,
  FileCheck2,
  Users2,
  Clock3
} from 'lucide-react';
import { Logo } from './Logo';

// URLs públicas en Supabase Storage (CDN global de alta disponibilidad)
const LANDING_IMAGES = {
  hero: 'https://msigkydllxgirspdjegm.supabase.co/storage/v1/object/public/landing/hero-justino.jpg',
  dudas: 'https://msigkydllxgirspdjegm.supabase.co/storage/v1/object/public/landing/dudas-justino.jpg',
  continuidad: 'https://msigkydllxgirspdjegm.supabase.co/storage/v1/object/public/landing/caso-continuidad.jpg',
  mexico: 'https://msigkydllxgirspdjegm.supabase.co/storage/v1/object/public/landing/mexico-contexto.jpg',
  privacidad: 'https://msigkydllxgirspdjegm.supabase.co/storage/v1/object/public/landing/privacidad-vault.jpg'
};

interface LandingPageV2Props {
  onStart: () => void;
  onLogin: () => void;
  onAdminAccess: () => void;
  hasExistingSession: boolean;
}

export const LandingPageV2: React.FC<LandingPageV2Props> = ({
  onStart,
  onLogin,
  onAdminAccess,
  hasExistingSession
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqItems = [
    {
      q: '¿JUSTINO es un abogado?',
      a: 'No. JUSTINO es una plataforma de tecnología y orientación jurídica desarrollada para ayudarte a comprender tu situación, estructurar tu expediente y saber cuál es tu siguiente paso con claridad.'
    },
    {
      q: '¿JUSTINO sustituye a un abogado?',
      a: 'No necesariamente. Asuntos que requieren representación formal ante juzgados o autoridades demandan la intervención de un abogado con cédula profesional. Justino te ayuda a llegar preparado, con documentos organizados y sabiendo cuándo conviene contratar a un especialista.'
    },
    {
      q: '¿Tengo que saber qué ley aplica a mi problema?',
      a: 'Para nada. No necesitas saber términos jurídicos. Solo cuéntale en tus propias palabras qué ocurrió y Justino identificará el marco legal correspondiente en México.'
    },
    {
      q: '¿Necesito tener todos mis documentos para empezar?',
      a: 'No. Puedes comenzar con lo que tengas a la mano hoy. Conforme avance tu caso, Justino te indicará exactamente qué documentos necesitas reunir y cómo clasificarlos.'
    },
    {
      q: '¿Puedo usar JUSTINO si mi problema ya comenzó hace meses?',
      a: 'Sí. Puedes explicar los antecedentes, qué acciones se tomaron y en qué etapa se encuentra actualmente para evaluar los plazos legales y las opciones vigentes.'
    },
    {
      q: '¿Tengo que pagar cada mes o hay suscripción recurrente?',
      a: 'No hay ninguna suscripción recurrente. Es un pago único de $480 MXN por caso. No hay cargos sorpresa ni renovaciones automáticas.'
    },
    {
      q: '¿Qué pasa con mi expediente después del primer día?',
      a: 'Tu expediente permanece activo y seguro en la nube. Puedes regresar días, semanas o meses después para agregar pruebas, redactar escritos o consultar qué sigue sin volver a empezar.'
    },
    {
      q: '¿JUSTINO puede llevar mi caso ante una autoridad o juzgado?',
      a: 'No. Justino es un asistente de preparación, análisis y redacción documental. No se presenta en audiencias ni promueve juicios directamente ante tribunales.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white font-sans selection:bg-emerald-500/30 overflow-x-clip">
      
      {/* NAVEGACIÓN FULL-WIDTH */}
      <header className="border-b border-white/10 bg-[#080D1A]/90 backdrop-blur-md sticky top-0 z-40 w-full shadow-md shadow-black/20">
        <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Logo className="w-9 h-9" />
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-white leading-none">Justino</span>
              <span className="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase mt-0.5 hidden sm:inline-block">
                Tecnología Legal en México
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Orientación 24/7 para la comunidad
            </span>
            <button 
              onClick={onLogin} 
              className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-white px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-all"
            >
              Acceder a mi caso
            </button>
            <button 
              onClick={onStart}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20"
            >
              <span>Empezar ($480 MXN)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full">

        {/* 01 — HERO PANORÁMICO ESTILO BRAIN.FM */}
        <section className="relative w-full pt-12 md:pt-20 pb-16 md:pb-24 px-6 sm:px-10 lg:px-16 overflow-hidden">
          {/* Luces ambientales panorámicas */}
          <div className="absolute top-10 right-0 w-[650px] h-[650px] bg-emerald-500/10 rounded-full blur-[170px] pointer-events-none -z-10" />
          <div className="absolute top-20 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[180px] pointer-events-none -z-10" />

          <div className="w-full max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            
            {/* Columna Izquierda: Información de alto impacto */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Empresa de tecnología jurídica al servicio de México</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[68px] font-black leading-[1.08] mb-6 tracking-tight text-white">
                ¿Tienes un problema legal y no sabes qué hacer?
              </h1>

              <p className="text-xl sm:text-2xl lg:text-2xl font-medium text-emerald-400 mb-5 leading-snug max-w-3xl">
                Justino te ayuda a entender tu situación, estructurar tu expediente y saber con certeza cuál es tu siguiente paso.
              </p>

              <p className="text-slate-300 text-base sm:text-lg lg:text-xl mb-8 leading-relaxed max-w-3xl">
                Cuéntale qué ocurrió en tus propias palabras. Justino analiza los hechos bajo el marco legal de México, organiza tus pruebas y te orienta con claridad y total confidencialidad.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
                <button 
                  onClick={onStart}
                  className="group w-full sm:w-auto px-9 sm:px-12 py-4 sm:py-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-extrabold text-base sm:text-lg transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
                >
                  <span>Empezar mi caso ahora</span>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex items-center gap-2.5 text-slate-300 text-sm sm:text-base font-semibold tracking-wide bg-white/[0.04] border border-white/10 px-5 py-4 rounded-2xl">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>$480 MXN · Pago único · Sin mensualidad</span>
                </div>
              </div>

              {/* Indicadores rápidos de confianza */}
              <div className="mt-10 pt-8 border-t border-white/10 w-full grid grid-cols-3 gap-4 text-left">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white">100%</div>
                  <div className="text-xs text-slate-400 font-medium">Leyes mexicanas aplicables</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white">24/7</div>
                  <div className="text-xs text-slate-400 font-medium">Orientación inmediata</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white">Privado</div>
                  <div className="text-xs text-slate-400 font-medium">Cifrado de grado bancario</div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Ilustración panorámica en gran escala */}
            <div className="lg:col-span-5 relative flex items-center justify-center w-full">
              <div className="relative w-full">
                {/* Resplandor posterior del arte */}
                <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/25 via-teal-500/15 to-indigo-500/25 rounded-[36px] blur-2xl opacity-80 -z-10" />

                {/* Contenedor de la ilustración de alta escala */}
                <div className="relative rounded-[32px] overflow-hidden border border-white/15 bg-[#080D1A]/90 shadow-2xl backdrop-blur-md group">
                  <img 
                    src={LANDING_IMAGES.hero} 
                    alt="Justino - Asistente legal digital en México" 
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-cover max-h-[560px] transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                  
                  {/* Overlay degradado sutil */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080D1A]/80 via-[#080D1A]/20 to-transparent pointer-events-none" />

                  {/* Micro-tarjeta flotante expandida */}
                  <div className="absolute bottom-5 left-5 right-5 sm:left-7 sm:right-7 bg-[#0B1224]/95 border border-white/15 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xl">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <div className="text-left min-w-0">
                        <p className="text-sm font-bold text-white leading-tight truncate">Claridad y ruta definida</p>
                        <p className="text-xs text-slate-400 leading-tight truncate">Expediente clasificado y organizado en tiempo real</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider shrink-0">
                      Caso Activo
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* BARRA HORIZONTAL PANORÁMICA DE AUTORIDAD Y VALORES */}
        <section className="w-full border-y border-white/10 bg-[#080D1A]/70 py-8 px-6 sm:px-10 lg:px-16">
          <div className="w-full max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Derecho Mexicano</h4>
                <p className="text-xs text-slate-400">Leyes federales, estatales y reglamentos</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <FolderKanban className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Expediente Continuo</h4>
                <p className="text-xs text-slate-400">Sin volver a explicar tu historia de cero</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Privacidad Absoluta</h4>
                <p className="text-xs text-slate-400">Tus datos nunca se venden ni se ceden</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Tecnología Social</h4>
                <p className="text-xs text-slate-400">Diseñado para servir a la comunidad</p>
              </div>
            </div>
          </div>
        </section>

        {/* 02 — IDENTIFICACIÓN CON EL PROBLEMA (PANORÁMICA 50/50) */}
        <section className="relative w-full py-20 md:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/5 bg-[#080D1A]/40 overflow-hidden">
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />

          <div className="w-full max-w-[1440px] mx-auto">
            <div className="text-center max-w-4xl mx-auto mb-14">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-3">SITUACIÓN HABITUAL</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                Si tienes un problema legal, probablemente te has preguntado...
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center mb-10">
              {/* Lado izquierdo: Ilustración en gran formato */}
              <div className="lg:col-span-5 relative flex items-center justify-center">
                <div className="relative w-full">
                  <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-500/20 via-emerald-500/15 to-cyan-500/20 rounded-[34px] blur-xl opacity-75 -z-10" />

                  <div className="relative rounded-[30px] overflow-hidden border border-white/15 bg-[#080D1A]/90 shadow-2xl backdrop-blur-sm group">
                    <img 
                      src={LANDING_IMAGES.dudas} 
                      alt="Consultando dudas legales desde el celular" 
                      referrerPolicy="no-referrer"
                      className="w-full h-auto object-cover max-h-[540px] transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080D1A]/80 via-transparent to-transparent pointer-events-none" />

                    <div className="absolute bottom-5 left-5 right-5 bg-[#0B1224]/95 border border-white/15 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3.5 shadow-xl">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                        <HelpCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-sm font-bold text-white leading-tight truncate">Respuestas claras y sin rodeos</p>
                        <p className="text-xs text-slate-400 leading-tight truncate">Desde tu teléfono o computadora, a tu propio ritmo</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lado derecho: Cuadrícula panorámica de 2 columnas con dudas frecuentes */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { q: '¿Por dónde empiezo?', sub: 'Falta de orden inicial en el problema' },
                  { q: '¿Qué debería hacer primero?', sub: 'Riesgo de actuar en el orden incorrecto' },
                  { q: '¿Qué documentos necesito?', sub: 'Desconocimiento de pruebas necesarias' },
                  { q: '¿Estoy tomando una mala decisión?', sub: 'Temor a firmar o acordar algo desventajoso' },
                  { q: '¿Qué derechos tengo en México?', sub: 'Desinformación sobre la ley aplicable' },
                  { q: '¿Necesito contratar un abogado ya?', sub: 'Incertidumbre sobre costos y urgencia' },
                  { q: '¿Qué pasa si dejo pasar el tiempo?', sub: 'Prescripción de plazos legales' },
                  { q: '¿Cómo protejo mi patrimonio?', sub: 'Prevención antes de que escale el conflicto' }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-emerald-500/40 hover:bg-white/[0.06] transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <HelpCircle className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="font-bold text-white text-base leading-snug">{item.q}</span>
                    </div>
                    <p className="text-xs text-slate-400 pl-10">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Texto reflexivo ubicado debajo de las preguntas */}
            <div className="text-center max-w-3xl mx-auto mb-10">
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                La incertidumbre y los términos complicados no deberían impedirte defender tus derechos.
              </p>
            </div>

            {/* Banner horizontal de llamado a la acción */}
            <div className="w-full bg-gradient-to-r from-emerald-500/10 via-white/[0.04] to-indigo-500/10 border border-white/10 rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  No necesitas saber cómo se llama legalmente tu problema.
                </h3>
                <p className="text-emerald-400 text-lg sm:text-xl font-medium">
                  Solo cuéntale a Justino qué pasó en tu situación cotidiana.
                </p>
              </div>
              <button 
                onClick={onStart}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-emerald-500/30 active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer"
              >
                <span>Quiero contar mi caso</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* CASOS Y PRUEBA SOCIAL DEMOSTRATIVA (SITUACIONES REALES) */}
        <section className="w-full py-20 md:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/5 bg-[#080D1A]/30">
          <div className="w-full max-w-[1440px] mx-auto">
            <div className="text-center mb-16 max-w-4xl mx-auto">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-3">APLICACIÓN REAL</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                Situaciones reales preparadas con Justino.
              </h2>
              <p className="text-slate-300 text-base sm:text-lg">
                Ejemplos de cómo personas en México estructuran y resuelven sus dudas jurídicas cotidianas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="p-7 bg-white/[0.03] border border-white/10 rounded-3xl flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-2">Arrendamiento</span>
                  <h3 className="text-lg font-bold text-white mb-3">Retención indebida de depósito</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    El arrendador se negaba a devolver el depósito tras la entrega. Justino organizó el contrato, fotos de entrega y redactó la carta formal con término perentorio.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5 text-xs text-emerald-400 font-semibold">
                  ✓ Requerimiento formal entregado
                </div>
              </div>

              <div className="p-7 bg-white/[0.03] border border-white/10 rounded-3xl flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-2">Derecho Familiar</span>
                  <h3 className="text-lg font-bold text-white mb-3">Pensión alimenticia para menores</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    Dudas sobre montos de pensión y comprobantes admisibles. Justino organizó la relación de gastos mensuales y clasificó los comprobantes para el juzgado.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5 text-xs text-emerald-400 font-semibold">
                  ✓ Relación de gastos estructurada
                </div>
              </div>

              <div className="p-7 bg-white/[0.03] border border-white/10 rounded-3xl flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-2">Conflicto Laboral</span>
                  <h3 className="text-lg font-bold text-white mb-3">Despido injustificado sin finiquito</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    Propuesta patronal por debajo de ley. Justino calculó los conceptos de indemnización constitucional y preparó los puntos para la cita en el Centro de Conciliación.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5 text-xs text-emerald-400 font-semibold">
                  ✓ Conciliación laboral preparada
                </div>
              </div>

              <div className="p-7 bg-white/[0.03] border border-white/10 rounded-3xl flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-2">Deudas y Títulos</span>
                  <h3 className="text-lg font-bold text-white mb-3">Cobro de pagaré con intereses abusivos</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    Intereses moratorios desproporcionados. Justino analizó el documento conforme a la jurisprudencia de usura de la SCJN y preparó la propuesta de liquidación.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5 text-xs text-emerald-400 font-semibold">
                  ✓ Propuesta con tope legal formulada
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 03 — LA TRANSFORMACIÓN (ANTES VS DESPUÉS PANORÁMICO) */}
        <section className="w-full py-20 md:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/5">
          <div className="w-full max-w-[1440px] mx-auto">
            <div className="text-center mb-16 max-w-4xl mx-auto">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-3">LA DIFERENCIA</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                De la incertidumbre a tener una ruta legal clara.
              </h2>
              <p className="text-slate-300 text-base sm:text-lg">
                Compara la diferencia entre enfrentar un conflicto a ciegas y tener un expediente digital respaldado paso a paso.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-12">
              
              {/* ANTES */}
              <div className="p-8 sm:p-12 rounded-3xl bg-red-500/[0.03] border border-red-500/20 relative flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-red-400 block mb-3">ANTES DE JUSTINO</span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6">&ldquo;No sé qué hacer ni a quién acudir.&rdquo;</h3>
                  <ul className="space-y-4 text-slate-300 text-base">
                    <li className="flex items-start gap-3.5">
                      <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✕</span>
                      <span>Información dispersa en chats, capturas y papeles desordenados.</span>
                    </li>
                    <li className="flex items-start gap-3.5">
                      <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✕</span>
                      <span>Dudas sobre qué trámite realizar primero y miedo a perder plazos legales.</span>
                    </li>
                    <li className="flex items-start gap-3.5">
                      <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✕</span>
                      <span>Desconocimiento de los derechos reales que otorga la ley mexicana.</span>
                    </li>
                    <li className="flex items-start gap-3.5">
                      <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✕</span>
                      <span>Tener que repetir la misma historia una y otra vez con angustia.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* DESPUÉS */}
              <div className="p-8 sm:p-12 rounded-3xl bg-emerald-500/[0.04] border border-emerald-500/30 relative flex flex-col justify-between shadow-[0_0_50px_rgba(16,185,129,0.07)]">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-3">CON JUSTINO</span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6">&ldquo;Tengo mi expediente y sé cuál es mi siguiente paso.&rdquo;</h3>
                  <ul className="space-y-4 text-slate-200 text-base">
                    <li className="flex items-start gap-3.5">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Expediente digital centralizado con todas tus pruebas y fechas clave.</span>
                    </li>
                    <li className="flex items-start gap-3.5">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Ruta de acción clara: qué hacer hoy, mañana y ante qué instancia acudir.</span>
                    </li>
                    <li className="flex items-start gap-3.5">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Borradores y escritos fundamentados listos para revisar o presentar.</span>
                    </li>
                    <li className="flex items-start gap-3.5">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Continuidad garantizada: regresas y continúas sin empezar de cero.</span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>

            <div className="p-6 sm:p-8 bg-white/[0.02] border border-white/10 rounded-2xl text-center max-w-4xl mx-auto">
              <p className="text-slate-300 text-base sm:text-lg font-medium">
                <strong className="text-white">JUSTINO no decide por ti.</strong> Te proporciona la estructura, las herramientas y la comprensión que necesitas para tomar el control de tu situación con dignidad y seguridad.
              </p>
            </div>
          </div>
        </section>

        {/* 04 — DEMOSTRACIÓN PANORÁMICA DEL EXPEDIENTE (BENTO SHOWCASE) */}
        <section className="w-full py-20 md:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/5 bg-[#080D1A]/60">
          <div className="w-full max-w-[1440px] mx-auto">
            <div className="text-center mb-16 max-w-4xl mx-auto">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-3">TECNOLOGÍA EN ACCIÓN</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                Así transforma Justino una duda en un expediente accionable.
              </h2>
              <p className="text-slate-300 text-base sm:text-lg">
                La plataforma analiza tu situación en tiempo real y construye automáticamente la estructura completa de tu caso.
              </p>
            </div>

            {/* Layout Panorámico de 2 Columnas de Gran Escala */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Columna Izquierda (5 cols): El flujo de consulta interactivo */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-7 rounded-3xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                      TÚ
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Consulta en lenguaje común</span>
                  </div>
                  <blockquote className="text-lg font-medium text-white italic leading-relaxed">
                    &ldquo;Mi arrendador se niega a devolverme el depósito tras entregar el departamento impecable y ya pasaron 30 días. ¿Qué hago?&rdquo;
                  </blockquote>
                </div>

                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                    <ArrowDown className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-7 rounded-3xl bg-emerald-500/[0.06] border border-emerald-500/30 shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Logo className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">Justino</span>
                      <span className="text-xs text-slate-400">Análisis bajo el Código Civil aplicable</span>
                    </div>
                  </div>

                  <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-4">
                    En México, salvo pacto en contrario, el depósito en garantía debe reintegrarse al concluir el arrendamiento si no existen adeudos ni daños demostrables.
                  </p>
                  <div className="p-4 bg-black/30 rounded-xl border border-white/5 text-xs text-slate-300 space-y-1.5">
                    <p className="font-bold text-emerald-400">Diagnóstico preliminar:</p>
                    <p>• Retención indebida sujeta a requerimiento formal prejudicial.</p>
                    <p>• Generación de carta de requerimiento de pago con apercibimiento.</p>
                  </div>
                </div>
              </div>

              {/* Columna Derecha (7 cols): La estructura completa del Expediente Digital */}
              <div className="lg:col-span-7 p-8 sm:p-10 rounded-3xl bg-[#0B1224] border border-white/15 shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400 block">EXPEDIENTE CENTRAL JUSTINO</span>
                      <h4 className="text-xl font-bold text-white">Caso: Arrendamiento Inmobiliario</h4>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3.5 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full">
                    Activo · Sin mensualidad
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Situación</span>
                    <p className="text-sm font-semibold text-white">Negativa injustificada de entrega de depósito.</p>
                  </div>
                  
                  <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Documentos</span>
                    <p className="text-sm font-semibold text-white">Contrato, recibos de renta, acta de entrega.</p>
                  </div>

                  <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Fechas y Plazos</span>
                    <p className="text-sm font-semibold text-white">Término de 5 días hábiles otorgado para reintegro.</p>
                  </div>

                  <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Pendientes</span>
                    <p className="text-sm font-semibold text-white">Recabar acuse formal de entrega de carta.</p>
                  </div>

                  <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Opciones</span>
                    <p className="text-sm font-semibold text-white">Vía mediación de justicia cívica vs. juicio oral.</p>
                  </div>

                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">Siguiente paso</span>
                    <p className="text-sm font-semibold text-white">Descargar y enviar carta formal redactada.</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-slate-400 italic">
                    * Tu expediente permanece guardado para que agregues nuevos eventos o documentos en cualquier fecha.
                  </p>
                  <button 
                    onClick={onStart}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shrink-0 cursor-pointer"
                  >
                    Crear mi expediente
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 05 — EL DIFERENCIADOR: EXPEDIENTE CONTINUO (PANORÁMICO) */}
        <section className="w-full py-20 md:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/5">
          <div className="w-full max-w-[1440px] mx-auto">
            <div className="text-center max-w-4xl mx-auto mb-16">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-3">EL DIFERENCIADOR TECNOLÓGICO</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                Tu problema legal no es una pregunta. Es un caso.
              </h2>
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                Los problemas jurídicos se resuelven a lo largo del tiempo. Necesitas conservar lo que ocurrió, clasificar pruebas, saber qué contestar y qué hacer en cada fase.
              </p>
            </div>

            {/* Pipeline de 6 etapas de lado a lado */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-16 text-center">
              {[
                { paso: '01', titulo: 'Los Hechos', desc: 'Cuéntale qué pasó en tus palabras' },
                { paso: '02', titulo: 'Expediente', desc: 'Clasificación automática del caso' },
                { paso: '03', titulo: 'Pruebas y Docs', desc: 'Organización de contratos y recibos' },
                { paso: '04', titulo: 'Opciones', desc: 'Rutas legales viables en México' },
                { paso: '05', titulo: 'Siguiente Paso', desc: 'Acción inmediata fundamentada' },
                { paso: '06', titulo: 'Continuidad', desc: 'Retoma tu caso sin costo extra' }
              ].map((item, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col items-center justify-center">
                  <span className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black flex items-center justify-center mb-3">
                    {item.paso}
                  </span>
                  <span className="text-base font-bold text-white mb-1">{item.titulo}</span>
                  <span className="text-xs text-slate-400">{item.desc}</span>
                </div>
              ))}
            </div>

            {/* Bloque Split 50/50 Panorámico con la ilustración del expediente */}
            <div className="relative p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-white/[0.05] via-white/[0.02] to-emerald-500/[0.04] border border-white/15 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                
                <div className="lg:col-span-7 text-center lg:text-left">
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-2">MEMORIA DEL CASO</span>
                  <h3 className="text-3xl sm:text-4xl font-black text-white mb-5 tracking-tight">
                    No vuelvas a contar tu historia desde cero.
                  </h3>
                  <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8">
                    Justino conserva el contexto de tu caso para que puedas continuar en cualquier momento. Si semanas después recibes una notificación o tienes un nuevo documento, tu expediente está exactamente donde lo dejaste.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button 
                      onClick={onStart}
                      className="w-full sm:w-auto px-10 py-4.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-emerald-500/30 active:scale-95 cursor-pointer"
                    >
                      Empezar mi caso ahora
                    </button>
                    <span className="text-slate-400 text-sm font-semibold">
                      $480 MXN · Un solo pago · Sin renovaciones
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 relative flex items-center justify-center">
                  <div className="relative w-full">
                    <div className="absolute -inset-2 bg-gradient-to-tr from-emerald-500/20 via-cyan-500/15 to-indigo-500/20 rounded-[34px] blur-xl opacity-75 -z-10" />

                    <div className="relative rounded-[28px] overflow-hidden border border-white/15 bg-[#080D1A]/90 shadow-2xl group">
                      <img 
                        src={LANDING_IMAGES.continuidad} 
                        alt="Expediente organizado y continuidad del caso" 
                        referrerPolicy="no-referrer"
                        className="w-full h-auto object-cover max-h-[500px] transition-transform duration-700 group-hover:scale-[1.02]"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-[#080D1A]/80 via-transparent to-transparent pointer-events-none" />

                      <div className="absolute bottom-5 left-5 right-5 bg-[#0B1224]/95 border border-white/15 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xl">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          <div className="text-left min-w-0">
                            <p className="text-sm font-bold text-white leading-tight truncate">Expediente guardado en la nube</p>
                            <p className="text-xs text-slate-400 leading-tight truncate">Retoma en cualquier fecha con tu cuenta</p>
                          </div>
                        </div>
                        <div className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider shrink-0">
                          Al día
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* 06 — QUÉ HACE JUSTINO (BENTO GRID DE 3 COLUMNAS COMPLETO) */}
        <section className="w-full py-20 md:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/5 bg-[#080D1A]/40">
          <div className="w-full max-w-[1440px] mx-auto">
            <div className="text-center mb-16 max-w-4xl mx-auto">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-3">HERRAMIENTAS PARA TI</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                ¿Qué puede hacer Justino por ti?
              </h2>
              <p className="text-slate-300 text-base sm:text-lg">
                Herramientas concretas de tecnología jurídica diseñadas para ayudarte a actuar con certeza.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              
              <div className="p-8 bg-white/[0.03] border border-white/10 rounded-3xl flex flex-col justify-between hover:border-emerald-500/40 hover:bg-white/[0.05] transition-all group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-lg flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                    1
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Entender tu situación</h3>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    Cuéntale qué ocurrió en tus propias palabras y Justino te ayuda a identificar qué información es jurídicamente relevante para tu caso en México.
                  </p>
                </div>
              </div>

              <div className="p-8 bg-white/[0.03] border border-white/10 rounded-3xl flex flex-col justify-between hover:border-emerald-500/40 hover:bg-white/[0.05] transition-all group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-lg flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                    2
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Organizar tu expediente</h3>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    Mantén clasificada en un solo lugar la información, documentos, fechas clave, pruebas y elementos probatorios de tu situación.
                  </p>
                </div>
              </div>

              <div className="p-8 bg-white/[0.03] border border-white/10 rounded-3xl flex flex-col justify-between hover:border-emerald-500/40 hover:bg-white/[0.05] transition-all group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-lg flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                    3
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Lenguaje claro y accesible</h3>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    Te explica la ley en un lenguaje comprensible y directo, eliminando tecnicismos oscuros para que entiendas exactamente tus opciones.
                  </p>
                </div>
              </div>

              <div className="p-8 bg-white/[0.03] border border-white/10 rounded-3xl flex flex-col justify-between hover:border-emerald-500/40 hover:bg-white/[0.05] transition-all group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-lg flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                    4
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Redacción de documentos</h3>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    Cuando tu asunto lo requiera, redacta borradores de cartas de requerimiento, convenios, quejas o formatos fundamentados listos para usarse.
                  </p>
                </div>
              </div>

              <div className="p-8 bg-white/[0.03] border border-white/10 rounded-3xl flex flex-col justify-between hover:border-emerald-500/40 hover:bg-white/[0.05] transition-all group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-lg flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                    5
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Ruta de acción y plazos</h3>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    Te ayuda a identificar los plazos legales críticos y los pasos concretos que debes dar antes de que expire la posibilidad de reclamar.
                  </p>
                </div>
              </div>

              <div className="p-8 bg-white/[0.03] border border-white/10 rounded-3xl flex flex-col justify-between hover:border-emerald-500/40 hover:bg-white/[0.05] transition-all group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-lg flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                    6
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Continuidad permanente</h3>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    Tu caso no se borra. Puedes volver a consultar, subir pruebas o preparar nuevos escritos en cualquier momento sin pagar mensualidades.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 07 — HECHO PARA MÉXICO (PANORÁMICA 50/50) */}
        <section className="relative w-full py-20 md:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/5 overflow-hidden">
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[170px] pointer-events-none -z-10" />

          <div className="w-full max-w-[1440px] mx-auto">
            <div className="p-8 sm:p-14 rounded-3xl bg-white/[0.03] border border-white/10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                
                {/* Lado izquierdo: Ilustración del marco legal mexicano */}
                <div className="lg:col-span-5 relative flex items-center justify-center">
                  <div className="relative w-full">
                    <div className="absolute -inset-2 bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-indigo-500/20 rounded-[34px] blur-xl opacity-75 -z-10" />

                    <div className="relative rounded-[28px] overflow-hidden border border-white/15 bg-[#080D1A]/90 shadow-2xl group">
                      <img 
                        src={LANDING_IMAGES.mexico} 
                        alt="Diseñado para el marco legal de México" 
                        referrerPolicy="no-referrer"
                        className="w-full h-auto object-cover max-h-[520px] transition-transform duration-700 group-hover:scale-[1.02]"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-[#080D1A]/80 via-transparent to-transparent pointer-events-none" />

                      <div className="absolute bottom-5 left-5 right-5 bg-[#0B1224]/95 border border-white/15 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3.5 shadow-xl">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                          <Scale className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm font-bold text-white leading-tight truncate">Marco Jurídico de México</p>
                          <p className="text-xs text-slate-400 leading-tight truncate">Leyes federales y códigos locales aplicables</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lado derecho: Checklist institucional amplio */}
                <div className="lg:col-span-7">
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-2">SOBERANÍA Y JURISDICCIÓN</span>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight">
                    Diseñado específicamente para las leyes de México.
                  </h2>
                  <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8">
                    A diferencia de inteligencias artificiales genéricas que citan leyes de otros países, JUSTINO está configurado para operar con el marco legal mexicano vigente:
                  </p>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base text-slate-200 mb-8">
                    <li className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Legislación civil, laboral y mercantil.</span>
                    </li>
                    <li className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Diferenciación de fueros común y federal.</span>
                    </li>
                    <li className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Autoridades locales (Centros de Conciliación, Juzgados).</span>
                    </li>
                    <li className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Plazos de prescripción procesal en México.</span>
                    </li>
                  </ul>

                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-xs text-slate-400 leading-relaxed">
                    Sustentado en fuentes normativas de los Estados Unidos Mexicanos: Ley Federal del Trabajo, Código de Comercio, Códigos Civiles y Familiares Estatales, y Ley de Amparo.
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* 08 — CONFIANZA INSTITUCIONAL Y ÉTICA (PANORÁMICA) */}
        <section className="w-full py-20 px-6 sm:px-10 lg:px-16 border-b border-white/5 bg-[#080D1A]/50">
          <div className="w-full max-w-[1440px] mx-auto">
            <div className="p-8 sm:p-12 rounded-3xl bg-amber-500/[0.04] border border-amber-500/20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-amber-400">ALCANCE Y LÍMITES ÉTICOS</span>
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                    Una herramienta para prepararte e informarte, no para sustituir la representación legal obligatoria.
                  </h2>

                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    JUSTINO es un asistente legal digital. No es un despacho ni un abogado y no sustituye la representación legal formal ante tribunales. Su propósito es democratizar el acceso al entendimiento jurídico para que cualquier persona en México sepa qué está pasando, cómo organizar sus pruebas y cuándo es indispensable contratar representación profesional.
                  </p>
                </div>

                <div className="lg:col-span-4 p-6 bg-black/30 rounded-2xl border border-white/10 text-xs text-slate-300 space-y-3">
                  <p className="font-bold text-white uppercase tracking-wide">Compromiso ético:</p>
                  <p>✓ Información sin promesas falsas de resultados.</p>
                  <p>✓ Orientación honesta sobre cuándo contratar abogado.</p>
                  <p>✓ Transparencia total de costos y alcances.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 09 — SEGURIDAD Y PRIVACIDAD DE GRADO BANCARIO (PANORÁMICA 50/50) */}
        <section className="relative w-full py-20 md:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/5 overflow-hidden">
          <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[170px] pointer-events-none -z-10" />

          <div className="w-full max-w-[1440px] mx-auto">
            <div className="p-8 sm:p-14 rounded-3xl bg-white/[0.03] border border-white/10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                
                {/* Lado izquierdo: Textos y pilares de privacidad */}
                <div className="lg:col-span-7">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-400">SEGURIDAD Y PROTECCIÓN DE DATOS</span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight">
                    Tu caso y tus documentos bajo estricta confidencialidad.
                  </h2>

                  <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8">
                    Entendemos que los temas legales contienen datos sensibles, información personal y hechos privados. Por ello, la arquitectura de Justino se diseñó bajo estrictos estándares de seguridad:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-sm text-slate-300">
                    <div className="p-5 rounded-2xl bg-black/30 border border-white/5">
                      <strong className="block text-white mb-2 font-bold text-base">Expediente Privado</strong>
                      <span className="text-xs text-slate-400 leading-relaxed">Solo tú tienes la clave de acceso a tus consultas, notas y documentos generados.</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-black/30 border border-white/5">
                      <strong className="block text-white mb-2 font-bold text-base">Sin Venta de Datos</strong>
                      <span className="text-xs text-slate-400 leading-relaxed">Tus datos nunca se comercializan ni se ceden a terceros para fines comerciales o de publicidad.</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-black/30 border border-white/5">
                      <strong className="block text-white mb-2 font-bold text-base">Ley Federal de Datos</strong>
                      <span className="text-xs text-slate-400 leading-relaxed">Apego estricto a la legislación mexicana para la protección de datos personales en posesión de particulares.</span>
                    </div>
                  </div>
                </div>

                {/* Lado derecho: Ilustración de la bóveda de seguridad */}
                <div className="lg:col-span-5 relative flex items-center justify-center">
                  <div className="relative w-full">
                    <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-500/20 via-emerald-500/15 to-cyan-500/20 rounded-[34px] blur-xl opacity-75 -z-10" />

                    <div className="relative rounded-[28px] overflow-hidden border border-white/15 bg-[#080D1A]/90 shadow-2xl group">
                      <img 
                        src={LANDING_IMAGES.privacidad} 
                        alt="Privacidad y protección de tu caso" 
                        referrerPolicy="no-referrer"
                        className="w-full h-auto object-cover max-h-[500px] transition-transform duration-700 group-hover:scale-[1.02]"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-[#080D1A]/80 via-transparent to-transparent pointer-events-none" />

                      <div className="absolute bottom-5 left-5 right-5 bg-[#0B1224]/95 border border-white/15 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3.5 shadow-xl">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                          <Lock className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm font-bold text-white leading-tight truncate">Cifrado de extremo a extremo</p>
                          <p className="text-xs text-slate-400 leading-tight truncate">Tus archivos y chats resguardados en Supabase Vault</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* 10 — PRECIO PANORÁMICO DE 2 COLUMNAS ($480 MXN) */}
        <section className="w-full py-20 md:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/5">
          <div className="w-full max-w-[1440px] mx-auto">
            <div className="p-8 sm:p-14 lg:p-16 rounded-3xl bg-gradient-to-r from-emerald-500/[0.06] via-white/[0.02] to-emerald-500/[0.03] border border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.08)]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                
                {/* Lado izquierdo (7 cols): Desglose completo del valor */}
                <div className="lg:col-span-7">
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-3">TARIFA TRANSPARENTE</span>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 tracking-tight">
                    Un caso. Un solo pago. Sin mensualidades.
                  </h2>
                  <p className="text-slate-300 text-base sm:text-lg mb-8 leading-relaxed">
                    Creemos en hacer la justicia y la orientación legal accesible para toda la comunidad mexicana. Sin cargos ocultos ni sorpresas en tu tarjeta.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      'Apertura de expediente digital único',
                      'Análisis legal bajo leyes mexicanas',
                      'Organización cronológica de pruebas',
                      'Redacción de borradores y documentos',
                      'Ruta de acción paso a paso',
                      'Continuidad de por vida en tu caso'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-slate-200 text-sm sm:text-base font-medium">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-bold text-white">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Garantía de activación instantánea
                    </span>
                    <span>Pago seguro vía Stripe</span>
                    <span>Acepta tarjetas, OXXO y SPEI</span>
                  </div>
                </div>

                {/* Lado derecho (5 cols): Tarjeta de precio y botón de activación */}
                <div className="lg:col-span-5 p-8 sm:p-10 rounded-3xl bg-[#080D1A] border border-white/15 text-center flex flex-col items-center justify-center shadow-2xl">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Acceso completo al caso</span>
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-5xl sm:text-6xl lg:text-7xl font-black text-white">$480</span>
                    <span className="text-xl sm:text-2xl font-bold text-emerald-400">MXN</span>
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm font-semibold mb-6">
                    Pago único · Sin suscripciones recurrentes
                  </p>

                  <button 
                    onClick={onStart}
                    className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <span>Empezar mi caso</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <p className="mt-4 text-xs text-slate-400">
                    Puedes continuar trabajando en tu expediente hasta que decidas cerrarlo.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* 12 — PREGUNTAS FRECUENTES (FAQ EN 2 COLUMNAS PANORÁMICAS) */}
        <section className="w-full py-20 md:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/5 bg-[#080D1A]/50">
          <div className="w-full max-w-[1440px] mx-auto">
            <div className="text-center mb-16 max-w-4xl mx-auto">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-3">RESOLVIENDO TUS DUDAS</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                Preguntas frecuentes
              </h2>
              <p className="text-slate-300 text-base sm:text-lg">
                Respuestas claras y transparentes para que tomes la mejor decisión con total tranquilidad.
              </p>
            </div>

            {/* Cuadrícula de 2 columnas de preguntas paralelas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
              {faqItems.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div 
                    key={index} 
                    className="border border-white/10 rounded-2xl bg-white/[0.02] hover:border-white/20 overflow-hidden transition-all flex flex-col justify-start"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full p-6 text-left flex justify-between items-center gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <span className="text-base sm:text-lg font-bold text-white leading-snug">
                        {item.q}
                      </span>
                      <div className="p-1.5 rounded-lg bg-white/5 text-slate-400 shrink-0">
                        {isOpen ? <ChevronUp className="w-5 h-5 text-emerald-400" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 text-slate-300 text-sm sm:text-base leading-relaxed border-t border-white/5 pt-4">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 13 — CTA FINAL PANORÁMICO */}
        <section className="relative w-full py-24 md:py-32 px-6 sm:px-10 lg:px-16 text-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-500/10 rounded-full blur-[180px] pointer-events-none -z-10" />

          <div className="w-full max-w-[1440px] mx-auto flex flex-col items-center">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-3">ACCESO INMEDIATO</span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight max-w-4xl">
              No necesitas tener todo claro para empezar hoy.
            </h2>
            <p className="text-emerald-400 text-xl sm:text-2xl font-bold mb-10 max-w-2xl">
              Solo cuéntale a Justino qué pasó y daremos el primer paso juntos.
            </p>

            <div className="flex flex-col items-center justify-center gap-4">
              <button 
                onClick={onStart}
                className="group px-12 sm:px-16 py-5 sm:py-6 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-lg sm:text-xl transition-all shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>Empezar mi caso ahora</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-slate-400 text-sm sm:text-base font-semibold">
                $480 MXN · Un solo pago · Sin mensualidad
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER CORPORATIVO PANORÁMICO */}
      <footer className="w-full py-16 border-t border-white/10 bg-[#080D1A]">
        <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <Logo className="w-8 h-8" />
              <span className="text-base font-black tracking-tight text-white">Justino.app</span>
            </div>
            <span className="text-xs text-slate-400">
              Desarrollado en México por <strong className="text-slate-300">NeuronConnect S.A.S.</strong> · Tecnología al servicio de la comunidad
            </span>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 text-xs font-bold uppercase tracking-wider text-slate-400">
            <a href="/blog" className="hover:text-emerald-400 transition-colors">
              Blog
            </a>
            <button onClick={() => setShowPrivacy(true)} className="hover:text-emerald-400 transition-colors cursor-pointer">
              Aviso de privacidad
            </button>
            <button onClick={() => setShowTerms(true)} className="hover:text-emerald-400 transition-colors cursor-pointer">
              Términos y condiciones
            </button>
            <button onClick={() => setShowContact(true)} className="hover:text-emerald-400 transition-colors cursor-pointer">
              Contacto
            </button>
            
            {/* Acceso Hermes discreto */}
            <button 
              onClick={onAdminAccess} 
              title="Terminal Hermes" 
              aria-label="Acceso Hermes"
              className="text-slate-700 hover:text-emerald-400 p-1.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
            >
              <Key className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL AVISO DE PRIVACIDAD */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-3xl bg-[#0B1224] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-8 py-6 border-b border-white/5 shrink-0">
              <h2 className="text-xl font-bold uppercase tracking-wide text-white">Aviso de Privacidad</h2>
              <button 
                onClick={() => setShowPrivacy(false)} 
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto text-slate-300 space-y-6 text-sm leading-relaxed">
              <p className="text-emerald-400 font-bold uppercase tracking-wider text-xs font-black">AVISO DE PRIVACIDAD DE JUSTINO Versión 1.0</p>
              
              <div>
                <h3 className="text-white font-bold text-base mb-2">1. RESPONSABLE DEL TRATAMIENTO</h3>
                <p>
                  Justino es responsable del tratamiento de los datos personales recabados a través de su plataforma y se compromete a protegerlos conforme a la legislación mexicana aplicable.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">2. DATOS QUE RECABAMOS</h3>
                <p className="mb-2">Dependiendo del uso de la plataforma, podremos solicitar:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Nombre o cómo prefieres que te llamemos.</li>
                  <li>Correo electrónico.</li>
                  <li>Datos de acceso a la cuenta.</li>
                  <li>Información contenida en consultas sobre tu caso.</li>
                  <li>Documentos cargados por el usuario.</li>
                  <li>Evidencias y archivos de soporte.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">3. FINALIDAD DEL TRATAMIENTO</h3>
                <p className="mb-2">Los datos se utilizan exclusivamente para:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Crear y administrar tu expediente legal digital.</li>
                  <li>Orientar sobre tu caso y generar documentos pertinentes.</li>
                  <li>Dar soporte técnico y mantener la continuidad de tu caso.</li>
                </ul>
                <p className="mt-3 font-semibold text-emerald-400">
                  No vendemos ni comercializamos los datos personales de nuestros usuarios.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">4. SEGURIDAD Y DERECHOS ARCO</h3>
                <p>
                  El usuario podrá en todo momento ejercer sus derechos de Acceso, Rectificación, Cancelación u Oposición conforme a la legislación aplicable comunicándose a través de los canales oficiales de Justino.
                </p>
              </div>
            </div>
            <div className="px-8 py-4 border-t border-white/5 bg-[#080D1A] shrink-0 text-right">
              <button 
                onClick={() => setShowPrivacy(false)}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all text-sm cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TÉRMINOS Y CONDICIONES */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-3xl bg-[#0B1224] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-8 py-6 border-b border-white/5 shrink-0">
              <h2 className="text-xl font-bold uppercase tracking-wide text-white">Términos y Condiciones</h2>
              <button 
                onClick={() => setShowTerms(false)} 
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto text-slate-300 space-y-6 text-sm leading-relaxed">
              <p className="text-emerald-400 font-bold uppercase tracking-wider text-xs font-black">TÉRMINOS Y CONDICIONES DE USO DE JUSTINO Versión 2.0</p>
              
              <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-2xl">
                <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wider mb-2">Aviso Importante</h3>
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                  Justino es una plataforma tecnológica de orientación jurídica basada en inteligencia artificial. No es un despacho jurídico, no presta servicios de representación legal, no sustituye la asesoría profesional de un abogado ni garantiza resultados en procedimientos administrativos o judiciales. Toda la información y los documentos generados tienen fines informativos y de apoyo para el usuario.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">1. OBJETO Y ALCANCE</h3>
                <p>
                  Justino ayuda a comprender temas jurídicos, organizar expedientes, identificar documentación relevante y generar borradores de documentos con base en la información proporcionada por el usuario y en la legislación mexicana.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">2. LÍMITES DEL SERVICIO</h3>
                <p>
                  Justino no ejerce la profesión de abogado, no representa usuarios ante autoridades ni juzgados, no interpone demandas y no garantiza el éxito de ningún trámite. La revisión y formalización final corresponde al usuario.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">3. TARIFA Y CONTINUIDAD</h3>
                <p>
                  El acceso a tu caso se realiza mediante un pago único de $480 MXN, sin suscripciones mensuales recurrentes, permitiendo continuar trabajando en tu expediente hasta que decidas cerrarlo.
                </p>
              </div>
            </div>
            <div className="px-8 py-4 border-t border-white/5 bg-[#080D1A] shrink-0 text-right">
              <button 
                onClick={() => setShowTerms(false)}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all text-sm cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONTACTO */}
      {showContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0B1224] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-8 py-6 border-b border-white/5 shrink-0">
              <h2 className="text-xl font-bold uppercase tracking-wide text-white">Contacto</h2>
              <button 
                onClick={() => setShowContact(false)} 
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 text-slate-300 space-y-6 text-base leading-relaxed">
              <p className="font-semibold text-white">
                JUSTINO es una plataforma desarrollada en México por NeuronConnect S.A.S.
              </p>
              <p>
                Si tienes alguna consulta o requieres asistencia técnica, visítanos en <a href="https://www.neuronconnect.mx" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline font-bold">www.neuronconnect.mx</a> o contáctanos a través de nuestros canales oficiales.
              </p>
            </div>
            <div className="px-8 py-4 border-t border-white/5 bg-[#080D1A] shrink-0 text-right">
              <button 
                onClick={() => setShowContact(false)}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all text-sm cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
