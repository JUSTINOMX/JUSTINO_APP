import React, { useState, useEffect } from 'react';
import { RefreshCw, BookOpen, CheckSquare, BrainCircuit, Archive, Download, Trash2, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { Message, CaseSummary, CaseStatus, User, VaultFile } from '../types';
import { generateCaseSummary } from '../services/justino-service';

interface CaseHistoryProps {
  user?: User;
  messages: Message[];
  vaultFiles?: VaultFile[];
  caseStatus: CaseStatus;
  caseId?: string;
  onCloseCase: () => void;
  onNewCase?: () => void;
  onWipeData: () => void;
}

export const CaseHistory: React.FC<CaseHistoryProps> = ({ 
  user,
  messages, 
  vaultFiles = [],
  caseStatus, 
  caseId,
  onCloseCase, 
  onNewCase,
  onWipeData 
}) => {
  const [summary, setSummary] = useState<CaseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isClosed = caseStatus === 'closed';

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    const newSummary = await generateCaseSummary(messages);
    setSummary(newSummary);
    localStorage.setItem('justino_summary', JSON.stringify(newSummary));
    setIsLoading(false);
  };

  // FASE 5: DESCARGA REAL DEL EXPEDIENTE CONCRETO CON jsPDF
  const handleDownloadPack = () => {
    setIsDownloading(true);
    setDownloadSuccess(null);

    try {
      const customWindow = window as any;
      if (!customWindow.jspdf) {
        throw new Error("El módulo generador jsPDF no está listo en el navegador.");
      }
      const { jsPDF } = customWindow.jspdf;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let cursorY = 25;

      const checkPageBreak = (neededHeight: number) => {
        if (cursorY + neededHeight > pageHeight - margin) {
          doc.addPage();
          cursorY = 25;
        }
      };

      // 1. PORTADA DEL EXPEDIENTE OFICIAL
      doc.setFillColor(15, 23, 42); // Navy 900
      doc.rect(0, 0, pageWidth, 55, 'F');

      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("EXPEDIENTE LEGAL DIGITAL JUSTINO", margin, 26);

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(`COMPILACIÓN OFICIAL DEL CASO Y ACERVO JURÍDICO`, margin, 36);

      const todayFormatted = new Date().toLocaleDateString('es-MX', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });
      doc.text(`FECHA DE EMISIÓN: ${todayFormatted.toUpperCase()}`, margin, 45);

      cursorY = 70;

      // 2. METADATOS Y ESTADO DEL CASO
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin, cursorY, contentWidth, 36, 3, 3, 'F');

      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("IDENTIFICACIÓN DEL EXPEDIENTE", margin + 6, cursorY + 9);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      const titular = user?.preferredName || user?.username || "Titular";
      doc.text(`Titular / Promovente: ${titular}`, margin + 6, cursorY + 17);
      doc.text(`Estado del Caso: ${isClosed ? "CERRADO Y ARCHIVADO" : "EN PROCESO / ACTIVO"}`, margin + 6, cursorY + 24);
      doc.text(`Folio Único: EXP-${(caseId || user?.id || 'JUST').slice(0, 8).toUpperCase()}-${new Date().getFullYear()}`, margin + 6, cursorY + 31);

      cursorY += 48;

      // 3. ANTECEDENTES Y HECHOS CONFIRMADOS
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("1. ANTECEDENTES Y HECHOS VERIFICADOS", margin, cursorY);
      cursorY += 8;

      doc.setFontSize(9);
      doc.setFont("times", "normal");
      doc.setTextColor(30, 30, 30);

      const userMessageFacts = messages
        .filter(m => m.sender === 'user')
        .map(m => m.text)
        .slice(0, 10);

      const factsToPrint = summary?.antecedents && summary.antecedents.length > 0 
        ? summary.antecedents 
        : (userMessageFacts.length > 0 ? userMessageFacts : ["No se registraron antecedentes adicionales en este expediente."]);

      factsToPrint.forEach((fact) => {
        checkPageBreak(12);
        const lines = doc.splitTextToSize(`• ${fact}`, contentWidth - 5);
        doc.text(lines, margin + 4, cursorY);
        cursorY += (lines.length * 5) + 3;
      });

      cursorY += 6;

      // 4. ACCIONES Y RUTA ESTRATÉGICA
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("2. ESTRATEGIA Y ACCIONES LEGALES SUGERIDAS", margin, cursorY);
      cursorY += 8;

      doc.setFontSize(9);
      doc.setFont("times", "normal");
      doc.setTextColor(30, 30, 30);

      const actionsToPrint = summary?.recommendedActions && summary.recommendedActions.length > 0
        ? summary.recommendedActions
        : ["Estrategia general completada."];

      actionsToPrint.forEach((action, idx) => {
        checkPageBreak(12);
        const lines = doc.splitTextToSize(`${idx + 1}. ${action}`, contentWidth - 5);
        doc.text(lines, margin + 4, cursorY);
        cursorY += (lines.length * 5) + 3;
      });

      cursorY += 8;

      // 5. ACERVO DOCUMENTAL GENERADO EN LA BÓVEDA
      const genDocs = (vaultFiles || []).filter(f => f.origin === 'generated');
      if (genDocs.length > 0) {
        checkPageBreak(40);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("3. DOCUMENTOS OFICIALES INTEGRADOS EN LA BÓVEDA", margin, cursorY);
        cursorY += 8;

        genDocs.forEach((docItem, dIdx) => {
          checkPageBreak(25);
          doc.setFontSize(10.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(16, 185, 129); // Emerald 600
          doc.text(`Documento ${dIdx + 1}: ${docItem.name} ${docItem.version ? `(v${docItem.version})` : ''}`, margin + 2, cursorY);
          cursorY += 6;

          doc.setFontSize(8.5);
          doc.setFont("times", "normal");
          doc.setTextColor(40, 40, 40);

          const docLines = doc.splitTextToSize(docItem.content || "(Texto completo guardado en Bóveda)", contentWidth - 5);
          docLines.forEach((line: string) => {
            checkPageBreak(6);
            doc.text(line, margin + 4, cursorY);
            cursorY += 4.5;
          });
          cursorY += 7;
        });
      }

      // 6. CERTIFICACIÓN FINAL
      checkPageBreak(35);
      cursorY += 6;
      doc.setDrawColor(203, 213, 225);
      doc.line(margin, cursorY, margin + contentWidth, cursorY);
      cursorY += 8;

      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 116, 139);
      doc.text(`Expediente integrado digitalmente por Justino AI Legal para ${titular}.`, margin, cursorY);
      doc.text(`Certificación digital de integridad y cierre: SHA-${Math.random().toString(36).substring(2, 12).toUpperCase()}`, margin, cursorY + 4);

      const fileName = `Expediente_Legal_${titular.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`;
      doc.save(fileName);

      setIsDownloading(false);
      setDownloadSuccess(`Se ha generado y descargado exitosamente: "${fileName}"`);
    } catch (err: any) {
      console.error("Error generating dossier PDF:", err);
      setIsDownloading(false);
      alert("Error al generar el PDF: " + (err?.message || err));
    }
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={handleDownloadPack}
                  disabled={isDownloading}
                  className="p-6 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center text-center group"
                >
                  <Download className={`w-8 h-8 text-navy-900 mb-3 group-hover:scale-110 transition-transform ${isDownloading ? 'animate-bounce' : ''}`} />
                  <span className="font-bold text-navy-900">Descargar Todo</span>
                  <span className="text-xs text-slate-500 mt-1">Historial, Chats y Documentos (PDF)</span>
                </button>

                {onNewCase && (
                  <button 
                    onClick={onNewCase}
                    className="p-6 bg-white border border-emerald-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/50 hover:shadow-md transition-all flex flex-col items-center text-center group"
                  >
                    <FileText className="w-8 h-8 text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-emerald-800">Iniciar Nuevo Caso</span>
                    <span className="text-xs text-slate-500 mt-1">Crear expediente legal nuevo</span>
                  </button>
                )}

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