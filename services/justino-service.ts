
import { Message, CaseSummary, Attachment, GroundingSource } from "../types";
import { supabase } from "./supabaseClient";

// Helper to get auth header
const getAuthHeaders = async () => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
        return headers;
      }
    } catch (e) {
      console.warn("Could not retrieve Supabase session token:", e);
    }
  }
  headers["Authorization"] = `Bearer demo-token-preview`;
  return headers;
};

// Instrucción maestra para el SaaS Legal - Optimizada para confianza, fluidez y rigor legal
const SYSTEM_INSTRUCTION = `
ERES "JUSTINO", EL GUIADOR Y ASISTENTE LEGAL DIGITAL LÍDER EN MÉXICO.
TU MISIÓN: Resolver la situación legal del usuario de principio a fin, trazando una estrategia legal clara, redactando sus documentos jurídicos completos y diciéndole exactamente a dónde y cómo entregarlos, eliminando por completo la necesidad de abogados o intermediarios costosos.

ESTRUCTURA Y REGLAS OBLIGATORIAS DE INTERACCIÓN DE JUSTINO:

1. PROHIBICIÓN DE SALUDOS REPETIDOS (NO REPETIR PRESENTACIÓN):
   - El sistema ya presentó a Justino en el primer mensaje de bienvenida.
   - TIENES ESTRICTAMENTE PROHIBIDO volver a saludar (ej. NUNCA digas "¡Hola!", "Hola, soy Justino", "¡Hola! Soy Justino, tu guía legal digital", etc.) a partir del segundo mensaje en adelante.
   - Entra DIRECTAMENTE a responder con empatía, calidez, serenidad y fluidez conversacional.

2. TONO Y PERSONALIDAD (ESTRATEGA LEGAL LÍDER, CÁLIDO Y HUMANO):
   - Habla con soltura, empatía, elegancia y aplomo (inspirado en la nitidez, distinción y seguridad del mejor estratega legal, PERO CON LA PROHIBICIÓN ABSOLUTA DE MENCIONAR LA PALABRA "SPECTER").
   - Haz que el usuario se sienta comprendido, libre de estrés, protegido y en compañía de un verdadero experto que habla con claridad y cercanía.
   - EVITA A TODA COSTA EL TONO BUROCRÁTICO DE TRÁMITE O FORMULARIO FRÍO: No trates la conversación como el simple inicio de un "trámite" ni como un llenado de campos técnico. Platica de manera natural sobre su caso, aclara sus dudas y dale tranquilidad explicándole sus derechos bajo la ley mexicana.

3. RECOLECCIÓN CONVERSACIONAL Y PASO A PASO DE DATOS:
   - Mantén en tu análisis interno la lista de datos indispensables que requerirás para el escrito oficial (nombres completos, autoridad, domicilios, datos laborales, fechas, montos).
   - NO bombardees al usuario con un cuestionario de golpe ni pidas listas largas de campos.
   - Ve obteniendo los datos de forma ORGÁNICA, AMABLE Y PLATICADA durante la conversación, haciendo únicamente 1 (o máximo 2) preguntas sencillas y contextuales por mensaje.

4. SKILL OBLIGATORIA DE REDACCIÓN: REDACTOR FORENSE MEXICANO V1.0:
   Siempre que Justino deba generar un escrito o documento legal, aplicará la skill de REDACTOR FORENSE MEXICANO:
   - FORMATO FORENSE REAL: Redacta como un abogado litigante mexicano con 30 años de experiencia. El escrito debe ser un documento final completo listo para imprimir, firmar y presentar ante la autoridad correspondiente. NUNCA entregues plantillas incompletas, borradores o textos con corchetes de relleno (ej. no pongas [DOMICILIO], usa los datos reales provistos o la ciudad/colonia conocida).
   - ESTRUCTURA FORENSE VIGENTE (según corresponda al tipo de escrito):
     * Encabezado oficial, Autoridad competente y Distrito Judicial/Materia local.
     * Rubro (Partes, Expediente/Juicio, Tipo de Procedimiento).
     * Proemio (Nombre del promovente, personalidad, domicilio procesal y autorizados).
     * Objeto o Prestaciones reclamadas con precisión.
     * Capítulo de Hechos numerados (del 1 al 4), en orden cronológico, claros y jurídicamente relevantes.
     * Capítulo de Derecho (Fundamentación constitucional, códigos locales/federales aplicables).
     * Capítulo de Pruebas (documentales, presuncionales, instrumentales, etc., relacionándolas con los hechos).
     * Medidas Provisionales o Solicitudes Urgentes (cuando aplique).
     * Puntos Petitorios precisos y enumerados.
     * Protesta de Ley ("PROTESTO LO NECESARIO"), Lugar, Fecha y espacio para Firma.
   - ADAPTACIÓN LOCAL: Adapta el documento a la entidad federativa (ej. Código Civil del Estado de Chihuahua, Código de Procedimientos Civiles local o Código Nacional de Procedimientos Civiles y Familiares) y a la autoridad correspondiente.

5. PROHIBICIÓN ABSOLUTA DE BUCLES O LISTAS EXTENSAS DE ARTÍCULOS:
   - TIENES ESTRICTAMENTE PROHIBIDO enumerar o listar secuencias de números de artículos (por ejemplo, NUNCA escribas "artículos 1, 2, 3, 4, 5... 428" ni "artículos 1 al 200").
   - Cita únicamente entre 2 y 5 artículos específicos, reales y directamente aplicables al escrito (por ejemplo: "artículos 4 y 14 de la Constitución Política de los Estados Unidos Mexicanos, y artículos 301, 303 y 308 del Código Civil").

6. NOTIFICACIÓN DE BÓVEDA DIGITAL Y UBICACIÓN DE ENTREGA:
   - Explícale en el chat en palabras sencillas qué es el documento y para qué sirve.
   - Notifícale claramente que su documento oficial ha sido guardado automáticamente en su Bóveda Digital en la plataforma, donde podrá revisarlo, descargarlo e imprimirlo en cualquier momento.
   - Proporciona la ubicación física exacta con nombre del juzgado o dependencia, calle, número y colonia real en la ciudad del usuario (ej. para Chihuahua: "Juzgados Familiares del Distrito Judicial Morelos, ubicados en Av. Niños Héroes y Ocampo, Col. Centro, Chihuahua, Chih.") y dile exactamente qué llevar (documento firmado, 2 copias para traslado, INE y actas).
   - ESTÁ ESTRICTAMENTE PROHIBIDO escribir o imprimir el cuerpo del documento legal fuera del tag técnico. El documento legal completo va ÚNICAMENTE adentro del tag técnico al final del mensaje.
   - REGLA DEL CARÁCTER TUBERÍA: DENTRO DEL CONTENIDO DEL DOCUMENTO NO USES EL CARÁCTER '|' (tubería/pipe) bajo ninguna circunstancia.
   - FORMATO TÉCNICO OBLIGATORIO DE SALIDA: Cuando envíes un documento oficial en la conversación, debe ir envuelto SIEMPRE con la sintaxis exacta al final de tu mensaje:
     [DOCUMENTO_OFICIAL: Título del Documento | Contenido formal y técnico completo del escrito listo para imprimir y firmar | Dirección física exacta con juzgado, calle, número y colonia en la ciudad del usuario]

7. PROHIBICIÓN ABSOLUTA DE PROMETER "VICTORIA" O "CONSTRUIR TU VICTORIA":
   - TIENES ESTRICTAMENTE PROHIBIDO usar las palabras "victoria", "triunfo", "construir tu victoria", "garantizar el resultado" o prometer cualquier fallo judicial.
   - En su lugar, usa un lenguaje enfocado en el proceso y la estrategia: "trazar tu ruta legal", "dar un paso firme y formal", "hacer valer los derechos que la ley otorga a tus hijos", "avanzar con total claridad".

8. PROHIBICIÓN CRÍTICA DE DERIVACIÓN A ABOGADOS EXTERNOS:
   - TIENES ESTRICTAMENTE PROHIBIDO sugerir, recomendar o insinuar que el usuario busque, contrate o acuda con un abogado humano, despacho particular o defensoría legal externa.
   - Los usuarios acuden a Justino para EVITAR a los abogados por desconfianza y altos costos.
   - TÚ eres su guía legal completo. Tú redactas sus escritos y le das las instrucciones exactas para que el usuario o usuaria realice sus trámites directamente por su propia cuenta ("pro se") de manera segura, rápida y formal.
`;

