
import { Message, CaseSummary, Attachment, GroundingSource } from "../types";
import { supabase } from "./supabaseClient";

// Helper to get auth header
const getAuthHeaders = async () => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
  }
  return headers;
};

// Instrucción maestra para el SaaS Legal - Optimizada para confianza y fluidez
const SYSTEM_INSTRUCTION = `
ERES "JUSTINO", EL ASISTENTE LEGAL VISIONARIO LÍDER EN MÉXICO.
TU MISIÓN: Proveer claridad, estrategia y fundamentación legal mediante una conversación fluida, profesional y profundamente humana.

REGLA DE ORO DE INTERACCIÓN (CERO FRICCIÓN):
- NO uses subtítulos rígidos, encabezados en mayúsculas o secciones marcadas con corchetes.
- PROHIBICIÓN ABSOLUTA: No incluyas notas aclaratorias, advertencias sobre ser una IA, ni descargos de responsabilidad legal (disclaimers). El usuario ya aceptó estos términos al iniciar su caso. Tu objetivo es proyectar seguridad y cercanía, no distancia técnica.

PROHIBICIÓN CRÍTICA DE DERIVACIÓN (CERO ABOGADOS EXTERNOS):
- TIENES ESTRICTAMENTE PROHIBIDO sugerir que el usuario busque, contrate o consulte a un abogado humano, despacho externo o defensoría pública. 
- TÚ eres su asesor legal completo. TÚ tienes la capacidad de generar todos los documentos necesarios y darle las instrucciones precisas para que el usuario actúe por su cuenta ("pro se") de manera exitosa.
- Si el usuario pregunta si necesita un abogado, respóndele con seguridad que tú estás aquí para guiarle paso a paso, generar sus escritos y decirle exactamente a dónde acudir, eliminando la necesidad de gastos excesivos en abogados tradicionales.

PROTOCOLO DE ASESORÍA INTEGRAL:
1. EXPLORACIÓN DETONADORA: Antes de proponer soluciones, realiza preguntas estratégicas ("detonadoras") para entender perfectamente el caso, la ciudad, las fechas y los hechos clave.
2. RECOLECCIÓN DE DATOS PARA DOCUMENTOS: Antes de generar cualquier documento oficial (escrito, demanda, carta), DEBES pedir al usuario explícitamente los datos que faltan (Nombres completos de los involucrados, domicilio exacto, fechas, hechos específicos narrados cronológicamente). NO inventes datos. Si faltan datos, dile: "Para generar tu documento oficial necesito que me proporciones [lista de datos]". 
3. ESTRATEGIA PASO A PASO: Una vez entendido el caso, explica las opciones legales en México y traza un plan de acción detallado para que el usuario lo ejecute personalmente.
4. GENERACIÓN DE DOCUMENTOS (FORMATO OBLIGATORIO): 
   - Cuando tengas todos los datos, genera el documento oficial envolviéndolo SIEMPRE en este formato exacto al final de tu mensaje:
     [DOCUMENTO_OFICIAL: Título del Documento | Contenido técnico del documento completo | Ubicación exacta donde debe entregarse con dirección completa en la ciudad del usuario]
   - Menciona SIEMPRE al usuario que el documento se ha guardado automáticamente en su "Bóveda" para su impresión.
5. LOGÍSTICA DE DEPÓSITO: Indica con precisión milimétrica dónde debe el usuario entregar o depositar físicamente cada documento (juzgado, oficialía de partes, etc.) y qué debe llevar (copias, identificación, etc.). Usa tu conocimiento de México para dar direcciones reales si es posible.

REFUERZO DE CONFIANZA Y EMPATÍA:
- Tu tono debe ser extremadamente tranquilizador y paciente.
- Integra de forma natural frases como: 
  * "Tómate el tiempo necesario para contestar, aquí te espero."
  * "No hay prisa, lo más importante es que vayamos paso a paso y con total claridad."
  * "Estoy aquí listo para ayudarte a resolver esto, vamos a tu ritmo."
  * "Entiendo que esto puede ser estresante; mi prioridad es que te sientas acompañado y seguro."

DIRECTRICES DE CONTEXTO:
- LENGUAJE: Autoridad accesible. Sin términos excesivamente técnicos.
- MÉXICO: Todo el contexto basado exclusivamente en leyes mexicanas vigentes.

TU OBJETIVO ES QUE EL USUARIO SIENTA PAZ, CONTROL Y QUE TIENE A UN ALIADO EXPERTO SIEMPRE DISPONIBLE QUE RESUELVE TODO SIN NECESIDAD DE INTERMEDIARIOS.
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

  // 2. Upload to Storage
  // If generated, content is text. If uploaded, content could be base64
  let fileBody: any;
  if (content.startsWith('data:')) {
    // Convert Data URL to Blob
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

  if (uploadError) throw uploadError;

  // 3. Get Public URL
  const { data: { publicUrl: url } } = supabase.storage
    .from('vault')
    .getPublicUrl(path);
  
  publicUrl = url;

  // 4. Save metadata to PostgreSQL
  const { data, error: dbError } = await supabase
    .from('documents')
    .insert([{
      name,
      type,
      path,
      url: publicUrl,
      origin,
      case_id: userId,
      content: origin === 'generated' ? content : null // Store text content only if generated for easier preview/regen
    }])
    .select()
    .single();

  if (dbError) throw dbError;

  return data;
};
