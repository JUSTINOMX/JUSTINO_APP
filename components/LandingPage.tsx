
import React from 'react';
import { ArrowRight, X, AlertCircle, Info, Clock, CheckCircle2, Search, FileText, Zap } from 'lucide-react';
import { Logo } from './Logo';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
  onAdminAccess: () => void;
  hasExistingSession: boolean;
}

const ProblemBadge = ({ text }: { text: string }) => (
  <div className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-base font-medium">
    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/40">
      <X className="w-3 h-3 text-red-400" />
    </div>
    {text}
  </div>
);

const ServiceCard = ({ number, title, desc, items, acompañamiento }: any) => (
  <div className="p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm hover:border-emerald-500/30 transition-all">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
        {number}
      </div>
      <h3 className="text-2xl font-bold text-white">{title}</h3>
    </div>
    <p className="text-slate-400 text-base mb-6 leading-relaxed">{desc}</p>
    <div className="space-y-4">
      <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Justino te ayuda con:</p>
      <ul className="space-y-2">
        {items.map((item: string, i: number) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500/50 shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
      </ul>
      <p className="pt-4 text-xs italic text-slate-500 border-t border-white/5">{acompañamiento}</p>
    </div>
  </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin, onAdminAccess, hasExistingSession }) => {
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="container mx-auto px-6 py-8 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <span className="text-2xl font-bold tracking-tight">Justino</span>
        </div>
        <button onClick={onLogin} className="text-sm font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest">
          {hasExistingSession ? "Acceder a mi caso" : "Acceder a mi caso"}
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center pt-16 pb-32 px-6">
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-12 border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
          <Logo className="w-12 h-12" />
        </div>

        <section className="text-center max-w-5xl mx-auto mb-20">
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-8 tracking-tight">
            ¿No sabes qué hacer con tu problema legal?<br />
            <span className="text-emerald-400">Justino es tu guía legal digital.</span>
          </h1>
          <p className="text-slate-400 text-xl md:text-2xl max-w-4xl mx-auto mb-10 leading-relaxed font-medium">
            Te ayuda a entender tu situación, preparar un plan, generar los documentos que necesites y saber exactamente qué hacer, paso a paso.
          </p>

          <div className="inline-flex flex-col sm:flex-row items-center gap-4 px-8 py-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl mb-12 max-w-2xl mx-auto text-center sm:text-left shadow-[0_0_30px_rgba(16,185,129,0.05)]">
            <div className="flex items-baseline gap-1 shrink-0">
              <span className="text-4xl font-black text-emerald-400">$400</span>
              <span className="text-sm font-bold text-emerald-500/80">MXN</span>
            </div>
            <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
            <div className="text-slate-300 text-base font-medium leading-relaxed">
              Desde el inicio de tu caso hasta que tú decidas cerrarlo.
            </div>
          </div>

          <button 
            onClick={onStart}
            className="group px-12 py-6 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-xl transition-all shadow-xl hover:-translate-y-1 flex items-center gap-3 mx-auto uppercase tracking-wider"
          >
            Quiero empezar mi caso
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <p className="mt-8 text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
            Basado en la legislación vigente de México.
          </p>
        </section>

        {/* Un problema legal no debería dejarte solo */}
        <section className="w-full max-w-5xl mx-auto mb-40 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Un problema legal no debería dejarte solo</h2>
          <p className="text-slate-500 text-lg mb-12">Muchas personas no avanzan en su problema legal porque:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16 text-left">
            <ProblemBadge text="No saben por dónde empezar" />
            <ProblemBadge text="Tienen miedo de hacerlo mal" />
            <ProblemBadge text="No pueden pagar un abogado desde el inicio" />
            <ProblemBadge text="Les hablan con palabras que no entienden" />
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 p-10 rounded-[32px] max-w-4xl mx-auto">
             <p className="text-emerald-400 text-xl font-bold mb-3">Y mientras tanto, el problema crece.</p>
             <p className="text-slate-400 text-base">Justino existe para que no te detengas, para que tengas claridad y acompañamiento desde el primer momento.</p>
          </div>
        </section>
              {/* ¿QUÉ HARÁ JUSTINO POR TI? */}
        <section className="w-full max-w-4xl mx-auto mb-32">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12 tracking-tight uppercase">
            ¿Qué hará Justino por ti?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              "Entenderá tu caso.",
              "Preparará un plan para ayudarte.",
              "Generará los documentos que necesites.",
              "Te dirá exactamente dónde y cómo continuar.",
              "Mantendrá todo tu expediente organizado.",
              "Recordará tu caso para que nunca vuelvas a empezar desde cero.",
              "Permanecerá contigo hasta que tú decidas cerrar tu caso."
            ].map((text, i) => (
              <div 
                key={i} 
                className="flex items-start gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-emerald-500/20 transition-all duration-300 shadow-md"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                  ✓
                </div>
                <p className="text-slate-200 text-lg font-medium leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ASÍ DE FÁCIL */}
        <section className="w-full max-w-5xl mx-auto mb-32">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 tracking-tight uppercase">
            Así de fácil
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Cuéntale qué pasó.",
                desc: "Solo responde una entrevista sencilla."
              },
              {
                step: "2",
                title: "Justino prepara tu caso.",
                desc: "Entiende tu situación y crea un plan para ayudarte."
              },
              {
                step: "3",
                title: "Sigue la guía.",
                desc: "Haz cada paso con la seguridad de saber qué sigue."
              },
              {
                step: "4",
                title: "Regresa cuando lo necesites.",
                desc: "Si tu caso cambia, Justino continuará exactamente donde se quedó."
              }
            ].map((item, i) => (
              <div key={i} className="relative p-8 bg-white/5 border border-white/10 rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 font-black text-xl mb-6">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-xl text-white mb-4 leading-snug">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TODO ESTO POR */}
        <section className="w-full max-w-4xl mx-auto mb-32">
          <div className="bg-white rounded-[40px] p-12 md:p-16 text-slate-900 shadow-2xl text-center md:text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 mb-2">TODO ESTO POR</p>
                <div className="flex justify-center md:justify-start items-baseline gap-2 mb-6">
                  <span className="text-6xl md:text-7xl font-black text-slate-900">$400</span>
                  <span className="text-xl font-bold text-emerald-600">MXN</span>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 inline-block">
                  <p className="text-slate-500 text-sm font-semibold">
                    Sin mensualidades. Sin contratos. Sin volver a empezar.
                  </p>
                </div>
              </div>
              <div className="text-left bg-slate-50 p-8 md:p-10 rounded-3xl border border-slate-100">
                <p className="font-bold text-slate-900 text-lg mb-6">Con un solo pago obtienes:</p>
                <ul className="space-y-4">
                  {[
                    "Un caso abierto.",
                    "Una estrategia personalizada.",
                    "Los documentos que necesites.",
                    "Una guía clara paso a paso.",
                    "Un expediente que recuerda toda tu historia.",
                    "Acceso a tu caso hasta que tú decidas cerrarlo."
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 text-sm md:text-base font-medium">
                      <span className="text-emerald-500 font-bold shrink-0">✔</span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* HECHO PARA MÉXICO */}
        <section className="w-full max-w-4xl mx-auto mb-32 text-center">
          <div className="border border-white/10 bg-white/5 p-12 rounded-[32px]">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 tracking-tight uppercase text-emerald-400">
              Hecho para México
            </h2>
            <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-medium">
              Justino utiliza la legislación vigente de México para ayudarte a comprender tu situación y orientarte de acuerdo con la autoridad y la jurisdicción que correspondan a tu caso.
            </p>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="w-full max-w-4xl mx-auto mb-32 text-center">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight leading-none text-white">
            Dar el primer paso cambia todo.
          </h2>
          <h3 className="text-2xl md:text-3xl font-medium text-emerald-400 mb-6">
            Empieza hoy.
          </h3>
          <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-xl mx-auto">
            De lo demás se encargará Justino.
          </p>

          <button 
            onClick={onStart}
            className="group px-14 py-7 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-2xl transition-all shadow-2xl hover:-translate-y-1 flex items-center gap-4 mx-auto uppercase tracking-wider"
          >
            Quiero empezar mi caso
            <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
          </button>
        </section>

      </main>

      {/* Footer Extendido */}
      <footer className="py-16 border-t border-white/5 bg-[#080D1A]">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="flex items-center gap-8">
             <div className="flex items-center gap-3 opacity-60">
               <Logo className="w-7 h-7" />
               <span className="text-sm font-bold tracking-tighter uppercase italic">Justino.app</span>
             </div>
             <span className="text-xs text-slate-600 font-bold">© 2025 Todos los derechos reservados</span>
           </div>
           
           <div className="flex flex-wrap justify-center gap-10 text-xs font-black uppercase tracking-widest text-slate-500">
             <button onClick={() => {}} className="hover:text-emerald-500 transition-colors">Aviso de privacidad</button>
             <button onClick={() => {}} className="hover:text-emerald-500 transition-colors">Términos y condiciones</button>
             <button onClick={() => {}} className="hover:text-emerald-500 transition-colors">CONTACTO</button>
             <button onClick={onAdminAccess} className="opacity-0 w-0 h-0 p-0 overflow-hidden">Admin</button>
           </div>
        </div>
      </footer>
    </div>
  );
};
