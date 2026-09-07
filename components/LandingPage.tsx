
import React, { useState } from 'react';
import { ArrowRight, X, AlertCircle, Info, Clock, CheckCircle2, Search, FileText, Zap, Key } from 'lucide-react';
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
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showContact, setShowContact] = useState(false);

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
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.15] mb-8 tracking-tight">
            <span>¿No sabes qué hacer con tu problema legal?</span>
            <span className="block text-xl sm:text-2xl md:text-3xl font-normal text-slate-300 my-3 md:my-4">
              No tienes que enfrentarlo sin saber por dónde empezar.
            </span>
            <span className="text-emerald-400">Justino te ayuda a tomar el control de tu caso.</span>
          </h1>
          <p className="text-slate-400 text-xl md:text-2xl max-w-4xl mx-auto mb-10 leading-relaxed font-medium">
            Entiende tu situación, organiza tus documentos y pruebas, te ayuda a preparar los documentos que necesitas y te explica qué opciones tienes y cuáles pueden ser tus siguientes pasos.
          </p>

          <div className="inline-flex flex-col sm:flex-row items-center gap-4 px-8 py-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl mb-12 max-w-2xl mx-auto text-center sm:text-left shadow-[0_0_30px_rgba(16,185,129,0.05)]">
            <div className="flex items-baseline gap-1 shrink-0">
              <span className="text-4xl font-black text-emerald-400">$480</span>
              <span className="text-sm font-bold text-emerald-500/80">MXN</span>
            </div>
            <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
            <div className="text-slate-300 text-base font-medium leading-relaxed">
              Justino dará seguimiento a tu caso único hasta que decidas cerralo.
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

        {/* Un problema legal no debe enfrentarse solo */}
        <section className="w-full max-w-5xl mx-auto mb-32 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Un problema legal no debe enfrentarse solo</h2>
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

        {/* CASOS QUE JUSTINO PUEDE AYUDARTE A PREPARAR */}
        <section className="w-full max-w-4xl mx-auto mb-32 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight uppercase">
            Casos que Justino puede ayudarte a preparar
          </h2>
          <p className="text-slate-400 text-base md:text-lg mb-10 max-w-2xl mx-auto">
            Orientación clara, estructuración de pruebas y preparación de documentos específicos para tu situación.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-left">
            {[
              "Problemas de arrendamiento.",
              "Deudas y cobro.",
              "Contratos.",
              "Divorcio y asuntos familiares aplicables.",
              "Pensión alimenticia.",
              "Conflictos laborales.",
              "Otros trámites civiles frecuentes."
            ].map((text, i) => (
              <div 
                key={i} 
                className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-emerald-500/20 transition-all duration-300 shadow-md"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                  ✓
                </div>
                <p className="text-slate-200 text-base md:text-lg font-medium">{text}</p>
              </div>
            ))}
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 p-6 md:p-8 rounded-3xl text-left flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">Delimitación de alcance</p>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                Justino no atiende casos penales graves, emergencias ni situaciones que requieran representación inmediata ante una autoridad así como casos de derecho fiscal.
              </p>
            </div>
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
                  <span className="text-6xl md:text-7xl font-black text-slate-900">$480</span>
                  <span className="text-xl font-bold text-emerald-600">MXN</span>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 inline-block">
                  <p className="text-slate-500 text-sm font-semibold">
                    Sin mensualidades. Sin contratos. Sin volver a empezar.
                  </p>
                </div>
                <div>
                  <button 
                    onClick={onStart}
                    className="group w-full md:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-base transition-all shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    Quiero empezar mi caso
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
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
           
           <div className="flex flex-wrap justify-center items-center gap-8 text-xs font-black uppercase tracking-widest text-slate-500">
             <button onClick={() => setShowPrivacy(true)} className="hover:text-emerald-500 transition-colors">Aviso de privacidad</button>
             <button onClick={() => setShowTerms(true)} className="hover:text-emerald-500 transition-colors">Términos y condiciones</button>
             <button onClick={() => setShowContact(true)} className="hover:text-emerald-500 transition-colors">CONTACTO</button>
             
             {/* Ícono de Llave Discreto / Camuflajeado */}
             <button 
               id="hermes-access-trigger"
               onClick={onAdminAccess} 
               title="Terminal Hermes" 
               aria-label="Acceso Hermes"
               className="text-slate-700/80 hover:text-emerald-400 p-1.5 rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-center hover:bg-emerald-500/10"
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
                  <li>Nombre.</li>
                  <li>Correo electrónico.</li>
                  <li>Número telefónico.</li>
                  <li>Datos de acceso a la cuenta.</li>
                  <li>Información contenida en consultas jurídicas.</li>
                  <li>Documentos cargados por el usuario.</li>
                  <li>Evidencias, imágenes y archivos.</li>
                  <li>Información técnica del dispositivo y uso de la plataforma.</li>
                </ul>
                <p className="mt-3">
                  Justino no solicita deliberadamente datos personales sensibles. Si el usuario decide proporcionarlos dentro de una consulta o documento, serán tratados únicamente para atender el servicio solicitado.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">3. FINALIDAD DEL TRATAMIENTO</h3>
                <p className="mb-2">Los datos personales se utilizan para:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Crear y administrar la cuenta del usuario.</li>
                  <li>Responder consultas.</li>
                  <li>Generar documentos y expedientes.</li>
                  <li>Mejorar la precisión de las respuestas.</li>
                  <li>Dar soporte técnico.</li>
                  <li>Prevenir fraude, abuso o usos indebidos.</li>
                  <li>Cumplir obligaciones legales.</li>
                  <li>Mejorar continuamente la plataforma.</li>
                </ul>
                <p className="mt-3 font-semibold text-emerald-400">
                  No venderemos los datos personales de nuestros usuarios.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">4. USO DE INTELIGENCIA ARTIFICIAL</h3>
                <p>
                  Las consultas, documentos e información proporcionada por el usuario podrán ser procesados mediante modelos de inteligencia artificial para generar respuestas, organizar información y elaborar documentos.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">5. ALMACENAMIENTO Y SEGURIDAD</h3>
                <p>
                  Justino implementa medidas técnicas y administrativas razonables para proteger la información contra pérdida, acceso no autorizado, alteración o divulgación.
                </p>
                <p className="mt-2 text-slate-400 italic">
                  Aunque empleamos medidas de seguridad, ningún sistema conectado a Internet puede garantizar una seguridad absoluta.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">6. COMPARTICIÓN DE INFORMACIÓN</h3>
                <p className="mb-2">Los datos podrán compartirse únicamente cuando:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Sea necesario para operar la plataforma mediante proveedores tecnológicos.</li>
                  <li>Exista obligación legal.</li>
                  <li>Lo solicite una autoridad competente conforme a la ley.</li>
                </ul>
                <p className="mt-3">
                  Fuera de estos casos, la información no será vendida ni comercializada.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">7. CONSERVACIÓN DE LA INFORMACIÓN</h3>
                <p>
                  Los datos se conservarán únicamente durante el tiempo necesario para prestar el servicio, cumplir obligaciones legales o atender solicitudes del usuario.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">8. DERECHOS DEL USUARIO</h3>
                <p>
                  El usuario podrá solicitar el acceso, rectificación, actualización, cancelación o eliminación de sus datos personales, así como oponerse a determinados tratamientos, conforme a la legislación aplicable.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">9. COOKIES Y TECNOLOGÍAS SIMILARES</h3>
                <p>
                  La plataforma puede utilizar cookies y tecnologías similares para recordar preferencias, mantener sesiones, mejorar la experiencia del usuario y obtener estadísticas de funcionamiento.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">10. MENORES DE EDAD</h3>
                <p>
                  La plataforma no está dirigida a menores de edad sin la supervisión de su padre, madre o tutor legal.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">11. CAMBIOS AL AVISO</h3>
                <p>
                  Justino podrá modificar este Aviso de Privacidad cuando sea necesario. La versión vigente será la publicada en la plataforma.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">12. CONTACTO</h3>
                <p>
                  Para cualquier solicitud relacionada con este Aviso de Privacidad o con el tratamiento de datos personales, el usuario podrá comunicarse mediante los canales oficiales publicados en el sitio web de Justino.
                </p>
              </div>

              <div className="pt-6 border-t border-white/5 text-xs text-slate-400">
                Al utilizar la plataforma, el usuario reconoce haber leído y comprendido este Aviso de Privacidad y acepta el tratamiento de sus datos conforme a lo aquí establecido.
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
            <div className="p-8 overflow-y-auto text-slate-300 space-y-6 text-sm leading-relaxed animate-in fade-in duration-300">
              <p className="text-emerald-400 font-bold uppercase tracking-wider text-xs font-black">TÉRMINOS Y CONDICIONES DE USO DE JUSTINO Versión 2.0</p>
              
              <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-2xl">
                <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wider mb-2">Aviso Importante</h3>
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                  Justino es una plataforma tecnológica de orientación jurídica basada en inteligencia artificial. No es un despacho jurídico, no presta servicios de representación legal, no sustituye la asesoría profesional de un abogado ni garantiza resultados en procedimientos administrativos o judiciales. Toda la información y los documentos generados tienen fines informativos y de apoyo para el usuario.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">1. OBJETO</h3>
                <p>
                  Estos Términos y Condiciones regulan el acceso y uso de la plataforma Justino. Al utilizar la plataforma, el usuario acepta íntegramente su contenido.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">2. ¿QUÉ ES JUSTINO?</h3>
                <p>
                  Justino ayuda a comprender temas jurídicos, explicar procedimientos, organizar expedientes, identificar documentación relevante y generar borradores de documentos con base en la información proporcionada por el usuario y en legislación mexicana disponible en fuentes públicas al momento de la consulta.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">3. ALCANCE DEL SERVICIO</h3>
                <p className="mb-2">Justino puede:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Explicar conceptos jurídicos.</li>
                  <li>Orientar sobre procedimientos.</li>
                  <li>Organizar información y evidencia.</li>
                  <li>Elaborar borradores de contratos, escritos, solicitudes, cartas y otros documentos.</li>
                  <li>Ayudar al usuario a preparar su expediente.</li>
                </ul>
                <p className="mt-3 text-slate-400 italic">
                  La información proporcionada constituye una guía tecnológica y no una opinión jurídica vinculante.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">4. LO QUE JUSTINO NO HACE</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Justino no ejerce la profesión de abogado.</li>
                  <li>No representa usuarios ante autoridades o tribunales.</li>
                  <li>No interpone demandas, recursos o denuncias.</li>
                  <li>No firma documentos en nombre del usuario.</li>
                  <li>No garantiza el éxito de ningún trámite o procedimiento.</li>
                  <li>No sustituye el criterio profesional de un abogado cuando las circunstancias del caso requieran asesoría especializada.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">5. DOCUMENTOS GENERADOS</h3>
                <p className="mb-2">
                  Los documentos elaborados por Justino son borradores generados automáticamente con la información proporcionada por el usuario.
                </p>
                <p className="mb-2">
                  Antes de utilizarlos, el usuario deberá revisarlos cuidadosamente, verificar su contenido y realizar las modificaciones que considere necesarias.
                </p>
                <p className="mb-2">
                  Cuando la ley exija firma, ratificación, protocolización, certificación, presentación ante una autoridad o cualquier otro requisito formal, será responsabilidad exclusiva del usuario cumplir con dichas formalidades.
                </p>
                <p className="font-semibold text-emerald-400">
                  La generación de un documento dentro de la plataforma no le otorga por sí misma validez jurídica.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">6. INFORMACIÓN PROPORCIONADA POR EL USUARIO</h3>
                <p>
                  El usuario declara que la información que ingresa es veraz, completa y actualizada. Justino genera sus respuestas con base en dicha información. Si ésta resulta falsa, incompleta, incorrecta o desactualizada, los resultados también podrán serlo.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">7. RESPONSABILIDAD DEL USUARIO</h3>
                <p className="mb-2">El usuario es el único responsable de:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Revisar la información recibida.</li>
                  <li>Verificar los documentos generados.</li>
                  <li>Decidir si utiliza o no las recomendaciones de la plataforma.</li>
                  <li>Presentar documentos ante autoridades.</li>
                  <li>Cumplir plazos y requisitos legales.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">8. LIMITACIÓN DE RESPONSABILIDAD</h3>
                <p className="mb-2">Justino no será responsable por:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Decisiones tomadas por el usuario.</li>
                  <li>Información falsa, incompleta o incorrecta proporcionada por el usuario.</li>
                  <li>Pérdida de derechos por omisiones o vencimiento de plazos.</li>
                  <li>Cambios posteriores en la legislación.</li>
                  <li>Criterios emitidos por jueces o autoridades.</li>
                  <li>Errores derivados de información pública incorrecta.</li>
                  <li>Resultados de procedimientos administrativos, judiciales o extrajudiciales.</li>
                  <li>Daños directos o indirectos derivados del uso de la plataforma.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">9. ACTUALIZACIÓN DE LA INFORMACIÓN</h3>
                <p>
                  Justino procura mantener su contenido actualizado conforme a la legislación mexicana publicada en fuentes oficiales. Sin embargo, las leyes, reglamentos, criterios judiciales y procedimientos pueden modificarse sin previo aviso, por lo que la plataforma no garantiza que toda la información permanezca permanentemente actualizada.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">10. USO PERMITIDO</h3>
                <p className="mb-2">El usuario se compromete a utilizar la plataforma únicamente para fines lícitos. Queda prohibido utilizar Justino para:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Generar documentos falsos.</li>
                  <li>Suplantar identidad.</li>
                  <li>Cometer fraudes o cualquier actividad ilícita.</li>
                  <li>Vulnerar derechos de terceros.</li>
                  <li>Intentar afectar la seguridad o funcionamiento de la plataforma.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">11. PROPIEDAD INTELECTUAL</h3>
                <p>
                  Todo el software, diseño, contenido, algoritmos, bases de datos, textos, logotipos, marcas e identidad visual de Justino se encuentran protegidos por la legislación aplicable sobre propiedad intelectual. Ningún elemento podrá reproducirse, distribuirse o explotarse sin autorización.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">12. MODIFICACIONES</h3>
                <p>
                  Justino podrá modificar estos Términos y Condiciones en cualquier momento. Las nuevas versiones surtirán efectos desde su publicación. El uso continuo de la plataforma implica la aceptación de dichas modificaciones.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-base mb-2">13. LEGISLACIÓN APLICABLE</h3>
                <p>
                  Estos Términos y Condiciones se regirán por las leyes de los Estados Unidos Mexicanos. Cualquier controversia será resuelta por las autoridades competentes conforme a la legislación aplicable.
                </p>
              </div>

              <div className="pt-6 border-t border-white/5 text-xs text-slate-400">
                Al utilizar Justino, el usuario manifiesta haber leído, comprendido y aceptado estos Términos y Condiciones.
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
                JUSTINO es una APP desarrollada en México por NeuronConnect S.A.S. de C.V.
              </p>
              <p>
                Si tienes algún comentario referente a Justino Visítanos en <a href="https://www.neuronconnect.mx" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline font-bold">www.neuronconnect.mx</a> para que uno de nuestros agentes te atienda.
              </p>
              <p className="text-sm text-slate-400 italic">
                Apreciamos mucho tu retroalimentación.
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
