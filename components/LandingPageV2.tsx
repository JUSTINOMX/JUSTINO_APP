import React, { useState } from 'react';
import { 
  ArrowRight, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Key, 
  Scale, 
  Layers, 
  FolderKanban, 
  HelpCircle,
  Clock,
  Sparkles,
  ArrowDown
} from 'lucide-react';
import { Logo } from './Logo';

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
      a: 'No. JUSTINO es un asistente legal digital diseñado para ayudarte a comprender, organizar y avanzar en tu situación.'
    },
    {
      q: '¿JUSTINO sustituye a un abogado?',
      a: 'No necesariamente. Algunos asuntos requieren representación o intervención profesional. JUSTINO puede ayudarte a entender mejor tu situación y reconocer cuándo puede ser conveniente buscar ayuda profesional.'
    },
    {
      q: '¿Tengo que saber qué ley aplica?',
      a: 'No. Puedes comenzar simplemente explicando qué ocurrió.'
    },
    {
      q: '¿Necesito tener todos mis documentos?',
      a: 'No. Puedes comenzar con la información que tengas y posteriormente organizar lo que falta.'
    },
    {
      q: '¿Puedo usar JUSTINO si mi problema ya comenzó?',
      a: 'Sí. Puedes contarle qué ha ocurrido hasta ahora y trabajar sobre esa situación.'
    },
    {
      q: '¿Tengo que pagar cada mes?',
      a: 'No. El precio actual es de $480 MXN por caso, con un solo pago.'
    },
    {
      q: '¿Qué pasa con mi caso después?',
      a: 'Puedes continuar trabajando sobre el mismo caso hasta que decidas cerrarlo.'
    },
    {
      q: '¿JUSTINO puede llevar mi caso ante una autoridad?',
      a: 'No. JUSTINO puede ayudarte a preparar y organizar información y documentos, pero no sustituye la representación profesional ante una autoridad.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      
      {/* NAVEGACIÓN */}
      <header className="border-b border-white/5 bg-[#080D1A]/80 backdrop-blur-md sticky top-0 z-30">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center" aria-label="Navegación principal">
          <div className="flex items-center gap-3">
            <Logo className="w-9 h-9" />
            <span className="text-2xl font-bold tracking-tight text-white">Justino</span>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={onLogin} 
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              {hasExistingSession ? 'Acceder a mi caso' : 'Acceder a mi caso'}
            </button>
            <button 
              onClick={onStart}
              className="px-4 sm:px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-emerald-500/20 active:scale-95"
            >
              Empezar mi caso
            </button>
          </div>
        </nav>
      </header>

      <main className="relative z-10">

        {/* 01 — HERO */}
        <section className="pt-16 md:pt-24 pb-20 md:pb-28 px-6 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs sm:text-sm font-semibold mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Asistente legal digital en México</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.12] mb-6 tracking-tight text-white">
            ¿Tienes un problema legal y no sabes qué hacer?
          </h1>

          <p className="text-xl sm:text-2xl md:text-3xl font-medium text-emerald-400 max-w-4xl mx-auto mb-6 leading-snug">
            Justino te ayuda a entender tu situación, organizar tu caso y saber cuál puede ser tu siguiente paso.
          </p>

          <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Cuéntale qué pasó. Justino analiza la información de tu situación, te ayuda a organizar tu caso y te guía paso a paso.
          </p>

          <div className="flex flex-col items-center justify-center gap-3">
            <button 
              onClick={onStart}
              className="group w-full sm:w-auto px-10 sm:px-14 py-5 sm:py-6 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-lg sm:text-xl transition-all shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-3"
            >
              <span>Empezar mi caso</span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-slate-400 text-sm sm:text-base font-semibold tracking-wide">
              $480 MXN · Un solo pago · Sin mensualidad
            </p>
          </div>
        </section>

        {/* 02 — IDENTIFICACIÓN CON EL PROBLEMA */}
        <section className="py-20 px-6 border-t border-white/5 bg-[#080D1A]/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12 text-white">
              Si tienes un problema legal, probablemente te has preguntado...
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-12">
              {[
                '¿Por dónde empiezo?',
                '¿Qué debería hacer primero?',
                '¿Qué documentos necesito?',
                '¿Estoy tomando una mala decisión?',
                '¿Qué derechos tengo?',
                '¿Necesito contratar un abogado?',
                '¿Qué pasa si dejo pasar el tiempo?'
              ].map((pregunta, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3.5 p-4 sm:p-5 bg-white/[0.04] border border-white/10 rounded-2xl text-slate-200 text-base sm:text-lg font-medium hover:border-emerald-500/30 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span>{pregunta}</span>
                </div>
              ))}
            </div>

            <div className="text-center bg-white/[0.03] border border-white/10 rounded-3xl p-8 sm:p-10">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                No necesitas saber cómo se llama legalmente tu problema.
              </h3>
              <p className="text-emerald-400 text-lg sm:text-xl font-medium mb-8">
                Solo cuéntale a Justino qué pasó.
              </p>
              <button 
                onClick={onStart}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold text-base transition-all border border-white/15 hover:border-emerald-500/40"
              >
                <span>Quiero contar mi caso</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>
        </section>

        {/* 03 — LA TRANSFORMACIÓN */}
        <section className="py-20 md:py-28 px-6 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              De no saber qué hacer a tener una ruta clara.
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
              Compara la diferencia entre enfrentar una situación con incertidumbre y tener un caso organizado con pasos definidos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12">
            
            {/* ANTES */}
            <div className="p-8 sm:p-10 rounded-3xl bg-red-500/[0.03] border border-red-500/20 relative flex flex-col justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-red-400 block mb-2">ANTES</span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6">&ldquo;No sé qué hacer.&rdquo;</h3>
                <ul className="space-y-4 text-slate-300 text-base">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✕</span>
                    <span>Información dispersa y desordenada.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✕</span>
                    <span>Dudas sobre qué hacer primero.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✕</span>
                    <span>Documentos desorganizados o extraviados.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✕</span>
                    <span>Miedo de equivocarse o tomar una mala decisión.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✕</span>
                    <span>Tener que explicar la situación una y otra vez.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* DESPUÉS */}
            <div className="p-8 sm:p-10 rounded-3xl bg-emerald-500/[0.04] border border-emerald-500/30 relative flex flex-col justify-between shadow-[0_0_40px_rgba(16,185,129,0.06)]">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-2">DESPUÉS</span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6">&ldquo;Ya sé cuál es mi siguiente paso.&rdquo;</h3>
                <ul className="space-y-4 text-slate-200 text-base">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Entiendes mejor tu situación legal.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Tu información está organizada en un solo lugar.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Identificas qué documentos necesitas reunir.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Conoces las opciones que puedes considerar.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Puedes continuar tu caso sin empezar desde cero.</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>

          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl text-center max-w-3xl mx-auto">
            <p className="text-slate-300 text-base sm:text-lg font-medium">
              <strong className="text-white">JUSTINO no decide por ti.</strong> Te ayuda a entender mejor tu situación para que puedas decidir qué hacer.
            </p>
          </div>
        </section>

        {/* 04 — DEMOSTRACIÓN DEL PRODUCTO */}
        <section className="py-20 px-6 border-t border-white/5 bg-[#080D1A]/60">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Mira cómo puede ayudarte Justino.
              </h2>
              <p className="text-slate-400 text-base sm:text-lg">
                Así se transforma una situación confusa en un expediente organizado y accionable:
              </p>
            </div>

            {/* Representación visual de un caso */}
            <div className="space-y-6">
              
              {/* Usuario */}
              <div className="p-6 sm:p-7 rounded-3xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                    TÚ
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Mensaje inicial</span>
                </div>
                <blockquote className="text-lg sm:text-xl font-medium text-white italic">
                  &ldquo;Mi jefe me dijo que ya no me presente mañana y no quiere darme nada. ¿Qué hago?&rdquo;
                </blockquote>
              </div>

              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                  <ArrowDown className="w-4 h-4" />
                </div>
              </div>

              {/* Justino respuesta resumida */}
              <div className="p-6 sm:p-7 rounded-3xl bg-emerald-500/[0.06] border border-emerald-500/30 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Logo className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">Justino</span>
                    <span className="text-xs text-slate-400">Análisis y organización en tiempo real</span>
                  </div>
                </div>

                <div className="space-y-3 text-slate-200 text-sm sm:text-base leading-relaxed">
                  <p>
                    Lamento la situación. En México, cuando un patrón pide no presentarse sin causa legal comprobada, puede configurarse un <strong>despido injustificado</strong> bajo la Ley Federal del Trabajo.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                      <p className="text-xs font-bold text-emerald-400 uppercase mb-1">1. Información relevante</p>
                      <p className="text-xs text-slate-300">Identifica relación laboral vigente y negativa patronal de pago.</p>
                    </div>
                    <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                      <p className="text-xs font-bold text-emerald-400 uppercase mb-1">2. Preguntas clave</p>
                      <p className="text-xs text-slate-300">Antigüedad exacta, sueldo diario y si te entregaron aviso por escrito.</p>
                    </div>
                    <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                      <p className="text-xs font-bold text-emerald-400 uppercase mb-1">3. Documentos a reunir</p>
                      <p className="text-xs text-slate-300">Recibos de nómina (CFDI), mensajes de WhatsApp y contrato si existe.</p>
                    </div>
                    <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                      <p className="text-xs font-bold text-emerald-400 uppercase mb-1">4. Siguientes pasos</p>
                      <p className="text-xs text-slate-300">Ruta ante el Centro de Conciliación Laboral de tu entidad federativa.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                  <ArrowDown className="w-4 h-4" />
                </div>
              </div>

              {/* Interfaz conceptual TU CASO */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#0C1428] border border-white/15 shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400 block">ESTRUCTURA DE TU CASO</span>
                      <h4 className="text-lg font-bold text-white">Expediente: Conflicto Laboral</h4>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full">
                    Activo · En seguimiento
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Situación</span>
                    <p className="text-sm font-semibold text-white">Rescisión de relación laboral sin liquidación.</p>
                  </div>
                  
                  <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Documentos</span>
                    <p className="text-sm font-semibold text-white">CFDIs de nómina, estados de cuenta bancarios.</p>
                  </div>

                  <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Fechas</span>
                    <p className="text-sm font-semibold text-white">Plazo legal de 60 días naturales para conciliar.</p>
                  </div>

                  <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Información pendiente</span>
                    <p className="text-sm font-semibold text-white">Monto del último salario diario integrado.</p>
                  </div>

                  <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Opciones</span>
                    <p className="text-sm font-semibold text-white">Conciliación prejudicial vs. negociación privada.</p>
                  </div>

                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">Siguiente paso</span>
                    <p className="text-sm font-semibold text-white">Generar solicitud ante el Centro de Conciliación.</p>
                  </div>
                </div>

                <p className="mt-6 text-xs text-slate-400 text-center italic">
                  * Ejemplo demostrativo. Justino no afirma resultados legales garantizados ni sustituye la representación por un abogado.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* 05 — EL DIFERENCIADOR */}
        <section className="py-20 md:py-28 px-6 max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-3">EL DIFERENCIADOR</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Tu problema legal no es una pregunta. Es un caso.
            </h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              Cuando tienes un problema legal, una respuesta aislada normalmente no es suficiente. Necesitas conservar lo que ocurrió, organizar la información, reunir documentos, entender tus opciones y saber qué hacer después.
            </p>
            <p className="text-emerald-400 font-semibold text-base sm:text-lg mt-3">
              Por eso Justino trabaja sobre tu caso, no solamente sobre una conversación.
            </p>
          </div>

          {/* Flujo visual */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-16 text-center">
            {[
              { paso: '1', titulo: 'Lo que pasó', desc: 'Tus hechos' },
              { paso: '2', titulo: 'Tu caso', desc: 'Expediente ordenado' },
              { paso: '3', titulo: 'Información y docs', desc: 'Pruebas reunidas' },
              { paso: '4', titulo: 'Opciones', desc: 'Rutas disponibles' },
              { paso: '5', titulo: 'Siguiente paso', desc: 'Acción clara' },
              { paso: '6', titulo: 'Continuidad', desc: 'Sin reiniciar' }
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center mb-2">
                  {item.paso}
                </span>
                <span className="text-sm font-bold text-white mb-0.5">{item.titulo}</span>
                <span className="text-xs text-slate-400">{item.desc}</span>
              </div>
            ))}
          </div>

          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/15 text-center max-w-3xl mx-auto">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4">
              No vuelvas a contar tu historia desde cero.
            </h3>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-6">
              Justino conserva el contexto necesario de tu caso para poder continuar posteriormente. Cuando regreses a agregar un nuevo documento, informar sobre una fecha o consultar el siguiente paso, tu expediente sigue exactamente donde lo dejaste.
            </p>
            <button 
              onClick={onStart}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-base transition-all shadow-md active:scale-95"
            >
              Empezar mi caso ahora
            </button>
          </div>
        </section>

        {/* 06 — QUÉ HACE JUSTINO */}
        <section className="py-20 px-6 border-t border-white/5 bg-[#080D1A]/50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                ¿Qué puede hacer Justino por ti?
              </h2>
              <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
                Tarjetas simples con las herramientas concretas que tendrás para avanzar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="p-6 sm:p-8 bg-white/[0.03] border border-white/10 rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center mb-4">
                    1
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Entender tu situación</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Cuéntale qué ocurrió y te ayuda a identificar qué información es relevante para tu caso.
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 bg-white/[0.03] border border-white/10 rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center mb-4">
                    2
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Organizar tu caso</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Mantén reunida la información, documentos, fechas y elementos importantes de tu situación.
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 bg-white/[0.03] border border-white/10 rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center mb-4">
                    3
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Explicarte lo que necesitas entender</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Información jurídica explicada en lenguaje claro, evitando tecnicismos innecesariamente complicados.
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 bg-white/[0.03] border border-white/10 rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center mb-4">
                    4
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Ayudarte con tus documentos</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Cuando corresponda, puede ayudarte a preparar borradores y escritos relacionados con tu caso.
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 bg-white/[0.03] border border-white/10 rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center mb-4">
                    5
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Orientarte sobre qué sigue</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Te ayuda a identificar opciones y próximos pasos que puedes considerar en tu camino.
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 bg-white/[0.03] border border-white/10 rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center mb-4">
                    6
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Continuar cuando lo necesites</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Puedes volver a tu caso posteriormente sin tener que empezar toda la explicación desde cero.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 07 — HECHO PARA MÉXICO */}
        <section className="py-20 md:py-28 px-6 max-w-4xl mx-auto">
          <div className="p-8 sm:p-12 rounded-3xl bg-white/[0.03] border border-white/10 text-left">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-2">CONTEXTO LOCAL</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Diseñado para problemas legales en México.
            </h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-6">
              JUSTINO está diseñado para trabajar con el contexto jurídico mexicano. La orientación considera, cuando corresponde:
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm sm:text-base text-slate-200 mb-8">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Legislación mexicana aplicable.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Jurisdicción y fuero correspondiente.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tipo de asunto particular.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Autoridad competente involucrada.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Documentos relevantes del trámite.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Situación particular del usuario.</span>
              </li>
            </ul>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-400 leading-relaxed">
              Basado en normativas y procedimientos vigentes publicados en fuentes oficiales de los Estados Unidos Mexicanos (Códigos Civiles, Ley Federal del Trabajo, Ley de Amparo, Código de Comercio y leyes familiares).
            </div>
          </div>
        </section>

        {/* 08 — CONFIANZA Y LÍMITES */}
        <section className="py-20 px-6 border-t border-white/5 bg-[#080D1A]/50">
          <div className="max-w-4xl mx-auto">
            <div className="p-8 sm:p-10 rounded-3xl bg-amber-500/[0.04] border border-amber-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-amber-400">ALCANCE Y LÍMITES CLAROS</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                Una herramienta para ayudarte a avanzar, no para decidir por ti.
              </h2>

              <div className="space-y-4 text-slate-300 text-base leading-relaxed">
                <p>
                  JUSTINO es un asistente legal digital. No es un abogado y no sustituye la representación legal cuando tu situación requiere que un profesional lleve tu asunto.
                </p>
                <p>
                  Su función es ayudarte a comprender mejor lo que ocurre, organizar tu información y prepararte para tomar decisiones más informadas.
                </p>
                <p>
                  Si tu situación requiere atención profesional, JUSTINO te ayudará a reconocer cuándo puede ser conveniente buscarla.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 09 — SEGURIDAD Y PRIVACIDAD */}
        <section className="py-20 px-6 max-w-4xl mx-auto">
          <div className="p-8 sm:p-10 rounded-3xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400">PRIVACIDAD</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Tu caso merece privacidad.
            </h2>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-6">
              La información que compartes puede incluir conversaciones, documentos y datos relacionados con tu situación.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-300">
              <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                <strong className="block text-white mb-1">Expediente privado</strong>
                <span className="text-xs text-slate-400">Solo tú tienes acceso a tus conversaciones, notas y documentos generados.</span>
              </div>
              <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                <strong className="block text-white mb-1">Sin venta de datos</strong>
                <span className="text-xs text-slate-400">Tus datos nunca se venden ni se ceden a terceros para fines publicitarios.</span>
              </div>
              <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                <strong className="block text-white mb-1">Cumplimiento legal</strong>
                <span className="text-xs text-slate-400">Tratamiento ético bajo la Ley Federal de Protección de Datos Personales.</span>
              </div>
            </div>
          </div>
        </section>

        {/* 10 — PRUEBA SOCIAL (EJEMPLOS DEMOSTRATIVOS) */}
        <section className="py-20 px-6 border-t border-white/5 bg-[#080D1A]/50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Personas que están usando Justino.
              </h2>
              <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
                Ejemplos de casos y situaciones cotidianas estructuradas y preparadas con Justino:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="p-6 sm:p-7 bg-white/[0.03] border border-white/10 rounded-2xl">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-2">Ejemplo demostrativo · Arrendamiento</span>
                <h3 className="text-lg font-bold text-white mb-2">Retención injustificada de depósito</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  El arrendador se negaba a devolver el depósito tras entregar el inmueble en buen estado. Justino ayudó a organizar el contrato, fotos de entrega y a redactar una carta formal de requerimiento con plazo legal específico.
                </p>
                <span className="text-xs text-slate-400 italic">Resultado: Caso preparado con ruta de conciliación clara.</span>
              </div>

              <div className="p-6 sm:p-7 bg-white/[0.03] border border-white/10 rounded-2xl">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-2">Ejemplo demostrativo · Familiar</span>
                <h3 className="text-lg font-bold text-white mb-2">Pensión alimenticia y necesidades de menores</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  Incertidumbre sobre qué porcentaje o monto corresponde y qué comprobantes presentar. Justino organizó la tabla de gastos mensuales y preparó la relación de hechos para la solicitud inicial ante el juzgado familiar.
                </p>
                <span className="text-xs text-slate-400 italic">Resultado: Documentos y pruebas clasificados cronológicamente.</span>
              </div>

              <div className="p-6 sm:p-7 bg-white/[0.03] border border-white/10 rounded-2xl">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-2">Ejemplo demostrativo · Laboral</span>
                <h3 className="text-lg font-bold text-white mb-2">Negativa de liquidación por despido</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  Propuesta patronal por debajo del monto legal sin desglose. Justino identificó los rubros correspondientes a indemnización y prestaciones devengadas para acudir preparado a la cita del Centro de Conciliación Laboral.
                </p>
                <span className="text-xs text-slate-400 italic">Resultado: Cuadro comparativo de liquidación y siguientes pasos.</span>
              </div>

              <div className="p-6 sm:p-7 bg-white/[0.03] border border-white/10 rounded-2xl">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-2">Ejemplo demostrativo · Deudas y Contratos</span>
                <h3 className="text-lg font-bold text-white mb-2">Cobro indebido y renegociación de pagaré</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  Reclamo de intereses moratorios desproporcionados sin sustento documental. Justino analizó el título de crédito, separó el capital exigible y preparó una propuesta formal de liquidación y finiquito.
                </p>
                <span className="text-xs text-slate-400 italic">Resultado: Propuesta estructurada para prevenir litigio innecesario.</span>
              </div>

            </div>
          </div>
        </section>

        {/* 11 — PRECIO */}
        <section className="py-20 md:py-28 px-6 max-w-4xl mx-auto text-center">
          <div className="p-8 sm:p-14 rounded-3xl bg-emerald-500/[0.04] border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.08)]">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-2">TARIFA TRANSPARENTE</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6">
              Un caso. Un solo pago.
            </h2>

            <div className="flex items-baseline justify-center gap-2 mb-8">
              <span className="text-5xl sm:text-6xl md:text-7xl font-black text-white">$480</span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-400">MXN</span>
            </div>

            <div className="max-w-md mx-auto space-y-3 text-left mb-8">
              {[
                'Apertura de tu caso',
                'Organización de tu información',
                'Orientación sobre tu situación',
                'Ayuda para preparar documentos cuando corresponda',
                'Ruta de acción',
                'Continuidad de tu caso'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-slate-200 text-base sm:text-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="py-4 border-t border-white/10 mb-8 space-y-1 text-slate-300 text-base font-medium">
              <p className="text-white font-bold">Sin mensualidad. Sin contrato.</p>
              <p>Puedes continuar trabajando en tu caso hasta que decidas cerrarlo.</p>
            </div>

            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-12 py-6 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-xl transition-all shadow-xl hover:shadow-emerald-500/25 active:scale-95"
            >
              Empezar mi caso
            </button>
          </div>
        </section>

        {/* 12 — PREGUNTAS FRECUENTES (FAQ) */}
        <section className="py-20 px-6 border-t border-white/5 bg-[#080D1A]/50">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Preguntas frecuentes
              </h2>
              <p className="text-slate-400 text-base">
                Respuestas directas a las dudas habituales antes de comenzar tu caso.
              </p>
            </div>

            <div className="space-y-4">
              {faqItems.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div 
                    key={index} 
                    className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full p-5 sm:p-6 text-left flex justify-between items-center gap-4 hover:bg-white/[0.02] transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="text-base sm:text-lg font-bold text-white">
                        {item.q}
                      </span>
                      <div className="p-1 rounded-lg bg-white/5 text-slate-400 shrink-0">
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-6 sm:px-6 text-slate-300 text-sm sm:text-base leading-relaxed border-t border-white/5 pt-4">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 13 — CTA FINAL */}
        <section className="py-20 md:py-28 px-6 text-center max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">
            No necesitas tener todo claro para empezar.
          </h2>
          <p className="text-emerald-400 text-xl sm:text-2xl font-semibold mb-10">
            Solo cuéntale a Justino qué pasó.
          </p>

          <div className="flex flex-col items-center justify-center gap-3">
            <button 
              onClick={onStart}
              className="group w-full sm:w-auto px-12 sm:px-14 py-5 sm:py-6 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-lg sm:text-xl transition-all shadow-xl hover:shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-3"
            >
              <span>Empezar mi caso</span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-slate-400 text-sm sm:text-base font-semibold">
              $480 MXN · Un solo pago · Sin mensualidad
            </p>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="py-16 border-t border-white/5 bg-[#080D1A]">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 opacity-70">
              <Logo className="w-7 h-7" />
              <span className="text-sm font-bold tracking-tighter uppercase italic text-white">Justino.app</span>
            </div>
            <span className="text-xs text-slate-500">© 2025 Todos los derechos reservados</span>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
            <button onClick={() => setShowPrivacy(true)} className="hover:text-emerald-400 transition-colors">
              Aviso de privacidad
            </button>
            <button onClick={() => setShowTerms(true)} className="hover:text-emerald-400 transition-colors">
              Términos y condiciones
            </button>
            <button onClick={() => setShowContact(true)} className="hover:text-emerald-400 transition-colors">
              Contacto
            </button>
            
            {/* Acceso Hermes discreto */}
            <button 
              onClick={onAdminAccess} 
              title="Terminal Hermes" 
              aria-label="Acceso Hermes"
              className="text-slate-700 hover:text-emerald-400 p-1.5 rounded-lg transition-colors flex items-center justify-center"
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
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
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
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all text-sm"
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
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
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
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all text-sm"
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
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 text-slate-300 space-y-6 text-base leading-relaxed">
              <p className="font-semibold text-white">
                JUSTINO es una plataforma desarrollada en México por NeuronConnect S.A.S. de C.V.
              </p>
              <p>
                Si tienes alguna consulta, visítanos en <a href="https://www.neuronconnect.mx" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline font-bold">www.neuronconnect.mx</a> para comunicarte con nuestro equipo.
              </p>
            </div>
            <div className="px-8 py-4 border-t border-white/5 bg-[#080D1A] shrink-0 text-right">
              <button 
                onClick={() => setShowContact(false)}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all text-sm"
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
