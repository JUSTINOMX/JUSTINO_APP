
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
            Justino te ayuda con tu problema legal, <span className="text-emerald-400">paso a paso</span> y sin gastar de más
          </h1>
          <p className="text-slate-400 text-xl md:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            Cuando tienes un problema legal, no necesitas palabras difíciles ni juicios caros. Necesitas entender qué hacer, qué sigue y cómo avanzar con calma.
          </p>

          <button 
            onClick={onStart}
            className="group px-12 py-6 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-xl transition-all shadow-xl hover:-translate-y-1 flex items-center gap-3 mx-auto"
          >
            Iniciar mi caso ahora
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <p className="mt-8 text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">
            DISEÑADO PARA MÉXICO · CLARO · ACCESIBLE · SIN LETRAS CHIQUITAS
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
             <p className="text-slate-400 text-base">Justino existe para que no te quedes detenido, para que tengas claridad y apoyo desde el primer momento.</p>
          </div>
        </section>

        {/* ¿Qué es Justino? */}
        <section className="w-full max-w-5xl mx-auto mb-40">
           <div className="bg-white/5 border border-white/10 p-12 md:p-20 rounded-[48px] backdrop-blur-sm relative overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-8">
                    <h2 className="text-4xl font-bold">¿Qué es Justino?</h2>
                    <p className="text-slate-400 text-base md:text-lg leading-relaxed">
                      Justino es una web app que te acompaña en los problemas legales más comunes, ayudándote a:
                    </p>
                    <ul className="space-y-5">
                       {[
                         { icon: Search, text: "Entender tu situación" },
                         { icon: Info, text: "Saber qué opciones tienes" },
                         { icon: FileText, text: "Preparar escritos y documentos" },
                         { icon: Clock, text: "Avanzar paso a paso sin presión" }
                       ].map((item, i) => (
                         <li key={i} className="flex items-center gap-4 text-slate-300 font-medium text-base md:text-lg">
                            <item.icon className="w-6 h-6 text-emerald-500/70" /> {item.text}
                         </li>
                       ))}
                    </ul>
                 </div>
                 <div className="bg-white/5 p-10 rounded-3xl border border-white/10 flex flex-col justify-center">
                    <div className="flex items-start gap-4 mb-6">
                       <AlertCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                       <div>
                          <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">Poder Legal en tus manos</p>
                          <p className="text-sm text-slate-400 leading-relaxed">Te da las herramientas para que tú mismo resuelvas tu caso con éxito.</p>
                       </div>
                    </div>
                    <p className="text-xl font-bold italic leading-relaxed text-slate-200">
                      "Justino es el primer apoyo para que no enfrentes tu problema a ciegas."
                    </p>
                 </div>
              </div>
           </div>
        </section>

        {/* Los 5 problemas... */}
        <section className="w-full max-w-6xl mx-auto mb-40 text-center">
           <h2 className="text-4xl md:text-5xl font-bold mb-8 max-w-4xl mx-auto">
             Los 5 problemas legales más comunes con los que Justino te puede ayudar
           </h2>
           <p className="text-slate-500 text-lg md:text-xl mb-6 max-w-3xl mx-auto leading-relaxed">
             Estos casos representan las situaciones legales más cotidianas y urgentes en México. Son retos reales que merecen una solución clara y sin complicaciones.
           </p>
           <p className="text-emerald-400 text-lg font-bold mb-16">Son urgentes, reales y muchas veces abandonados por falta de orientación.</p>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left mb-12">
              <ServiceCard 
                number="1" 
                title="Pensión alimenticia" 
                desc="Uno de los problemas legales más frecuentes, urgentes y emocionalmente difíciles."
                items={["Entender tus derechos y obligaciones básicas", "Preparar la solicitud", "Reunir y organizar pruebas", "Generar escritos base"]}
                acompañamiento="Acompañarte hasta que el trámite quede presentado."
              />
              <ServiceCard 
                number="2" 
                title="Divorcio administrativo o voluntario" 
                desc="Un trámite común, pero confuso si no sabes cómo hacerlo."
                items={["Te explica los pasos reales del procedimiento", "Verifica si cumples los requisitos", "Generar documentos previos", "Te orientado para notaría si aplica"]}
                acompañamiento="Te acompaña hasta el cierre del trámite."
              />
              <ServiceCard 
                number="3" 
                title="Arrendamiento (inquilino o propietario)" 
                desc="Problemas diarios, tanto en ciudad como en zonas rurales."
                items={["Cartas de requerimiento", "Contratos simples", "Avisos formales", "Organización del caso"]}
                acompañamiento="Prevención de abusos."
              />
              <ServiceCard 
                number="4" 
                title="Cobro de adeudos pequeños (mercantil básico)" 
                desc="La economía diaria también necesita respaldo legal."
                items={["Pagarés", "Reconocimientos de deuda", "Cartas de cobro", "Orden del expediente"]}
                acompañamiento="Justino prepara tu expediente para un cobro efectivo."
              />
           </div>

           <div className="grid grid-cols-1 gap-10 text-left mb-20">
              <div className="p-10 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm flex flex-col md:flex-row gap-12">
                 <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">5</div>
                      <h3 className="text-3xl font-bold text-white">Denuncias guiadas (delitos menores sin violencia)</h3>
                    </div>
                    <p className="text-slate-400 text-lg mb-6">Acceso básico a la justicia, sin miedo ni confusión.</p>
                 </div>
                 <div className="flex-1 space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Justino:</p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                       {["Te explica cómo denunciar", "Qué documentos llevar", "Qué esperar del proceso", "Genera narrativas claras"].map((t, i) => (
                         <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                           <CheckCircle2 className="w-5 h-5 text-emerald-500/50 shrink-0 mt-0.5" /> {t}
                         </li>
                       ))}
                    </ul>
                    <p className="pt-4 text-xs italic text-slate-500 border-t border-white/5">Te acompaña sin estrategia penal.</p>
                 </div>
              </div>
           </div>

           {/* Caja roja de exclusión */}
           <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-10 max-w-5xl mx-auto flex flex-col items-center gap-8">
              <div className="flex items-center gap-3 text-red-400 font-bold uppercase tracking-widest text-sm">
                 <AlertCircle className="w-5 h-5" /> Por tu seguridad y la de todos, Justino no atiende:
              </div>
              <div className="flex flex-wrap justify-center gap-5">
                 {["DELITOS GRAVES", "VIOLENCIA EXTREMA", "CRIMEN ORGANIZADO", "CASOS FISCALES COMPLEJOS"].map((t, i) => (
                   <span key={i} className="px-5 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-black text-red-400 tracking-wider">
                     {t}
                   </span>
                 ))}
              </div>
           </div>
        </section>

        {/* Justino se queda contigo */}
        <section className="w-full max-w-5xl mx-auto mb-40 text-center">
           <h2 className="text-4xl font-bold mb-6">Justino se queda contigo y con tu caso</h2>
           <p className="text-slate-500 text-lg mb-16">Tu problema legal no se resuelve en un solo mensaje. Por eso, Justino:</p>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="p-10 bg-white/5 border border-white/10 rounded-3xl text-left flex gap-8">
                 <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <Zap className="w-7 h-7 text-blue-400" />
                 </div>
                 <div>
                    <h3 className="font-bold text-xl text-white mb-3">Memoria Persistente</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">Mantiene la memoria de tu caso. Recuerda lo que ya explicaste y guarda los documentos que decidas subir.</p>
                 </div>
              </div>
              <div className="p-10 bg-white/5 border border-white/10 rounded-3xl text-left flex gap-8">
                 <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="w-7 h-7 text-emerald-400" />
                 </div>
                 <div>
                    <h3 className="font-bold text-xl text-white mb-3">Seguimiento Real</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">No tienes que volver a empezar desde cero. Si recibes una respuesta o un nuevo documento, Justino te ayuda a entenderlo.</p>
                 </div>
              </div>
           </div>
        </section>

        {/* Claro desde el inicio (Módulo Blanco) */}
        <section className="w-full max-w-5xl mx-auto mb-40">
           <div className="bg-white rounded-[40px] p-16 md:p-24 text-center shadow-2xl">
              <h2 className="text-4xl md:text-5xl font-black text-navy-900 mb-8 tracking-tight">Claro desde el inicio</h2>
              <p className="text-slate-500 text-lg md:text-xl mb-16 max-w-xl mx-auto font-medium">Justino no es un abogado tradicional ni un despacho.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                 {[
                   { label: "EXPLICA", color: "bg-blue-500" },
                   { label: "ACOMPAÑA", color: "bg-emerald-500" },
                   { label: "ORGANIZA", color: "bg-indigo-500" },
                   { label: "PREPARA", color: "bg-amber-500" }
                 ].map((step, i) => (
                   <div key={i} className="p-6 bg-slate-50 rounded-2xl flex flex-col items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${step.color}`} />
                      <span className="text-xs font-black text-navy-900 tracking-widest">{step.label}</span>
                   </div>
                 ))}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl mx-auto italic">
                Justino te otorga la autonomía para defender tus derechos. Es una herramienta diseñada para que actúes con la misma precisión que un experto, eliminando obstáculos y gastos innecesarios.
              </p>
           </div>
        </section>

        {/* Empieza hoy, con claridad (ÚLTIMA PARTE) */}
        <section className="w-full max-w-5xl mx-auto mb-32 text-center">
           <h2 className="text-5xl md:text-6xl font-bold mb-8">Empieza hoy, con claridad</h2>
           <p className="text-slate-400 text-xl md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed">
             No tienes que saber de leyes. Solo tienes que decidir no quedarte detenido.
           </p>

           <button 
            onClick={onStart}
            className="group px-14 py-7 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-2xl transition-all shadow-2xl hover:-translate-y-1 flex items-center gap-4 mx-auto"
          >
            Iniciar mi caso ahora
            <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="mt-12 text-xs font-bold text-slate-600 uppercase tracking-[0.4em]">
            DISEÑADO PARA MÉXICO · PENSADO PARA PERSONAS REALES
          </p>
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
