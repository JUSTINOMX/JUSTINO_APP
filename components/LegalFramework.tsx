import React from 'react';
import { Scale, ShieldAlert, BookOpen, AlertTriangle } from 'lucide-react';

export const LegalFramework: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header>
          <h2 className="text-3xl font-bold text-navy-900 mb-2 flex items-center gap-3">
            <Scale className="w-8 h-8 text-navy-900" />
            Marco Legal y Responsabilidad
          </h2>
          <p className="text-slate-500">
            Fundamentos jurídicos de operación y limitación de responsabilidad de Justino AI.
          </p>
        </header>

        {/* Legal Basis */}
        <section className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-navy-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            1. Fundamento Legal de Operación
          </h3>
          <div className="prose prose-slate text-sm text-slate-600 space-y-4">
            <p>
              Justino opera bajo el principio de <strong>Libertad de Información</strong> y el derecho al acceso a la cultura jurídica. No sustituye la representación de un abogado titulado en tribunales, sino que actúa como una herramienta tecnológica de asistencia informativa y generativa.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Artículo 5 de la Constitución Política de los Estados Unidos Mexicanos:</strong> 
                El ejercicio de profesiones está regulado, sin embargo, Justino no se ostenta como un "Licenciado en Derecho" humano, sino como un software de procesamiento de lenguaje natural que provee información jurídica pública.
              </li>
              <li>
                <strong>Derecho a la Información:</strong> 
                Facilitamos el acceso a leyes, códigos y procedimientos que son de dominio público, democratizando el conocimiento legal.
              </li>
            </ul>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="bg-white rounded-2xl p-8 border border-red-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -mr-10 -mt-10 z-0"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              2. Exención de Responsabilidad (Disclaimer)
            </h3>
            
            <div className="p-4 bg-red-50 rounded-xl border border-red-100 mb-6">
              <p className="text-red-800 font-semibold text-sm">
                AL UTILIZAR ESTE SISTEMA, USTED RECONOCE QUE JUSTINO ES UNA INTELIGENCIA ARTIFICIAL, NO UN SER HUMANO.
              </p>
            </div>

            <div className="space-y-4 text-sm text-slate-700">
              <p>
                <strong>A. Naturaleza del Servicio:</strong> El usuario entiende y acepta que las respuestas, documentos y estrategias generadas son producto de algoritmos probabilísticos. Aunque entrenados con legislación vigente, pueden contener imprecisiones, alucinaciones o desactualizaciones.
              </p>
              <p>
                <strong>B. Obligación de Medios:</strong> La empresa proveedora de Justino se compromete a una obligación de medios (proveer la tecnología disponible), nunca a una obligación de resultados (ganar un caso). El éxito legal depende de factores externos (jueces, contrapartes, pruebas).
              </p>
              <p>
                <strong>C. Uso de Documentos:</strong> Los documentos generados son borradores ("propuestas"). Es responsabilidad exclusiva del usuario revisarlos, editarlos y, en su caso, validarlos con un profesional humano antes de firmarlos o presentarlos ante autoridad.
              </p>
              <p>
                <strong>D. Liberación de Responsabilidad:</strong> El usuario libera a Justino, sus desarrolladores y afiliados de cualquier responsabilidad civil, penal o administrativa derivada del uso directo o indirecto de la información proporcionada.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy Note */}
        <section className="bg-navy-900 rounded-2xl p-8 text-white">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            3. Privacidad y Eliminación de Datos
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Justino practica una política de <strong>Minimización de Datos</strong>. Al cerrar su caso, se le ofrecerá la opción de eliminar permanentemente toda la información de su dispositivo y nuestros registros temporales. 
            <br/><br/>
            Si usted opta por la eliminación ("Botón Nuclear"), entiende que <strong>no existirá forma técnica de recuperar su expediente</strong>, ni siquiera bajo orden judicial, ya que no mantenemos copias ocultas. Esto protege su privacidad, pero también elimina evidencia de la asesoría recibida.
          </p>
        </section>

      </div>
    </div>
  );
};