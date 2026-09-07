import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  FolderCheck, 
  MessageSquareText, 
  Scale, 
  Compass, 
  FileSignature, 
  Landmark, 
  ShieldAlert, 
  Award,
  ArrowRight,
  Sparkles,
  FileText,
  Building2
} from 'lucide-react';
import { User, Message, VaultFile, CaseStatus, DashboardTab } from '../types';

interface CaseTimelineProps {
  status: CaseStatus;
  user: User;
  messages: Message[];
  vaultFiles: VaultFile[];
  onNavigateTab?: (tab: DashboardTab) => void;
}

export interface DynamicMilestone {
  id: string;
  title: string;
  category: string;
  dateLabel: string;
  status: 'completed' | 'current' | 'pending';
  icon: React.ElementType;
  description: string;
  highlights?: string[];
  actionLabel?: string;
  actionTab?: DashboardTab;
  isAlert?: boolean;
}

export const CaseTimeline: React.FC<CaseTimelineProps> = ({ 
  status, 
  user, 
  messages = [], 
  vaultFiles = [], 
  onNavigateTab 
}) => {
  // --- ANALYSIS OF ACTUAL CASE DATA ---
  const userMessages = messages.filter(m => m.sender === 'user');
  const botMessages = messages.filter(m => m.sender === 'bot' && m.id !== 'welcome');
  const generatedDocs = vaultFiles.filter(f => f.origin === 'generated');
  const uploadedDocs = vaultFiles.filter(f => f.origin === 'uploaded');

  const allText = messages.map(m => m.text.toLowerCase()).join(' ');

  // Detection flags
  const hasUserSpoken = userMessages.length > 0;
  const hasMultipleExchanges = userMessages.length >= 2;
  
  // Legal analysis detected
  const hasLegalAnalysis = botMessages.some(m => 
    (m.sources && m.sources.length > 0) ||
    /artículo|codigo|código|ley|jurisprudencia|fundamento|fracción|normativa/i.test(m.text)
  );

  // Strategy detected
  const hasStrategy = botMessages.some(m => 
    /estrategia|plan de acción|pasos a seguir|vía procesal|recomiendo|procederemos a/i.test(m.text)
  ) || hasMultipleExchanges;

  // Documents generated
  const hasGeneratedDocs = generatedDocs.length > 0 || /\[DOCUMENTO_OFICIAL:/i.test(allText);

  // Physical filing info detected
  const hasFilingAddress = /juzgado|oficialía|oficialia|tribunal|conciliación|ministerio público|ventanilla/i.test(allText);

  // Contrademanda or Counterparty response detected
  const hasCounterAction = uploadedDocs.length > 0 || /contrademanda|notificaron|notificación|emplazamiento|citatorio|contestación de demanda|audiencia/i.test(allText);

  const isCaseClosed = status === 'closed';

  // --- BUILD DYNAMIC MILESTONES ---
  const milestones: DynamicMilestone[] = [
    // 1. Expediente Inicial
    {
      id: 'step-1',
      title: 'Apertura del Expediente Digital',
      category: 'Seguridad y Privacidad',
      dateLabel: 'Iniciado',
      status: 'completed',
      icon: FolderCheck,
      description: `Expediente blindado y asignado para ${user.preferredName || user.username || 'el titular'}. Protocolos de cifrado y confidencialidad activos.`
    },

    // 2. Recopilación de Hechos
    {
      id: 'step-2',
      title: 'Exposición y Hechos del Caso',
      category: 'Investigación Inicial',
      dateLabel: hasUserSpoken ? 'Completado' : 'En Curso',
      status: hasUserSpoken ? 'completed' : 'current',
      icon: MessageSquareText,
      description: hasUserSpoken 
        ? `Se registraron ${userMessages.length} intervenciones con los antecedentes, ubicación y pretensiones de tu caso.`
        : 'Esperando que detalles tu situación en el chat para que Justino comience a estructurar tu defensa.',
      actionLabel: !hasUserSpoken ? 'Ir al Chat' : undefined,
      actionTab: 'chat'
    },

    // 3. Diagnóstico y Encuadre Jurídico
    {
      id: 'step-3',
      title: 'Diagnóstico y Encuadre Legal',
      category: 'Análisis Normativo',
      dateLabel: hasLegalAnalysis ? 'Fundamentado' : (hasUserSpoken ? 'En Proceso' : 'Pendiente'),
      status: hasLegalAnalysis ? 'completed' : (hasUserSpoken ? 'current' : 'pending'),
      icon: Scale,
      description: hasLegalAnalysis
        ? 'Leyes, códigos aplicables y jurisprudencia identificados para blindar la fundamentación jurídica de tu asunto.'
        : 'Justino está correlacionando tus hechos con los códigos y leyes vigentes de tu jurisdicción.',
      actionLabel: hasLegalAnalysis ? 'Ver Bases Legales' : undefined,
      actionTab: 'legal'
    },

    // 4. Estrategia y Plan de Acción
    {
      id: 'step-4',
      title: 'Estrategia y Plan de Acción',
      category: 'Estrategia Procesal',
      dateLabel: hasStrategy ? 'Definida' : (hasLegalAnalysis ? 'En Proceso' : 'Pendiente'),
      status: hasStrategy ? 'completed' : (hasLegalAnalysis ? 'current' : 'pending'),
      icon: Compass,
      description: hasStrategy
        ? 'Ruta procesal trazada con pasos claros para que tomes el control de tu trámite sin intermediarios.'
        : 'Definición de la mejor vía (conciliatoria, civil, mercantil, familiar o administrativa) para tu caso.'
    },

    // 5. Redacción de Documentos Oficiales
    {
      id: 'step-5',
      title: 'Generación de Documentos Oficiales',
      category: 'Bóveda Documental',
      dateLabel: hasGeneratedDocs 
        ? `${generatedDocs.length || 1} Documento(s) Listo(s)` 
        : (hasStrategy ? 'En Redacción' : 'Pendiente'),
      status: hasGeneratedDocs ? 'completed' : (hasStrategy ? 'current' : 'pending'),
      icon: FileSignature,
      description: hasGeneratedDocs
        ? `Se han redactado y validado los escritos legales listos para firma y entrega oficial.`
        : 'Redacción con formato judicial formal, artículos, petitorios y personalidad jurídica.',
      highlights: generatedDocs.map(d => d.name),
      actionLabel: hasGeneratedDocs ? 'Abrir Mi Bóveda' : undefined,
      actionTab: 'vault'
    },

    // 6. Radicación y Presentación Física / Oficial
    {
      id: 'step-6',
      title: 'Radicación y Presentación Oficial',
      category: 'Trámite Presencial',
      dateLabel: hasFilingAddress ? 'Instrucciones Listas' : (hasGeneratedDocs ? 'Siguiente Paso' : 'Pendiente'),
      status: (hasGeneratedDocs && hasFilingAddress) ? 'completed' : (hasGeneratedDocs ? 'current' : 'pending'),
      icon: Landmark,
      description: hasFilingAddress
        ? 'Justino te indicó la oficialía de partes, juzgado o dependencia exacta a acudir, junto con el número de copias y requisitos.'
        : 'Una vez firmados los documentos, recibirás la dirección exacta de la sede donde debes presentarlos.',
      highlights: hasFilingAddress ? ['Llevar identificación oficial vigente', 'Presentar original y acuse de recibido'] : undefined
    }
  ];

  // If there's a counter-party notification, appeal or contestation, inject an adaptive phase
  if (hasCounterAction || isCaseClosed) {
    milestones.push({
      id: 'step-counter',
      title: 'Atención a Notificaciones / Contrademanda',
      category: 'Fase de Respuesta y Adaptación',
      dateLabel: hasCounterAction ? 'Atendido y Analizado' : 'Pendiente',
      status: hasCounterAction ? 'completed' : 'pending',
      icon: ShieldAlert,
      isAlert: true,
      description: hasCounterAction
        ? 'Se incorporaron nuevos documentos y respuestas de la contraparte. Justino adaptó la contra-estrategia y descargos necesarios.'
        : 'Fase reactiva preparada en caso de que la contraparte conteste, apele o presente nuevas excepciones.',
      highlights: uploadedDocs.length > 0 ? uploadedDocs.map(u => `Documento cargado: ${u.name}`) : undefined
    });
  }

  // 8. Resolución y Cierre
  milestones.push({
    id: 'step-final',
    title: 'Resolución, Convenio y Cierre del Caso',
    category: 'Conclusión Jurídica',
    dateLabel: isCaseClosed ? 'Caso Resuelto y Archivado' : 'Meta Final',
    status: isCaseClosed ? 'completed' : 'pending',
    icon: Award,
    description: isCaseClosed
      ? 'Caso concluido con éxito. El expediente y su historial quedan respaldados en tu bóveda segura.'
      : 'Obtención de sentencia favorable, acuerdo de mediación o resolución definitiva de tu situación legal.'
  });

  // Calculate percentage
  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const progressPercent = Math.min(100, Math.round((completedCount / milestones.length) * 100));

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header with Live Progress */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5" />
                Seguimiento en Tiempo Real
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-navy-900 tracking-tight">Ruta Legal del Caso</h2>
              <p className="text-slate-500 text-sm mt-1">
                Evolución de tu asunto legal a medida que interactúas con Justino y generas tus documentos.
              </p>
            </div>

            <div className="text-left md:text-right shrink-0 bg-slate-50 md:bg-transparent p-4 md:p-0 rounded-2xl border md:border-none border-slate-100">
              <span className="text-3xl md:text-4xl font-black text-navy-900">{progressPercent}%</span>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avance del Caso</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700 ease-out shadow-sm"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 mt-2">
              <span>Apertura de Expediente</span>
              <span>{completedCount} de {milestones.length} fases completadas</span>
              <span>Resolución</span>
            </div>
          </div>
        </div>

        {/* Dynamic Timeline */}
        <div className="relative pl-4 md:pl-6">
          {/* Vertical Track */}
          <div className="absolute left-10 md:left-12 top-6 bottom-6 w-0.5 bg-slate-200"></div>

          <div className="space-y-6">
            {milestones.map((milestone) => {
              const IconComponent = milestone.icon;
              const isDone = milestone.status === 'completed';
              const isCurrent = milestone.status === 'current';

              return (
                <div key={milestone.id} className="relative flex items-start gap-4 md:gap-6 group">
                  
                  {/* Status Indicator Icon Node */}
                  <div className={`relative z-10 w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all shadow-sm ${
                    isDone 
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-500/20' 
                      : isCurrent 
                        ? 'bg-white border-emerald-500 text-emerald-600 ring-4 ring-emerald-500/15' 
                        : 'bg-white border-slate-200 text-slate-300'
                  }`}>
                    {isDone ? (
                      <IconComponent className="w-6 h-6" />
                    ) : isCurrent ? (
                      <div className="relative">
                        <IconComponent className="w-6 h-6 animate-pulse" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                      </div>
                    ) : (
                      <IconComponent className="w-6 h-6" />
                    )}
                  </div>

                  {/* Card Content */}
                  <div className={`flex-1 p-5 md:p-6 rounded-2xl border transition-all ${
                    isCurrent 
                      ? 'bg-white border-emerald-200 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/10' 
                      : isDone 
                        ? 'bg-white border-slate-200/90 shadow-sm' 
                        : 'bg-slate-50/60 border-slate-200/60 opacity-60'
                  }`}>
                    
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {milestone.category}
                        </span>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 animate-pulse">
                            <Clock className="w-3 h-3" /> En Curso
                          </span>
                        )}
                        {isDone && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      <span className={`text-xs font-bold ${isCurrent ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {milestone.dateLabel}
                      </span>
                    </div>

                    <h3 className={`text-base md:text-lg font-black tracking-tight ${
                      isCurrent ? 'text-emerald-900' : isDone ? 'text-navy-900' : 'text-slate-500'
                    }`}>
                      {milestone.title}
                    </h3>

                    <p className="text-slate-600 text-xs md:text-sm mt-1.5 leading-relaxed">
                      {milestone.description}
                    </p>

                    {/* Highlights List if available */}
                    {milestone.highlights && milestone.highlights.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5">
                        {milestone.highlights.map((h, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                            <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{h}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Interactive Action Button */}
                    {milestone.actionLabel && milestone.actionTab && onNavigateTab && (
                      <div className="mt-4 pt-2">
                        <button
                          type="button"
                          onClick={() => onNavigateTab(milestone.actionTab!)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-colors border border-emerald-200 cursor-pointer shadow-sm"
                        >
                          <span>{milestone.actionLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Privacy & Legal Advisory Notice */}
        <div className="bg-navy-900 text-slate-300 p-6 rounded-3xl border border-navy-800 flex items-start gap-4 shadow-sm">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-white text-sm font-bold">Autonomía y Control Procesal</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Cada fase de tu Ruta Legal se actualiza en automático a medida que dialogas con Justino y subes documentos a tu Bóveda. Tú mantienes la propiedad absoluta de tu expediente y la decisión final sobre cada entrega.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
