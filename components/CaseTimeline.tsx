import React from 'react';
import { TimelineEvent, CaseStatus } from '../types';
import { CheckCircle2, Circle, Clock, Lock } from 'lucide-react';

interface CaseTimelineProps {
  status: CaseStatus;
}

export const CaseTimeline: React.FC<CaseTimelineProps> = ({ status }) => {
  const events: TimelineEvent[] = [
    { id: '1', title: 'Inicio del Caso', date: 'Hoy', status: 'completed' },
    { id: '2', title: 'Recopilación de Hechos', date: 'En Proceso', status: status === 'analyzing' ? 'current' : 'completed' },
    { id: '3', title: 'Análisis Legal', date: 'Pendiente', status: status === 'in_process' ? 'current' : (status === 'ready' || status === 'closed' ? 'completed' : 'pending') },
    { id: '4', title: 'Generación de Estrategia', date: 'Pendiente', status: status === 'ready' ? 'current' : (status === 'closed' ? 'completed' : 'pending') },
    { id: '5', title: 'Caso Cerrado y Archivado', date: 'Futuro', status: status === 'closed' ? 'completed' : 'pending' },
  ];

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-navy-900 mb-2">Ruta Legal</h2>
        <p className="text-slate-500 mb-10">Línea de tiempo de tu solución.</p>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-200"></div>

          <div className="space-y-8">
            {events.map((event, index) => (
              <div key={event.id} className="relative flex items-start gap-6 group">
                {/* Dot */}
                <div className={`relative z-10 w-12 h-12 rounded-full border-4 flex items-center justify-center shrink-0 transition-colors ${
                  event.status === 'completed' ? 'bg-emerald-500 border-emerald-100' :
                  event.status === 'current' ? 'bg-white border-emerald-500' :
                  'bg-white border-slate-200'
                }`}>
                  {event.status === 'completed' && event.id !== '5' && <CheckCircle2 className="w-6 h-6 text-white" />}
                  {event.status === 'completed' && event.id === '5' && <Lock className="w-5 h-5 text-white" />}
                  {event.status === 'current' && <Clock className="w-6 h-6 text-emerald-500 animate-pulse" />}
                  {event.status === 'pending' && <Circle className="w-6 h-6 text-slate-300" />}
                </div>

                {/* Content */}
                <div className={`pt-2 transition-opacity ${event.status === 'pending' ? 'opacity-50' : 'opacity-100'}`}>
                  <h3 className={`text-lg font-bold ${event.status === 'current' ? 'text-emerald-600' : 'text-navy-900'}`}>
                    {event.title}
                  </h3>
                  <p className="text-slate-500 text-sm">{event.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};