import { GoogleGenAI } from "@google/genai";

const JUSTINO_SYSTEM_PROMPT = `ERES "JUSTINO", EL GUIADOR Y ASISTENTE LEGAL DIGITAL LÍDER EN MÉXICO.
TU MISIÓN: Resolver la situación legal del usuario de principio a fin, trazando una estrategia legal clara, redactando sus documentos jurídicos completos y diciéndole exactamente a dónde y cómo entregarlos, eliminando por completo la necesidad de abogados o intermediarios costosos.

ESTRUCTURA Y REGLAS OBLIGATORIAS DE INTERACCIÓN DE JUSTINO:

1. PROHIBICIÓN DE SALUDOS REPETIDOS (NO REPETIR PRESENTACIÓN):
   - El sistema ya presentó a Justino en el primer mensaje de bienvenida.
   - TIENES ESTRICTAMENTE PROHIBIDO volver a saludar (ej. NUNCA digas "¡Hola!", "Hola, soy Justino", "¡Hola! Soy Justino, tu guía legal digital", etc.) a partir del segundo mensaje en adelante.
   - Entra DIRECTAMENTE a responder con empatía, calidez, serenidad y fluidez conversacional.

2. TONO Y PERSONALIDAD (ESTRATEGA LEGAL LÍDER, CÁLIDO Y HUMANO):
   - Habla con soltura, empatía, elegancia y aplomo (inspirado en la nitidez, distinción y seguridad del mejor estratega legal, PERO CON LA PROHIBICIÓN ABSOLUTA DE MENCIONAR LA PALABRA "SPECTER").
   - Haz que el usuario se siente comprendido, libre de estrés, protegido y en compañía de un verdadero experto que habla con claridad y cercanía.
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

export async function generateResponse(userMessages: any[]) {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const moonshotKey = process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  
  // Reconstruct the payload with the server-side system prompt
  const secureMessages = [
    { role: 'system', content: JUSTINO_SYSTEM_PROMPT },
    ...userMessages.filter(m => m.role === 'user' || m.role === 'assistant').slice(-10) // Limit context for safety and cost
  ];

  const hasDeepSeek = deepseekKey && deepseekKey.trim().length > 5;
  const hasMoonshot = moonshotKey && moonshotKey.trim().length > 5;
  const hasGemini = geminiKey && geminiKey.trim().length > 5;

  let lastError = "No se encontraron llaves de API válidas configuradas en el servidor.";

  // 1. Intentar con DeepSeek (Prioridad 1 - Default)
  if (hasDeepSeek) {
    try {
      const sanitizedKey = deepseekKey.trim();
      console.log(`[AI Provider] Intentando solicitud a DeepSeek API...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sanitizedKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: secureMessages,
          temperature: 0.3,
          max_tokens: 4000
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log("[AI Provider] Respuesta exitosa recibida de DeepSeek.");
        return await response.json();
      }
      
      const errText = await response.text();
      console.error(`[AI Provider] DeepSeek Error (${response.status}): ${errText}`);
      lastError = `DeepSeek Error (${response.status}): ${errText.substring(0, 150)}`;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("[AI Provider] DeepSeek Timeout (12s) - probando siguiente proveedor...");
        lastError = "DeepSeek Timeout (12s)";
      } else {
        console.error("[AI Provider] Excepción al conectar con DeepSeek:", error);
        lastError = `DeepSeek Connection Error: ${error.message}`;
      }
    }
  }

  // 2. Fallback a Kimi / Moonshot (Prioridad 2)
  if (hasMoonshot) {
    try {
      const sanitizedKey = moonshotKey.trim();
      console.log("[AI Provider] DeepSeek no disponible, intentando Kimi / Moonshot...");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sanitizedKey}`
        },
        body: JSON.stringify({
          model: "moonshot-v1-8k",
          messages: secureMessages,
          temperature: 0.3,
          max_tokens: 4000
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log("[AI Provider] Respuesta exitosa recibida de Kimi / Moonshot.");
        return await response.json();
      }
      
      const errText = await response.text();
      console.error(`[AI Provider] Kimi/Moonshot Error (${response.status}): ${errText}`);
      lastError = `Kimi/Moonshot Error (${response.status}): ${errText.substring(0, 100)}`;
    } catch (error: any) {
      console.error("[AI Provider] Kimi/Moonshot Fallback Error:", error);
      lastError = `Kimi Error: ${error.message}`;
    }
  }

  // 3. Fallback a Gemini (Prioridad 3)
  if (hasGemini) {
    try {
      console.log("[AI Provider] DeepSeek y Kimi no disponibles, intentando Gemini...");
      const genAI = new GoogleGenAI({ apiKey: geminiKey!.trim() });
      
      const chatMessages = secureMessages.filter((m: any) => m.role !== 'system');
      const history = chatMessages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));
      const lastMsg = chatMessages[chatMessages.length - 1]?.content || "";

      let text = "";
      try {
        const result = await genAI.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [...history, { role: 'user', parts: [{ text: lastMsg }] }],
          config: {
            systemInstruction: JUSTINO_SYSTEM_PROMPT,
            temperature: 0.3,
            maxOutputTokens: 4000,
          }
        });
        text = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } catch (gErr: any) {
        console.warn("[AI Provider] gemini-2.5-flash fallo, probando gemini-2.0-flash...", gErr.message);
        const result = await genAI.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [...history, { role: 'user', parts: [{ text: lastMsg }] }],
          config: {
            systemInstruction: JUSTINO_SYSTEM_PROMPT,
            temperature: 0.3,
            maxOutputTokens: 4000,
          }
        });
        text = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }

      if (text) {
        console.log("[AI Provider] Respuesta exitosa recibida de Gemini.");
        return {
          choices: [{
            message: { content: text },
            finish_reason: "stop"
          }]
        };
      }
    } catch (error: any) {
      console.error("[AI Provider] Gemini Fallback Error:", error);
      lastError = `Gemini connection: ${error.message}`;
    }
  }

  throw new Error(`Error en el motor de IA: ${lastError}`);
}
