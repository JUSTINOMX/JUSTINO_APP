import React, { useState, useEffect } from 'react';
import { RefreshCw, BookOpen, CheckSquare, BrainCircuit, Archive, Download, Trash2, AlertCircle } from 'lucide-react';
import { Message, CaseSummary, CaseStatus } from '../types';
import { generateCaseSummary } from '../services/justino-service';

interface CaseHistoryProps {
  messages: Message[];
  caseStatus: CaseStatus;
  onCloseCase: () => void;
  onWipeData: () => void;
}

export const CaseHistory: React.FC<CaseHistoryProps> = ({ messages, caseStatus, onCloseCase, onWipeData }) => {
  const [summary, setSummary] = useState<CaseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isClosed = caseStatus === 'closed';

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    const newSummary = await generateCaseSummary(messages);
    setSummary(newSummary);
    localStorage.setItem('justino_summary', JSON.stringify(newSummary));
    setIsLoading(false);
  };

  const handleDownloadPack = () => {
    setIsDownloading(true);
    // Simulate complex PDF generation process
    setTimeout(() => {
      alert("Se ha descargado el archivo: 'Expediente_Legal_Justino.pdf'");
      setIsDownloading(false);
    }, 2000);
  };

  useEffect(() => {
    const saved = localStorage.getItem('justino_summary');
    if (saved) {
      setSummary(JSON.parse(saved));
    } else if (messages.length > 2) {
      handleGenerateSummary();
    }
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-navy-900 mb-2">Historia del Caso</h2>
            <p className="text-slate-500">Justino recuerda y organiza cada detalle de tu situación.</p>
          </div>
          
          <button 
            onClick={handleGenerateSummary}
            disabled={isLoading || messages.length < 2 || isClosed}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Analizando...' : 'Actualizar Memoria'}
          </button>
        </div>

        {!summary ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed mb-10">
             <BrainCircuit className="w-16 h-16 text-slate-300 mb-4" />
             <p className="text-slate-400 font-medium">Inicia una conversación para generar un resumen.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Antecedents Card */}
            <div className={`bg-white rounded-2xl p-6 shadow-sm border transition-colors ${isClosed ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-navy-900">Antecedentes Detectados</h3>
              </div>
              
              <ul className="space-y-4">
                {summary.antecedents.length > 0 ? (
                  summary.antecedents.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-600 text-sm leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                      {item}
                    </li>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm italic">Faltan datos para establecer antecedentes.</p>
                )}
              </ul>
            </div>

            {/* Actions Card */}
            <div className={`bg-white rounded-2xl p-6 shadow-sm border transition-colors ${isClosed ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-navy-900">Acciones Recomendadas</h3>
              </div>
              
              <ul className="space-y-4">
                {summary.recommendedActions.length > 0 ? (
                   summary.recommendedActions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-600 text-sm leading-relaxed">
                      <div className="mt-0.5 w-5 h-5 rounded-full border border-emerald-200 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-emerald-600">{idx + 1}</span>
                      </div>
                      {item}
                    </li>
                  ))
                ) : (
                   <p className="text-slate-400 text-sm italic">Justino aún está analizando la mejor ruta.</p>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Closure Zone */}
        <div className="border-t border-slate-200 pt-10">
          {!isClosed ? (
            <div className="bg-slate-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                  <Archive className="w-5 h-5" />
                  ¿Caso Finalizado?
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Al cerrar el caso, generaremos tu expediente final para descarga.
                </p>
              </div>
              <button 
                onClick={onCloseCase}
                className="px-6 py-3 bg-navy-900 text-white font-semibold rounded-xl hover:bg-navy-800 transition-colors"
              >
                Dar por Cerrado
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in-up">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Archive className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-emerald-800">Este caso ha sido cerrado satisfactoriamente.</h3>
                <p className="text-emerald-600 text-sm mt-1">Ya puedes descargar tu expediente completo.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={handleDownloadPack}
                  disabled={isDownloading}
                  className="p-6 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center text-center group"
                >
                  <Download className={`w-8 h-8 text-navy-900 mb-3 group-hover:scale-110 transition-transform ${isDownloading ? 'animate-bounce' : ''}`} />
                  <span className="font-bold text-navy-900">Descargar Todo</span>
                  <span className="text-xs text-slate-500 mt-1">Historial, Chats y Documentos (PDF)</span>
                </button>

                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-6 bg-white border border-red-100 rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors flex flex-col items-center text-center group"
                >
                  <Trash2 className="w-8 h-8 text-red-500 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-red-600">Eliminar Caso</span>
                  <span className="text-xs text-red-400 mt-1">Borrar todos los datos permanentemente</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-navy-900 mb-2">¿Estás absolutamente seguro?</h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Esta acción es irreversible ("Botón Nuclear"). Se borrarán todos tus chats, documentos y datos personales de este dispositivo. 
                <br/><br/>
                <strong>No conservamos copias en la nube.</strong> Si no has descargado tu expediente, lo perderás para siempre.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button 
                  onClick={onWipeData}
                  className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700"
                >
                  Sí, Eliminar Todo
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};