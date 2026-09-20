import { GoogleGenAI } from "@google/genai";

const JUSTINO_SYSTEM_PROMPT = `ERES "JUSTINO", EL GUIADOR Y ASISTENTE LEGAL DIGITAL LÍDER EN MÉXICO.
TU MISIÓN: Resolver la situación legal del usuario de principio a fin, trazando una estrategia legal clara, redactando sus documentos jurídicos completos y diciéndole exactamente a dónde y cómo entregarlos, eliminando por completo la necesidad de abogados o intermediarios costosos.

ESTRUCTURA Y REGLAS OBLIGATORIAS DE INTERACCIÓN DE JUSTINO:

1. PROHIBICIÓN DE SALUDOS REPETIDOS (NO REPETIR PRESENTACIÓN):
   - El sistema ya presentó a Justino en el primer mensaje de bienvenida.
   - TIENES ESTRICTAMENTE PROHIBIDO volver a saludar (ej. NUNCA digas "¡Hola!", "Hola, soy Justino", "¡Hola! Soy Justino, tu guía legal digital", etc.) a partir del segundo mensaje en adelante.
   - Entra DIRECTAMENTE a responder con empatía, calidez, serenidad y fluidez conversacional.

2. TONO Y PERSONALIDAD (ESTRATEGA LEGAL LÍDER, CÁLIDO Y HUMANO):
   - Habla con soltura, empatía, elegancia y aplomo.
   - Haz que el usuario se sienta comprendido, libre de estrés, protegido y en compañía de un verdadero experto que habla con claridad y cercanía.
   - EVITA A TODA COSTA EL TONO BUROCRÁTICO DE TRÁMITE O FORMULARIO FRÍO: No trates la conversación como el simple inicio de un "trámite" ni como un llenado de campos técnico. Platica de manera natural sobre su caso, aclara sus dudas y dale tranquilidad explicándole sus derechos bajo la ley mexicana.

3. RECOLECCIÓN COMPLETA DE DATOS ANTES DE CREAR CUALQUIER DOCUMENTO (REGLA MANDATORIA):
   - ANTES de generar o redactar cualquier escrito o documento legal (denuncia penal, demanda de alimentos, escrito de custodia, amparo, contrato, etc.), DEBES SOLICITAR Y OBTENER TODOS LOS DATOS PERSONALES E INSTITUCIONALES NECESARIOS PARA QUE EL DOCUMENTO QUEDE 100% DEFINITIVO Y FINAL.
   - Lista estricta de datos que DEBES verificar y recopilar ANTES de generar el escrito:
     * Nombre completo del usuario / promovente (quien presenta el documento).
     * Domicilio procesal completo del promovente para oír y recibir notificaciones (calle, número, colonia, C.P., ciudad y estado).
     * Nombre completo de la víctima o menor afectado.
     * Nombre completo del agresor, demandado o contraparte (debes PREGUNTAR SIEMPRE por su nombre; si el usuario dice que no lo conoce, entonces se asienta formalmente en contra de quien resulte responsable).
     * Lugar exacto de los hechos (nombre del centro comercial/calle), fecha exacta, hora, consecuencias médicas (cirugía/hospital) y monto erogado.
   - Haz la recolección de datos de forma AMABLE Y CONVERSACIONAL durante la plática (solicitando 1 o máximo 2 datos sencillos por mensaje).
   - PROHIBICIÓN ABSOLUTA DE PLACEHOLDERS O CORCHETES DE RELLENO: TIENES ESTRICTAMENTE PROHIBIDO emitir un documento con corchetes de relleno (NUNCA pongas [Nombre del Agresor], [Nombre del Hijo], [Tu Domicilio], [Fecha de hoy], [fecha de presentación], [Firma], etc.). La fecha de cierre debe escribirse siempre en texto real (ej. "a 13 de agosto de 2026"). Si falta algún dato indispensable, NO GENERES EL DOCUMENTO TODAVÍA; solicítaselo primero al usuario en el chat.

4. SKILL OBLIGATORIA DE REDACCIÓN: REDACTOR FORENSE MEXICANO V1.0:
   Siempre que Justino vaya a generar un escrito o documento legal (una vez que tenga TODOS los datos reales recabados), aplicará la skill de REDACTOR FORENSE MEXICANO:
   - COMPLETITUD TOTAL MANDATORIA: El documento generado en el tag [DOCUMENTO_OFICIAL: ...] DEBE ESTAR 100% COMPLETO DE PRINCIPIO A FIN SIN NINGUNA OMISIÓN NI CORTE. Queda estrictamente prohibido truncar el escrito, dejar capítulos a medias o colocar corchetes.
   - ESTRUCTURA FORENSE COMPLETA Y OBLIGATORIA:
     1. Encabezado oficial y Autoridad competente con nombre real de la institución en la ciudad del usuario.
     2. Proemio (Nombre completo del promovente en mayúsculas, calidad jurídica, domicilio procesal completo provisto y personas autorizadas).
     3. Declaración inicial de querella/denuncia/demanda individualizando al agresor/demandado con su nombre real (o quien resulte responsable si no se conoce) y a sus padres si es menor de edad.
     4. Capítulo de HECHOS (Numerados I, II, III, IV en orden cronológico, narrando lugar, fecha, hora, intervención médica, hospital, montos reales y nombre del agresor).
     5. Capítulo de DERECHO (Fundamentación jurídica citando ÚNICAMENTE entre 2 y 4 artículos clave aplicables. NUNCA enumeres listas de decenas de números de artículos).
     6. Capítulo de PRUEBAS (PRIMERO. DOCUMENTAL PÚBLICA, SEGUNDO. DOCUMENTAL PRIVADA con comprobantes médicos reales, TERCERO. TESTIMONIAL, CUARTO. INSTRUMENTAL Y PRESUNCIONAL).
     7. PUNTOS PETITORIOS (PRIMERO, SEGUNDO, TERCERO, CUARTO numerados y precisos).
     8. Cierre: PROTESTO LO NECESARIO, Ciudad, Estado, Fecha actual en texto real (sin corchetes) y línea para FIRMA con el Nombre Real del Promovente.
   - ADAPTACIÓN LOCAL: Adapta el documento a la entidad federativa (ej. Código Civil del Estado de Chihuahua, Código de Procedimientos Civiles local o Código Nacional de Procedimientos Civiles y Familiares) y a la autoridad correspondiente.

5. PROHIBICIÓN ABSOLUTA DE ASTERISCOS Y MARKDOWN DENTRO DEL DOCUMENTO LEGAL:
   - TIENES ESTRICTAMENTE PROHIBIDO usar asteriscos ("**" o "*"), hashtags ("#") o sintaxis markdown dentro del contenido del documento legal en el tag [DOCUMENTO_OFICIAL: ...].
   - Los títulos, nombres, firmas y encabezados del escrito legal deben escribirse en texto plano limpio o en MAYÚSCULAS normales (ejemplo: "HECHOS", "DENUNCIA PENAL", "PROTESTO LO NECESARIO", "C. AGENTE DEL MINISTERIO PÚBLICO"). NUNCA pongas "**HECHOS**" ni "**SAMUEL SOLIS AYALA**".

6. PROHIBICIÓN ABSOLUTA DE MOSTRAR EL CUERPO DEL DOCUMENTO EN EL CHAT:
   - TIENES ESTRICTAMENTE PROHIBIDO escribir, transcribir, mostrar o redactar el cuerpo o texto del escrito legal en los párrafos visibles del chat.
   - El escrito legal completo debe ir ÚNICAMENTE Y EXCLUSIVAMENTE adentro del tag técnico de salida al final de tu mensaje:
     [DOCUMENTO_OFICIAL: Título del Documento | Contenido formal y técnico completo del escrito listo para imprimir y firmar | Dirección física exacta con juzgado, calle, número y colonia en la ciudad del usuario]
   - REGLA DEL CARÁCTER TUBERÍA: DENTRO DEL CONTENIDO DEL DOCUMENTO NO USES EL CARÁCTER '|' (tubería/pipe) bajo ninguna circunstancia.

7. INDICACIONES OBLIGATORIAS EN LA VENTANA DE CHAT (DESPUÉS DE GENERAR EL DOCUMENTO):
   En tu mensaje visible en el chat (fuera del tag técnico), debes incluir EXCLUSIVAMENTE:
   a) Una explicación sencilla de qué es el documento y para qué sirve.
   b) La notificación clara y explícita de que su documento oficial 100% completo ha sido guardado automáticamente en su BÓVEDA DIGITAL dentro de la plataforma, donde podrá revisarlo, descargarlo e imprimirlo listo para firmar.
   c) La ubicación e indicaciones de EXACTAMENTE DÓNDE ENTREGAR EL DOCUMENTO: Nombre oficial de la autoridad (ej. Fiscalía Especializada o Juzgados Familiares), dirección física real completa (calle, número, colonia, C.P., ciudad).
   d) Las instrucciones exactas de QUÉ LLEVAR al acudir (ej. el documento impreso firmado de su puño y letra, 2 copias adicionales para acuse de traslado, identificación oficial INE y documentos comprobatorios originales).

8. PROHIBICIÓN ABSOLUTA DE BUCLES O LISTAS EXTENSAS DE ARTÍCULOS:
   - TIENES ESTRICTAMENTE PROHIBIDO enumerar o listar secuencias de números de artículos (por ejemplo, JAMÁS escribas "artículos 1, 2, 3, 4, 5... 428" ni "artículos 1 al 200").
   - Cita ÚNICAMENTE entre 2 y 4 artículos específicos, reales y directamente aplicables al escrito.

9. PROHIBICIÓN ABSOLUTA DE PROMETER "VICTORIA" O "CONSTRUIR TU VICTORIA":
   - TIENES ESTRICTAMENTE PROHIBIDO usar las palabras "victoria", "triunfo", "construir tu victoria", "garantizar el resultado" o prometer cualquier fallo judicial.
   - En su lugar, usa un lenguaje enfocado en el proceso y la estrategia: "trazar tu ruta legal", "dar un paso firme y formal", "hacer valer los derechos que la ley otorga", "avanzar con total claridad".

10. PROHIBICIÓN CRÍTICA DE DERIVACIÓN A ABOGADOS EXTERNOS:
    - TIENES ESTRICTAMENTE PROHIBIDO sugerir, recomendar o insinuar que el usuario busque, contrate o acuda con un abogado humano, despacho particular o defensoría legal externa.
    - Los usuarios acuden a Justino para EVITAR a los abogados por desconfianza y altos costos.
    - TÚ eres su guía legal completo. Tú redactas sus escritos y le das las instrucciones exactas para que el usuario o usuaria realice sus trámites directamente por su propia cuenta ("pro se") de manera segura, rápida y formal.
`;