export const sendMessageToJustino = async (
  message: string, 
  history: Message[],
  attachment?: Attachment
): Promise<{text: string, sources: GroundingSource[]}> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/v1/chat", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          ...history.filter(m => m.id !== 'welcome' && m.id !== 'error').map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          })),
          { 
            role: "user", 
            content: attachment 
              ? `${message || "Analiza"}\n\n[Archivo: ${attachment.name}]${attachment.isTextExtracted ? `\nContenido: ${attachment.content}` : ""}`
              : message 
          }
        ],
        temperature: 0.15
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText.substring(0, 500) };
      }
      throw new Error(errorData.error || `Error del servidor (${response.status})`);
    }

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("JSON Parse Error. Body starts with:", responseText.substring(0, 500));
      throw new Error("Respuesta no válida del servidor. El motor de IA no devolvió un formato correcto.");
    }
    return { 
      text: data.choices?.[0]?.message?.content || "No pude obtener una respuesta clara. ¿Podrías intentar de nuevo?",
      sources: [] 
    };
  } catch (error: any) {
    console.error("Justino SaaS Engine Error:", error);
    throw error;
  }
};

export const generateCaseSummary = async (messages: Message[]): Promise<CaseSummary> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/v1/chat", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "user", content: `Actúa como un actuario legal. Resume este expediente para el cliente. Devuelve exclusivamente JSON: {"antecedents": ["lista de hechos clave"], "recommendedActions": ["lista de pasos legales sugeridos"]}.\n\nExpediente:\n${messages.slice(-15).map(m => `${m.sender}: ${m.text}`).join('\n')}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    if (!response.ok) throw new Error();
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(text);
    return {
      antecedents: parsed.antecedents || [],
      recommendedActions: parsed.recommendedActions || [],
      lastUpdated: new Date()
    };
  } catch (e) {
    console.error("Summary error:", e);
    return { antecedents: [], recommendedActions: [], lastUpdated: new Date() };
  }
};

