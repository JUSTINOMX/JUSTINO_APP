import React from 'react';
import { FileText, Download, Lock, File, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
import { VaultFile } from '../types';

interface VaultProps {
  files: VaultFile[];
}

// Define window interface to access loaded scripts
interface CustomWindow extends Window {
  jspdf: any;
}
declare const window: CustomWindow;

export const Vault: React.FC<VaultProps> = ({ files }) => {
  
  const downloadGeneratedPDF = (rawTitle: string, rawContent: string) => {
    if (window.jspdf) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Clean raw title and content from asterisks and long number sequences
      const cleanTitle = rawTitle.replace(/\*\*/g, '').replace(/\*/g, '').trim();
      let cleanContent = rawContent.replace(/\*\*/g, '').replace(/\*/g, '');
      // Strip out long comma-separated number sequences
      cleanContent = cleanContent.replace(/(?:\b\d+,\s*){5,}\b\d+\b/g, '1, 2, 14, 16, 20');
      cleanContent = cleanContent.replace(/,\s*,/g, ',').replace(/,\s*( de| por| en| con| a| que)\b/gi, '$1');
      // Replace any bracketed date placeholder with formatted Mexican date
      const todayFormatted = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
      cleanContent = cleanContent.replace(/\[\s*fecha[^\]]*\]?/gi, todayFormatted);
      
      // Header Background - Elegant Dark Blue
      doc.setFillColor(15, 23, 42); // Navy 900
      doc.rect(0, 0, 210, 40, 'F');

      // Header Text
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("EXPEDIENTE LEGAL", 15, 22);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text(`ID TRANSACCIÓN: ${Math.random().toString(36).substring(7).toUpperCase()}`, 15, 30);
      doc.text(`FECHA DE EMISIÓN: ${new Date().toLocaleString('es-MX').toUpperCase()}`, 130, 22);
      
      // Title Section (wrapped to prevent overflow)
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(cleanTitle.toUpperCase(), 170);
      doc.text(titleLines, 15, 50);
      
      const titleEndY = 50 + (titleLines.length * 7);
      
      // Content Area
      doc.setFontSize(10.5);
      doc.setFont("times", "normal");
      doc.setTextColor(30, 30, 30);
      
      const margins = { top: titleEndY + 6, bottom: 25, left: 20, width: 170 };
      const splitText = doc.splitTextToSize(cleanContent, margins.width);
      
      let cursorY = margins.top;
      const pageHeight = doc.internal.pageSize.height;
      const lineHeight = 6;

      splitText.forEach((line: string) => {
        if (cursorY > pageHeight - margins.bottom) {
            doc.addPage();
            cursorY = 25;
            // Background for new pages is white by default
        }
        
        // Detect "UBICACIÓN DE ENTREGA" to style it slightly different
        if (line.includes("UBICACIÓN DE ENTREGA FÍSICA:")) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(16, 185, 129); // Emerald 500
        } else if (line.includes("---")) {
            doc.setDrawColor(226, 232, 240); // Slate 200
            doc.line(margins.left, cursorY - 1, margins.left + margins.width, cursorY - 1);
        } else {
            doc.setFont("times", "normal");
            doc.setTextColor(30, 30, 30);
        }

        doc.text(line, margins.left, cursorY);
        cursorY += lineHeight;
      });
      
      // Signature placeholder at the end
      if (cursorY > pageHeight - 60) {
          doc.addPage();
          cursorY = 40;
      }
      
      cursorY += 20;
      doc.setDrawColor(0, 0, 0);
      doc.line(70, cursorY, 140, cursorY);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("FIRMA DEL INTERESADO", 85, cursorY + 5);

      doc.save(`${cleanTitle.replace(/\s+/g, '_')}.pdf`);
    } else {
      alert("Error: El generador de PDF no está listo. Intenta recargar la página.");
    }
  };

  const downloadUploadedFile = async (file: VaultFile) => {
    try {
        if (file.url) {
            // Direct download from Supabase Storage
            const link = document.createElement("a");
            link.href = file.url;
            link.download = file.name;
            link.target = "_blank";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        // Fallback to legacy base64 download if URL is missing
        const content = file.content || "";
        const mimeType = file.type;
        const name = file.name;
        
        const link = document.createElement("a");
        if (content.startsWith('data:')) {
            link.href = content;
        } else {
             link.href = `data:${mimeType};base64,${content}`;
             if (mimeType === 'text/plain') {
                 link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
             }
        }
        
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Download failed", e);
        alert("No se pudo descargar el archivo.");
    }
  };

  const getIconForType = (type: string, origin: string) => {
      if (origin === 'generated') return <FileText className="w-6 h-6 text-red-500" />;
      if (type.includes('pdf')) return <FileText className="w-6 h-6 text-red-400" />;
      if (type.includes('sheet') || type.includes('excel')) return <FileSpreadsheet className="w-6 h-6 text-emerald-500" />;
      if (type.includes('image')) return <ImageIcon className="w-6 h-6 text-blue-500" />;
      return <File className="w-6 h-6 text-slate-400" />;
  };

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-navy-900 mb-2">Mi Bóveda</h2>
        <p className="text-slate-500 mb-8">Tus documentos generados y evidencias subidas.</p>

        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-2xl bg-white/50">
            <Lock className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Aún no hay documentos.</p>
            <p className="text-sm text-slate-400 mt-2">Los archivos que generes o subas en el chat aparecerán aquí.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file) => (
              <div key={file.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group animate-fade-in-up">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${file.origin === 'generated' ? 'bg-red-50' : 'bg-blue-50'}`}>
                    {getIconForType(file.type, file.origin)}
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${file.origin === 'generated' ? 'text-emerald-600 bg-emerald-100' : 'text-blue-600 bg-blue-100'}`}>
                    {file.origin === 'generated' ? 'Oficial' : 'Evidencia'}
                  </span>
                </div>
                
                <h3 className="font-semibold text-navy-900 mb-1 truncate" title={file.name}>{file.name}</h3>
                <p className="text-xs text-slate-400 mb-6 font-mono truncate">{file.type}</p>
                <p className="text-xs text-slate-400 mb-2">Fecha: {new Date(file.date).toLocaleDateString()}</p>
                
                <button 
                  onClick={() => {
                      if (file.origin === 'generated') {
                          downloadGeneratedPDF(file.name, file.content || "");
                      } else {
                          downloadUploadedFile(file);
                      }
                  }}
                  className="w-full py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-navy-900 hover:border-navy-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};