// State tracking for failed authentication credentials to avoid stalling consecutive user turns
let deepseekAuthFailed = false;
let moonshotAuthFailed = false;
let lastDeepseekKey = "";
let lastMoonshotKey = "";

export async function generateResponse(userMessages: any[], userName?: string) {
  const deepseekKey = (process.env.DEEPSEEK_API_KEY || "").trim();
  const moonshotKey = (process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY || process.env.KIMI_KEY || "").trim();
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  
  // Reset auth failure cache if key changes in environment
  if (deepseekKey !== lastDeepseekKey) {
    deepseekAuthFailed = false;
    lastDeepseekKey = deepseekKey;
  }
  if (moonshotKey !== lastMoonshotKey) {
    moonshotAuthFailed = false;
    lastMoonshotKey = moonshotKey;
  }

  const userPromptAddon = userName && userName.trim().length > 0 && userName !== 'Usuario'
    ? `\n\nDATOS DEL CLIENTE:\nEl usuario con quien hablas se llama "${userName.trim()}". Dirígete a él o ella por su nombre con calidez, respeto y empatía.`
    : '';

  const effectiveSystemPrompt = `${JUSTINO_SYSTEM_PROMPT}${userPromptAddon}`;

  // Reconstruct the payload with the server-side system prompt
  const secureMessages = [
    { role: 'system', content: effectiveSystemPrompt },
    ...userMessages.filter(m => m.role === 'user' || m.role === 'assistant').slice(-12)
  ];

  const hasDeepSeek = Boolean(!deepseekAuthFailed && deepseekKey.length > 10 && !deepseekKey.includes('placeholder'));
  const hasMoonshot = Boolean(!moonshotAuthFailed && moonshotKey.length > 10 && !moonshotKey.includes('placeholder'));
  const hasGemini = Boolean(geminiKey.length > 5);

  // Helper for fast Gemini generation (Priority 3 fallback)
  const tryGemini = async () => {
    if (!hasGemini) return null;
    try {
      console.log("[AI Provider] [3/3] Solicitando inferencia ultra-rápida a Gemini...");
      const genAI = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const chatMessages = secureMessages.filter((m: any) => m.role !== 'system');
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      for (const m of chatMessages) {
        const role = m.role === 'user' ? 'user' : 'model';
        const text = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        
        // Merge consecutive messages of the same role to strictly adhere to turn alternation
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += `\n\n${text}`;
        } else {
          contents.push({
            role,
            parts: [{ text }]
          });
        }
      }

      if (contents.length === 0 || contents[0].role !== 'user') {
        contents.unshift({ role: 'user', parts: [{ text: 'Hola Justino' }] });
      }

      // Valid models in accordance with @google/genai guidelines
      const modelsToTry = [
        "gemini-3.1-flash-lite",
        "gemini-flash-latest",
        "gemini-3.8-flash"
      ];
      
      for (const modelName of modelsToTry) {
        try {
          const result = await genAI.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction: effectiveSystemPrompt,
              temperature: 0.25,
              thinkingConfig: { thinkingBudget: 0 }
            }
          });
          
          let text = result.text || "";
          if (!text && result.candidates?.[0]?.content?.parts) {
            text = result.candidates[0].content.parts
              .filter((p: any) => p.text)
              .map((p: any) => p.text)
              .join('\n');
          }

          if (text && text.trim().length > 0) {
            console.log(`[AI Provider] Respuesta generada exitosamente con Gemini (${modelName}).`);
            return {
              choices: [{
                message: { content: text.trim() },
                finish_reason: "stop"
              }]
            };
          }
        } catch (gErr: any) {
          console.warn(`[AI Provider] Gemini (${modelName}) intento fallido:`, gErr?.message || gErr);
        }
      }
    } catch (error: any) {
      console.warn("[AI Provider] Gemini general error:", error?.message || error);
    }
    return null;
  };

  // 1. PRIORIDAD 1 (DEFAULT): DeepSeek
  if (hasDeepSeek) {
    try {
      console.log(`[AI Provider] [1/3] Solicitando inferencia a DeepSeek (Default)...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${deepseekKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: secureMessages,
          temperature: 0.25,
          max_tokens: 3500
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json?.choices?.[0]?.message?.content) {
          console.log("[AI Provider] Respuesta generada exitosamente con DeepSeek.");
          return json;
        }
      } else {
        const errText = await response.text().catch(() => "");
        if (response.status === 401 || response.status === 403) {
          deepseekAuthFailed = true;
          console.warn(`[AI Provider] Clave de DeepSeek no válida o expirada (HTTP ${response.status}). Pasando inmediatamente a Kimi / Moonshot...`);
        } else {
          console.warn(`[AI Provider] DeepSeek devolvió código HTTP ${response.status}: ${errText.substring(0, 100)}. Pasando a Kimi / Moonshot...`);
        }
      }
    } catch (error: any) {
      console.warn(`[AI Provider] Error o timeout con DeepSeek (${error.message}). Pasando a Kimi / Moonshot...`);
    }
  }

  // 2. PRIORIDAD 2 (RESPALDO): Kimi / Moonshot (compatible con api.moonshot.ai y api.moonshot.cn)
  if (hasMoonshot) {
    const endpointsToTry = [
      { url: "https://api.moonshot.ai/v1/chat/completions", model: "kimi-k2.7-code-highspeed", temp: 1 },
      { url: "https://api.moonshot.ai/v1/chat/completions", model: "kimi-k2.6", temp: 1 },
      { url: "https://api.moonshot.cn/v1/chat/completions", model: "moonshot-v1-8k", temp: 0.25 }
    ];

    for (const ep of endpointsToTry) {
      try {
        console.log(`[AI Provider] [2/3] Solicitando inferencia a Kimi (${ep.model})...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(ep.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${moonshotKey}`
          },
          body: JSON.stringify({
            model: ep.model,
            messages: secureMessages,
            temperature: ep.temp,
            max_tokens: 3500
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const json = await response.json();
          if (json?.choices?.[0]?.message?.content) {
            console.log(`[AI Provider] Respuesta generada exitosamente con Kimi (${ep.model}).`);
            return json;
          }
        } else {
          const errText = await response.text().catch(() => "");
          console.warn(`[AI Provider] Kimi (${ep.model}) código HTTP ${response.status}: ${errText.substring(0, 100)}`);
          if (response.status === 401 && ep.url.includes('.cn')) {
            moonshotAuthFailed = true;
          }
        }
      } catch (error: any) {
        console.warn(`[AI Provider] Error o timeout con Kimi (${ep.model}): ${error.message}`);
      }
    }
  }

  // 3. PRIORIDAD 3 (RESPALDO ADICIONAL): Gemini
  if (hasGemini) {
    const geminiResult = await tryGemini();
    if (geminiResult) return geminiResult;
  }

  // Fallback seguro en caso de que todos los proveedores externos estén inaccesibles
  console.error("[AI Provider] Todos los motores de inferencia no estuvieron disponibles temporalmente.");
  return {
    choices: [{
      message: {
        content: "Comprendo perfectamente la situación legal que me planteas. Para darte la mejor estrategia paso a paso bajo el marco jurídico aplicable, ¿podrías indicarme en qué estado de la República Mexicana te encuentras y si cuentas con algún documento o comprobante previo relacionado con este asunto?"
      },
      finish_reason: "stop"
    }]
  };
}