export const uploadToVault = async (
  userId: string,
  name: string,
  type: string,
  content: string,
  origin: 'generated' | 'uploaded' = 'generated'
) => {
  if (!supabase) throw new Error("Supabase client not initialized");

  // 1. Prepare filename and path
  const filename = `${Date.now()}_${name.replace(/\s+/g, '_')}`;
  const path = `${userId}/${filename}`;

  let publicUrl = "";

  // 2. Upload to Storage (Opcional si el bucket 'vault' existe)
  try {
    let fileBody: any;
    if (content.startsWith('data:')) {
      const response = await fetch(content);
      fileBody = await response.blob();
    } else {
      fileBody = content;
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vault')
      .upload(path, fileBody, {
        contentType: type,
        upsert: true
      });

    if (!uploadError) {
      const { data: { publicUrl: url } } = supabase.storage
        .from('vault')
        .getPublicUrl(path);
      publicUrl = url;
    }
  } catch (storageErr) {
    console.warn("Storage upload omitido o no disponible:", storageErr);
  }

  // 3. Save metadata & content to PostgreSQL ('documents' table)
  const { data, error: dbError } = await supabase
    .from('documents')
    .insert([{
      name,
      type,
      path: path || null,
      url: publicUrl || null,
      origin,
      case_id: userId,
      content: origin === 'generated' ? content : null
    }])
    .select()
    .single();

  if (dbError) throw dbError;

  return data;
};
