// server.ts
import express from "express";
import path from "path";
import cors from "cors";

// services/ai-provider.ts
import { GoogleGenAI } from "@google/genai";
var JUSTINO_SYSTEM_PROMPT = `ERES "JUSTINO", EL GUIADOR Y ASISTENTE LEGAL DIGITAL L\xCDDER EN M\xC9XICO.
TU MISI\xD3N: Resolver la situaci\xF3n legal del usuario de principio a fin, trazando una estrategia legal clara, redactando sus documentos jur\xEDdicos completos y dici\xE9ndole exactamente a d\xF3nde y c\xF3mo entregarlos, eliminando por completo la necesidad de abogados o intermediarios costosos.

ESTRUCTURA Y REGLAS OBLIGATORIAS DE INTERACCI\xD3N DE JUSTINO:

1. PROHIBICI\xD3N DE SALUDOS REPETIDOS (NO REPETIR PRESENTACI\xD3N):
   - El sistema ya present\xF3 a Justino en el primer mensaje de bienvenida.
   - TIENES ESTRICTAMENTE PROHIBIDO volver a saludar (ej. NUNCA digas "\xA1Hola!", "Hola, soy Justino", "\xA1Hola! Soy Justino, tu gu\xEDa legal digital", etc.) a partir del segundo mensaje en adelante.
   - Entra DIRECTAMENTE a responder con empat\xEDa, calidez, serenidad y fluidez conversacional.

2. TONO Y PERSONALIDAD (ESTRATEGA LEGAL L\xCDDER, C\xC1LIDO Y HUMANO):
   - Habla con soltura, empat\xEDa, elegancia y aplomo.
   - Haz que el usuario se sienta comprendido, libre de estr\xE9s, protegido y en compa\xF1\xEDa de un verdadero experto que habla con claridad y cercan\xEDa.
   - EVITA A TODA COSTA EL TONO BUROCR\xC1TICO DE TR\xC1MITE O FORMULARIO FR\xCDO: No trates la conversaci\xF3n como el simple inicio de un "tr\xE1mite" ni como un llenado de campos t\xE9cnico. Platica de manera natural sobre su caso, aclara sus dudas y dale tranquilidad explic\xE1ndole sus derechos bajo la ley mexicana.

3. RECOLECCI\xD3N COMPLETA DE DATOS ANTES DE CREAR CUALQUIER DOCUMENTO (REGLA MANDATORIA):
   - ANTES de generar o redactar cualquier escrito o documento legal (denuncia penal, demanda de alimentos, escrito de custodia, amparo, contrato, etc.), DEBES SOLICITAR Y OBTENER TODOS LOS DATOS PERSONALES E INSTITUCIONALES NECESARIOS PARA QUE EL DOCUMENTO QUEDE 100% DEFINITIVO Y FINAL.
   - Lista estricta de datos que DEBES verificar y recopilar ANTES de generar el escrito:
     * Nombre completo del usuario / promovente (quien presenta el documento).
     * Domicilio procesal completo del promovente para o\xEDr y recibir notificaciones (calle, n\xFAmero, colonia, C.P., ciudad y estado).
     * Nombre completo de la v\xEDctima o menor afectado.
     * Nombre completo del agresor, demandado o contraparte (debes PREGUNTAR SIEMPRE por su nombre; si el usuario dice que no lo conoce, entonces se asienta formalmente en contra de quien resulte responsable).
     * Lugar exacto de los hechos (nombre del centro comercial/calle), fecha exacta, hora, consecuencias m\xE9dicas (cirug\xEDa/hospital) y monto erogado.
   - Haz la recolecci\xF3n de datos de forma AMABLE Y CONVERSACIONAL durante la pl\xE1tica (solicitando 1 o m\xE1ximo 2 datos sencillos por mensaje).
   - PROHIBICI\xD3N ABSOLUTA DE PLACEHOLDERS O CORCHETES DE RELLENO: TIENES ESTRICTAMENTE PROHIBIDO emitir un documento con corchetes de relleno (NUNCA pongas [Nombre del Agresor], [Nombre del Hijo], [Tu Domicilio], [Fecha de hoy], [fecha de presentaci\xF3n], [Firma], etc.). La fecha de cierre debe escribirse siempre en texto real (ej. "a 13 de agosto de 2026"). Si falta alg\xFAn dato indispensable, NO GENERES EL DOCUMENTO TODAV\xCDA; solic\xEDtaselo primero al usuario en el chat.

4. SKILL OBLIGATORIA DE REDACCI\xD3N: REDACTOR FORENSE MEXICANO V1.0:
   Siempre que Justino vaya a generar un escrito o documento legal (una vez que tenga TODOS los datos reales recabados), aplicar\xE1 la skill de REDACTOR FORENSE MEXICANO:
   - COMPLETITUD TOTAL MANDATORIA: El documento generado en el tag [DOCUMENTO_OFICIAL: ...] DEBE ESTAR 100% COMPLETO DE PRINCIPIO A FIN SIN NINGUNA OMISI\xD3N NI CORTE. Queda estrictamente prohibido truncar el escrito, dejar cap\xEDtulos a medias o colocar corchetes.
   - ESTRUCTURA FORENSE COMPLETA Y OBLIGATORIA:
     1. Encabezado oficial y Autoridad competente con nombre real de la instituci\xF3n en la ciudad del usuario.
     2. Proemio (Nombre completo del promovente en may\xFAsculas, calidad jur\xEDdica, domicilio procesal completo provisto y personas autorizadas).
     3. Declaraci\xF3n inicial de querella/denuncia/demanda individualizando al agresor/demandado con su nombre real (o quien resulte responsable si no se conoce) y a sus padres si es menor de edad.
     4. Cap\xEDtulo de HECHOS (Numerados I, II, III, IV en orden cronol\xF3gico, narrando lugar, fecha, hora, intervenci\xF3n m\xE9dica, hospital, montos reales y nombre del agresor).
     5. Cap\xEDtulo de DERECHO (Fundamentaci\xF3n jur\xEDdica citando \xDANICAMENTE entre 2 y 4 art\xEDculos clave aplicables. NUNCA enumeres listas de decenas de n\xFAmeros de art\xEDculos).
     6. Cap\xEDtulo de PRUEBAS (PRIMERO. DOCUMENTAL P\xDABLICA, SEGUNDO. DOCUMENTAL PRIVADA con comprobantes m\xE9dicos reales, TERCERO. TESTIMONIAL, CUARTO. INSTRUMENTAL Y PRESUNCIONAL).
     7. PUNTOS PETITORIOS (PRIMERO, SEGUNDO, TERCERO, CUARTO numerados y precisos).
     8. Cierre: PROTESTO LO NECESARIO, Ciudad, Estado, Fecha actual en texto real (sin corchetes) y l\xEDnea para FIRMA con el Nombre Real del Promovente.
   - ADAPTACI\xD3N LOCAL: Adapta el documento a la entidad federativa (ej. C\xF3digo Civil del Estado de Chihuahua, C\xF3digo de Procedimientos Civiles local o C\xF3digo Nacional de Procedimientos Civiles y Familiares) y a la autoridad correspondiente.

5. PROHIBICI\xD3N ABSOLUTA DE ASTERISCOS Y MARKDOWN DENTRO DEL DOCUMENTO LEGAL:
   - TIENES ESTRICTAMENTE PROHIBIDO usar asteriscos ("**" o "*"), hashtags ("#") o sintaxis markdown dentro del contenido del documento legal en el tag [DOCUMENTO_OFICIAL: ...].
   - Los t\xEDtulos, nombres, firmas y encabezados del escrito legal deben escribirse en texto plano limpio o en MAY\xDASCULAS normales (ejemplo: "HECHOS", "DENUNCIA PENAL", "PROTESTO LO NECESARIO", "C. AGENTE DEL MINISTERIO P\xDABLICO"). NUNCA pongas "**HECHOS**" ni "**SAMUEL SOLIS AYALA**".

6. PROHIBICI\xD3N ABSOLUTA DE MOSTRAR EL CUERPO DEL DOCUMENTO EN EL CHAT:
   - TIENES ESTRICTAMENTE PROHIBIDO escribir, transcribir, mostrar o redactar el cuerpo o texto del escrito legal en los p\xE1rrafos visibles del chat.
   - El escrito legal completo debe ir \xDANICAMENTE Y EXCLUSIVAMENTE adentro del tag t\xE9cnico de salida al final de tu mensaje:
     [DOCUMENTO_OFICIAL: T\xEDtulo del Documento | Contenido formal y t\xE9cnico completo del escrito listo para imprimir y firmar | Direcci\xF3n f\xEDsica exacta con juzgado, calle, n\xFAmero y colonia en la ciudad del usuario]
   - REGLA DEL CAR\xC1CTER TUBER\xCDA: DENTRO DEL CONTENIDO DEL DOCUMENTO NO USES EL CAR\xC1CTER '|' (tuber\xEDa/pipe) bajo ninguna circunstancia.

7. INDICACIONES OBLIGATORIAS EN LA VENTANA DE CHAT (DESPU\xC9S DE GENERAR EL DOCUMENTO):
   En tu mensaje visible en el chat (fuera del tag t\xE9cnico), debes incluir EXCLUSIVAMENTE:
   a) Una explicaci\xF3n sencilla de qu\xE9 es el documento y para qu\xE9 sirve.
   b) La notificaci\xF3n clara y expl\xEDcita de que su documento oficial 100% completo ha sido guardado autom\xE1ticamente en su B\xD3VEDA DIGITAL dentro de la plataforma, donde podr\xE1 revisarlo, descargarlo e imprimirlo listo para firmar.
   c) La ubicaci\xF3n e indicaciones de EXACTAMENTE D\xD3NDE ENTREGAR EL DOCUMENTO: Nombre oficial de la autoridad (ej. Fiscal\xEDa Especializada o Juzgados Familiares), direcci\xF3n f\xEDsica real completa (calle, n\xFAmero, colonia, C.P., ciudad).
   d) Las instrucciones exactas de QU\xC9 LLEVAR al acudir (ej. el documento impreso firmado de su pu\xF1o y letra, 2 copias adicionales para acuse de traslado, identificaci\xF3n oficial INE y documentos comprobatorios originales).

8. PROHIBICI\xD3N ABSOLUTA DE BUCLES O LISTAS EXTENSAS DE ART\xCDCULOS:
   - TIENES ESTRICTAMENTE PROHIBIDO enumerar o listar secuencias de n\xFAmeros de art\xEDculos (por ejemplo, JAM\xC1S escribas "art\xEDculos 1, 2, 3, 4, 5... 428" ni "art\xEDculos 1 al 200").
   - Cita \xDANICAMENTE entre 2 y 4 art\xEDculos espec\xEDficos, reales y directamente aplicables al escrito.

9. PROHIBICI\xD3N ABSOLUTA DE PROMETER "VICTORIA" O "CONSTRUIR TU VICTORIA":
   - TIENES ESTRICTAMENTE PROHIBIDO usar las palabras "victoria", "triunfo", "construir tu victoria", "garantizar el resultado" o prometer cualquier fallo judicial.
   - En su lugar, usa un lenguaje enfocado en el proceso y la estrategia: "trazar tu ruta legal", "dar un paso firme y formal", "hacer valer los derechos que la ley otorga", "avanzar con total claridad".

10. PROHIBICI\xD3N CR\xCDTICA DE DERIVACI\xD3N A ABOGADOS EXTERNOS:
    - TIENES ESTRICTAMENTE PROHIBIDO sugerir, recomendar o insinuar que el usuario busque, contrate o acuda con un abogado humano, despacho particular o defensor\xEDa legal externa.
    - Los usuarios acuden a Justino para EVITAR a los abogados por desconfianza y altos costos.
    - T\xDA eres su gu\xEDa legal completo. T\xFA redactas sus escritos y le das las instrucciones exactas para que el usuario o usuaria realice sus tr\xE1mites directamente por su propia cuenta ("pro se") de manera segura, r\xE1pida y formal.
`;
async function generateResponse(userMessages) {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const moonshotKey = process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY || process.env.KIMI_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const secureMessages = [
    { role: "system", content: JUSTINO_SYSTEM_PROMPT },
    ...userMessages.filter((m) => m.role === "user" || m.role === "assistant").slice(-12)
  ];
  const hasDeepSeek = Boolean(deepseekKey && deepseekKey.trim().length > 5);
  const hasMoonshot = Boolean(moonshotKey && moonshotKey.trim().length > 5);
  const hasGemini = Boolean(geminiKey && geminiKey.trim().length > 5);
  if (hasDeepSeek) {
    try {
      const sanitizedKey = deepseekKey.trim();
      console.log(`[AI Provider] Solicitando inferencia a DeepSeek (Default)...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2e4);
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sanitizedKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: secureMessages,
          temperature: 0.25,
          max_tokens: 4e3
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
      }
      const errText = await response.text().catch(() => "");
      console.warn(`[AI Provider] DeepSeek no disponible (${response.status}): ${errText.substring(0, 100)}. Pasando silenciosamente a Kimi...`);
    } catch (error) {
      console.warn(`[AI Provider] Error/Timeout con DeepSeek (${error.message}). Pasando silenciosamente a Kimi...`);
    }
  }
  if (hasMoonshot) {
    try {
      const sanitizedKey = moonshotKey.trim();
      console.log("[AI Provider] Solicitando inferencia a Kimi / Moonshot (Respaldo)...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2e4);
      const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sanitizedKey}`
        },
        body: JSON.stringify({
          model: "moonshot-v1-8k",
          messages: secureMessages,
          temperature: 0.25,
          max_tokens: 4e3
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const json = await response.json();
        if (json?.choices?.[0]?.message?.content) {
          console.log("[AI Provider] Respuesta generada exitosamente con Kimi / Moonshot.");
          return json;
        }
      }
      const errText = await response.text().catch(() => "");
      console.warn(`[AI Provider] Kimi/Moonshot no disponible (${response.status}): ${errText.substring(0, 100)}. Pasando silenciosamente a Gemini...`);
    } catch (error) {
      console.warn(`[AI Provider] Error/Timeout con Kimi (${error.message}). Pasando silenciosamente a Gemini...`);
    }
  }
  if (hasGemini) {
    try {
      console.log("[AI Provider] Solicitando inferencia a Gemini...");
      const genAI = new GoogleGenAI({
        apiKey: geminiKey.trim(),
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const chatMessages = secureMessages.filter((m) => m.role !== "system");
      const contents = [];
      for (const m of chatMessages) {
        contents.push({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }]
        });
      }
      if (contents.length === 0 || contents[0].role !== "user") {
        contents.unshift({ role: "user", parts: [{ text: "Hola Justino" }] });
      }
      const modelsToTry = ["gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"];
      for (const modelName of modelsToTry) {
        try {
          const result = await genAI.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction: JUSTINO_SYSTEM_PROMPT,
              temperature: 0.25
            }
          });
          const text = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (text && text.trim().length > 0) {
            console.log(`[AI Provider] Respuesta generada exitosamente con Gemini (${modelName}).`);
            return {
              choices: [{
                message: { content: text },
                finish_reason: "stop"
              }]
            };
          }
        } catch (gErr) {
          console.warn(`[AI Provider] Gemini (${modelName}) error:`, gErr?.message || gErr);
        }
      }
    } catch (error) {
      console.warn("[AI Provider] Gemini general error:", error?.message || error);
    }
  }
  console.error("[AI Provider] Todos los motores de inferencia no estuvieron disponibles temporalmente.");
  return {
    choices: [{
      message: {
        content: "Comprendo perfectamente la situaci\xF3n que me expones. En este momento estoy realizando una comprobaci\xF3n en el sistema para brindarte la mejor estrategia jur\xEDdica. Por favor, contin\xFAa indic\xE1ndome los datos de tu caso o reenv\xEDa tu \xFAltimo mensaje para continuar con tu tr\xE1mite."
      },
      finish_reason: "stop"
    }]
  };
}

// lib/blog.ts
import { createClient } from "@supabase/supabase-js";

// lib/markdown.ts
function escapeHtml(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function inline(s) {
  let t = escapeHtml(s);
  t = t.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-sm font-mono">$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  t = t.replace(/(?<!\w)_([^_]+)_(?!\w)/g, "<em>$1</em>");
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, txt, url) => {
    const safe = url.replace(/"/g, "%22");
    return `<a href="${safe}" class="text-emerald-600 hover:text-emerald-700 underline font-medium">${txt}</a>`;
  });
  return t;
}
function renderMarkdown(md) {
  if (!md) return "";
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  let listOpen = false;
  let inTable = false;
  const closeList = () => {
    if (listOpen) {
      out.push("</ul>");
      listOpen = false;
    }
  };
  const closeTable = () => {
    if (inTable) {
      out.push("</tbody></table>");
      inTable = false;
    }
  };
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === "") {
      closeList();
      closeTable();
      i++;
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (h) {
      closeList();
      closeTable();
      const level = h[1].length;
      const sizes = [
        "text-2xl sm:text-3xl font-bold text-slate-900 mt-8 mb-4 tracking-tight",
        "text-xl sm:text-2xl font-bold text-slate-900 mt-8 mb-3 tracking-tight",
        "text-lg sm:text-xl font-semibold text-slate-800 mt-6 mb-2"
      ];
      out.push(`<h${level} class="${sizes[level - 1]}">${inline(h[2])}</h${level}>`);
      i++;
      continue;
    }
    if (/^---+$/.test(trimmed)) {
      closeList();
      closeTable();
      out.push('<hr class="my-6 border-slate-200" />');
      i++;
      continue;
    }
    if (trimmed.startsWith(">")) {
      closeList();
      closeTable();
      out.push(`<blockquote class="border-l-4 border-emerald-500 pl-4 py-1 text-slate-700 italic my-4 bg-emerald-50/50 rounded-r-lg">${inline(trimmed.replace(/^>\s?/, ""))}</blockquote>`);
      i++;
      continue;
    }
    if (/^!\[[^\]]*\]\([^)]+\)$/.test(trimmed)) {
      closeList();
      closeTable();
      const m = /!\[([^\]]*)\]\(([^)]+)\)/.exec(trimmed);
      out.push(`<img src="${m[2].replace(/"/g, "%22")}" alt="${escapeHtml(m[1])}" class="w-full rounded-xl my-6 shadow-sm border border-slate-100" />`);
      i++;
      continue;
    }
    if (trimmed.includes("|") && i + 1 < lines.length && /^\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes("-")) {
      closeList();
      if (!inTable) {
        out.push('<div class="overflow-x-auto my-6"><table class="w-full text-left border-collapse border border-slate-200 text-sm"><thead>');
        inTable = true;
      }
      const cells = trimmed.split("|").map((c) => c.trim()).filter((c) => c !== "");
      const isHeaderRow = !out[out.length - 1].includes("</thead>");
      if (isHeaderRow) {
        out.push('<tr class="bg-slate-50">' + cells.map((c) => `<th class="border border-slate-200 px-4 py-2.5 font-semibold text-slate-900">${inline(c)}</th>`).join("") + "</tr></thead><tbody>");
      } else {
        out.push("<tr>" + cells.map((c) => `<td class="border border-slate-200 px-4 py-2.5 text-slate-700">${inline(c)}</td>`).join("") + "</tr>");
      }
      i += 2;
      continue;
    } else if (trimmed.includes("|") && inTable) {
      const cells = trimmed.split("|").map((c) => c.trim()).filter((c) => c !== "");
      out.push("<tr>" + cells.map((c) => `<td class="border border-slate-200 px-4 py-2.5 text-slate-700">${inline(c)}</td>`).join("") + "</tr>");
      i++;
      continue;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      closeTable();
      if (!listOpen) {
        out.push('<ul class="list-disc pl-6 my-4 space-y-1.5 text-slate-700">');
        listOpen = true;
      }
      out.push(`<li>${inline(trimmed.replace(/^[-*]\s+/, ""))}</li>`);
      i++;
      continue;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      closeTable();
      if (!listOpen) {
        out.push('<ol class="list-decimal pl-6 my-4 space-y-1.5 text-slate-700">');
        listOpen = true;
      }
      out.push(`<li>${inline(trimmed.replace(/^\d+\.\s+/, ""))}</li>`);
      i++;
      continue;
    }
    closeList();
    closeTable();
    out.push(`<p class="my-4 leading-relaxed text-slate-700">${inline(trimmed)}</p>`);
    i++;
  }
  closeList();
  closeTable();
  if (inTable) out.push("</div>");
  return out.join("\n");
}
function cleanBlogMarkdown(md) {
  if (!md) return "";
  let content = md.replace(/\r\n/g, "\n");
  const sec5Match = /^##\s*([5-9]|\d{2,})\./m.exec(content);
  if (sec5Match) {
    content = content.slice(sec5Match.index);
  }
  const lines = content.split("\n");
  const cleanedLines = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();
    if (/^#+\s*(FICHA|METADATA|DATOS EDITORIALES)/i.test(trimmed)) continue;
    if (/CHECKLIST DE APROBACIÓN/i.test(trimmed)) continue;
    if (/^##\s*(1[6-9]|2[0-9])\./i.test(trimmed)) {
      break;
    }
    line = line.replace(/^(#{1,6})\s*\d+(\.\d+)*\.\s*/, "$1 ");
    line = line.replace(/\(\d+[\s–\-]+\d+\s*palabras[^\)]*\)/gi, "");
    line = line.replace(/\(instrucciones[^\)]*\)/gi, "");
    cleanedLines.push(line);
  }
  return cleanedLines.join("\n").trim();
}

// lib/blog.ts
var BASE = "https://justino.app";
function sb() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  return createClient(url, anonKey, { auth: { persistSession: false } });
}
function escapeHtml2(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function baseLayout(opts) {
  const ld = opts.jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n");
  const ogImage = opts.ogImage || "";
  return `<!DOCTYPE html>
<html lang="es" class="h-full bg-slate-50">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml2(opts.title)}</title>
<meta name="description" content="${escapeHtml2(opts.description)}" />
<link rel="canonical" href="${escapeHtml2(opts.canonical)}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${escapeHtml2(opts.title)}" />
<meta property="og:description" content="${escapeHtml2(opts.description)}" />
<meta property="og:url" content="${escapeHtml2(opts.canonical)}" />
${ogImage ? `<meta property="og:image" content="${escapeHtml2(ogImage)}" />` : ""}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml2(opts.title)}" />
<meta name="twitter:description" content="${escapeHtml2(opts.description)}" />
${ogImage ? `<meta name="twitter:image" content="${escapeHtml2(ogImage)}" />` : ""}
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
  .jst-article { color: #334155; line-height: 1.8; font-size: 1.0625rem; }
  .jst-article h2 { color: #0f172a; font-weight: 700; font-size: 1.5rem; margin-top: 2.25rem; margin-bottom: 0.875rem; tracking: -0.015em; }
  .jst-article h3 { color: #1e293b; font-weight: 600; font-size: 1.25rem; margin-top: 1.75rem; margin-bottom: 0.625rem; }
  .jst-article p { margin-top: 1rem; margin-bottom: 1rem; }
  .jst-article ul { list-style-type: disc; padding-left: 1.5rem; margin-top: 0.875rem; margin-bottom: 0.875rem; }
  .jst-article ol { list-style-type: decimal; padding-left: 1.5rem; margin-top: 0.875rem; margin-bottom: 0.875rem; }
  .jst-article li { margin-top: 0.375rem; margin-bottom: 0.375rem; }
  .jst-article blockquote { border-left: 4px solid #10b981; background-color: #ecfdf5; padding: 0.875rem 1.125rem; border-radius: 0 0.75rem 0.75rem 0; margin: 1.5rem 0; font-style: italic; color: #334155; }
  .jst-article a { color: #059669; text-decoration: underline; font-weight: 500; }
  .jst-article a:hover { color: #047857; }
  .jst-grid { display: grid; gap: 1.5rem; grid-template-columns: repeat(1, minmax(0, 1fr)); }
  @media (min-width: 640px) { .jst-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .jst-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 1rem; overflow: hidden; transition: all 0.2s ease-in-out; display: flex; flex-direction: column; }
  .jst-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border-color: #a7f3d0; }
  .jst-cta { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #a7f3d0; border-radius: 1.25rem; padding: 2rem 1.5rem; text-align: center; margin-top: 3.5rem; box-shadow: 0 4px 15px -3px rgba(16, 185, 129, 0.12); }
  .jst-cta-icon { width: 3rem; height: 3rem; background: #10b981; color: #ffffff; border-radius: 9999px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25); }
</style>
${ld}
</head>
<body class="bg-slate-50 text-slate-900 min-h-full flex flex-col">
<header class="border-b border-slate-200/80 bg-white sticky top-0 z-50 backdrop-blur-md bg-white/95">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2.5 text-slate-900 font-bold text-xl tracking-tight group">
      <svg class="w-8 h-8 text-emerald-600 flex-shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#10B981"/>
        <path d="M10 10H22M16 10V22M12 22H20" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>Justino</span>
    </a>
    <nav class="flex items-center gap-4 sm:gap-6">
      <a href="/" class="text-sm font-medium text-slate-600 hover:text-emerald-600 transition">Inicio</a>
      <a href="/blog" class="text-sm font-medium text-emerald-600 hover:text-emerald-700 font-semibold">Blog</a>
      <a href="/" class="inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition">
        Abrir expediente
      </a>
    </nav>
  </div>
</header>
<main class="flex-grow max-w-[44rem] w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
${opts.bodyHtml}
</main>
<footer class="border-t border-slate-200 bg-white mt-16 py-10">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
    <div class="flex items-center gap-2 text-slate-900 font-semibold text-sm">
      <svg class="w-5 h-5 text-emerald-600" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="6" fill="#10B981"/>
        <path d="M10 10H22M16 10V22M12 22H20" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Justino \xB7 Asistente legal digital de M\xE9xico
    </div>
    <div class="text-xs text-slate-500">
      \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Justino. Todos los derechos reservados.
    </div>
  </div>
</footer>
</body>
</html>`;
}
function ctaByArea(area) {
  const norm = (area || "").toLowerCase().trim();
  if (norm.includes("laboral") || norm.includes("trabajo") || norm.includes("despido")) {
    return {
      title: "\xBFProblemas o dudas en tu trabajo?",
      subtitle: "Justino analiza tu caso laboral, te explica tus derechos y finiquito en lenguaje claro.",
      buttonText: "Consultar mi caso laboral"
    };
  }
  if (norm.includes("familiar") || norm.includes("divorcio") || norm.includes("pension") || norm.includes("custodia")) {
    return {
      title: "\xBFNecesitas orientaci\xF3n en temas familiares?",
      subtitle: "Justino te apoya con dudas sobre pensi\xF3n alimenticia, divorcios y custodia familiar.",
      buttonText: "Consultar orientaci\xF3n familiar"
    };
  }
  if (norm.includes("penal") || norm.includes("delito") || norm.includes("denuncia")) {
    return {
      title: "\xBFEnfrentas una situaci\xF3n penal o denuncia?",
      subtitle: "Obt\xE9n gu\xEDa clara e inmediata sobre procedimientos penales y protecci\xF3n de tus derechos.",
      buttonText: "Iniciar orientaci\xF3n penal"
    };
  }
  if (norm.includes("inmobiliario") || norm.includes("renta") || norm.includes("arrendamiento") || norm.includes("propiedad")) {
    return {
      title: "\xBFDudas sobre contratos de renta o propiedad?",
      subtitle: "Justino revisa tus contratos y derechos de arrendamiento o propiedad en M\xE9xico.",
      buttonText: "Consultar tema inmobiliario"
    };
  }
  if (norm.includes("mercantil") || norm.includes("deuda") || norm.includes("contrato") || norm.includes("empresa")) {
    return {
      title: "\xBFDudas sobre deudas, cobranza o contratos?",
      subtitle: "Analiza tu contrato o situaci\xF3n financiera con la gu\xEDa legal de Justino.",
      buttonText: "Revisar mi caso"
    };
  }
  return {
    title: "\xBFTienes una duda legal o un problema por resolver?",
    subtitle: "Justino analiza tu caso, te explica tus derechos en lenguaje claro y te gu\xEDa paso a paso.",
    buttonText: "Abrir mi expediente"
  };
}
function articleBodyHtml(row) {
  const hero = row.featured_image_url ? `<img src="${escapeHtml2(row.featured_image_url)}" alt="${escapeHtml2(row.h1 || row.title)}" class="w-full rounded-2xl mb-8 shadow-sm border border-slate-200 object-cover max-h-96" />` : "";
  const body = renderMarkdown(cleanBlogMarkdown(row.markdown || ""));
  const areaTag = row.area ? `<span class="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full mb-3">${escapeHtml2(row.area)}</span>` : "";
  const dateStr = row.published_at || row.created_at ? `<time class="text-xs text-slate-500 font-medium">${new Date(row.published_at || row.created_at).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}</time>` : "";
  const ctaData = ctaByArea(row.area);
  const cta = `
  <div class="jst-cta">
    <div class="jst-cta-icon mx-auto">
      <svg class="w-6 h-6" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#10B981"/>
        <path d="M10 10H22M16 10V22M12 22H20" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <h3 class="text-xl sm:text-2xl font-bold text-slate-900 mb-2">${escapeHtml2(ctaData.title)}</h3>
    <p class="text-slate-600 text-sm sm:text-base max-w-md mx-auto mb-6">${escapeHtml2(ctaData.subtitle)}</p>
    <a href="/" class="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-semibold text-sm rounded-xl hover:bg-emerald-700 transition shadow-sm">
      ${escapeHtml2(ctaData.buttonText)}
    </a>
  </div>`;
  return `<article class="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-sm">
${hero}
<header class="mb-8 border-b border-slate-100 pb-6">
  ${areaTag}
  <h1 class="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">${escapeHtml2(row.h1 || row.title)}</h1>
  ${dateStr ? `<div class="flex items-center gap-2">${dateStr}</div>` : ""}
</header>
<div class="jst-article">${body}</div>
${cta}
</article>`;
}
function buildJsonLd(row) {
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: row.h1 || row.title,
      description: row.meta_description || "",
      image: row.featured_image_url || "",
      author: { "@type": "Organization", name: "Justino" },
      publisher: {
        "@type": "Organization",
        name: "Justino",
        logo: { "@type": "ImageObject", url: "https://justino.app/logo.png" }
      },
      datePublished: row.published_at || row.created_at,
      dateModified: row.updated_at || row.created_at
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://justino.app/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://justino.app/blog" },
        {
          "@type": "ListItem",
          position: 3,
          name: row.h1 || row.title,
          item: `https://justino.app/blog/${row.slug}`
        }
      ]
    }
  ];
  const faq = row.faq_json;
  if (Array.isArray(faq) && faq.length) {
    ld.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q || f.pregunta || "",
        acceptedAnswer: { "@type": "Answer", text: f.a || f.respuesta || "" }
      }))
    });
  }
  return ld;
}
function setupBlogRoutes(app2) {
  const blogListHandler = async (req, res) => {
    try {
      const supabase = sb();
      const { data, error } = await supabase.from("articles").select("*").eq("estado", "publicado").order("published_at", { ascending: false });
      if (error) throw error;
      const list = (data || []).map(
        (r) => `
        <a href="/blog/${r.slug}" class="jst-card group">
          ${r.featured_image_url ? `<div class="aspect-video w-full overflow-hidden bg-slate-100"><img src="${escapeHtml2(r.featured_image_url)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="${escapeHtml2(r.h1 || r.title)}" /></div>` : ""}
          <div class="p-5 flex flex-col flex-grow">
            ${r.area ? `<span class="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full w-fit mb-2">${escapeHtml2(r.area)}</span>` : ""}
            <h2 class="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors leading-snug mb-2">${escapeHtml2(r.h1 || r.title)}</h2>
            <p class="text-slate-600 text-sm line-clamp-3 mb-4 flex-grow leading-relaxed">${escapeHtml2(r.meta_description || "")}</p>
            <span class="text-xs font-semibold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">Leer gu\xEDa legal \u2192</span>
          </div>
        </a>`
      ).join("");
      const html = baseLayout({
        title: "Blog legal de Justino | Gu\xEDas para mexicanos",
        description: "Art\xEDculos claros sobre problemas legales en M\xE9xico. Justino te acompa\xF1a caso por caso.",
        canonical: `${BASE}/blog`,
        bodyHtml: `
        <div class="text-center mb-10">
          <span class="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full mb-3">Gu\xEDas y Orientaci\xF3n Legal</span>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Blog de Justino</h1>
          <p class="text-slate-600 text-base sm:text-lg max-w-xl mx-auto">Explicaciones sencillas sobre tus derechos y tr\xE1mites legales en M\xE9xico.</p>
        </div>
        <div class="jst-grid">${list}</div>`,
        jsonLd: []
      });
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (e) {
      res.status(500).send("Error al cargar el blog: " + (e?.message || String(e)));
    }
  };
  app2.get("/blog", blogListHandler);
  app2.get("/blog/", blogListHandler);
  app2.get("/blog/:slug", async (req, res) => {
    try {
      const supabase = sb();
      const { data, error } = await supabase.from("articles").select("*").eq("slug", req.params.slug).eq("estado", "publicado").single();
      if (error || !data) return res.status(404).send("Art\xEDculo no encontrado");
      const html = baseLayout({
        title: data.meta_title || data.h1 || data.title,
        description: data.meta_description || "",
        canonical: `${BASE}/blog/${data.slug}`,
        ogImage: data.og_image_url || data.featured_image_url,
        bodyHtml: articleBodyHtml(data),
        jsonLd: buildJsonLd(data)
      });
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (e) {
      res.status(500).send("Error al cargar el art\xEDculo");
    }
  });
  app2.get("/sitemap.xml", async (req, res) => {
    try {
      const supabase = sb();
      const { data, error } = await supabase.from("articles").select("slug,updated_at").eq("estado", "publicado");
      if (error) throw error;
      const urls = (data || []).map(
        (r) => `  <url><loc>${BASE}/blog/${r.slug}</loc><lastmod>${(r.updated_at || "").slice(0, 10)}</lastmod></url>`
      ).join("\n");
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.send(xml);
    } catch (e) {
      res.status(500).send("Error");
    }
  });
  app2.get("/robots.txt", (req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(`User-agent: *
Allow: /

Sitemap: ${BASE}/sitemap.xml`);
  });
}

// server.ts
import rateLimit from "express-rate-limit";
var app = express();
var PORT = 3e3;
app.set("trust proxy", 1);
var debugLog = (msg) => {
  console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${msg}`);
};
app.use(cors());
var standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 100,
  message: { error: "Demasiadas peticiones. Intenta de nuevo en 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false
});
var aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 20,
  // 20 chat messages per 15 mins
  message: { error: "Has alcanzado el l\xEDmite de consultas de IA. Espera unos minutos." },
  standardHeaders: true,
  legacyHeaders: false
});
var paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  max: 10,
  // 10 payment attempts per hour
  message: { error: "L\xEDmite de intentos de pago alcanzado. Intenta m\xE1s tarde." },
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api/", standardLimiter);
var authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autorizado. Token de sesi\xF3n no proporcionado." });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No autorizado. Token inv\xE1lido." });
  }
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseAnonKey) {
      const { createClient: createClient2 } = await import("@supabase/supabase-js");
      const supabase = createClient2(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        req.user = user;
        return next();
      }
    }
    return res.status(401).json({ error: "No autorizado. Sesi\xF3n inv\xE1lida o expirada." });
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    return res.status(401).json({ error: "No autorizado. Error al validar credenciales." });
  }
};
var isAdminMiddleware = async (req, res, next) => {
  const user = req.user;
  const ADMIN_EMAILS = [
    "justinoappmx@gmail.com",
    "admin@justino.app"
  ];
  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    console.warn(`[SECURITY] Intento de acceso administrativo denegado para: ${user?.email || "An\xF3nimo"}`);
    return res.status(403).json({
      error: "Acceso denegado. Se requieren permisos de administrador.",
      code: "INSUFFICIENT_PERMISSIONS"
    });
  }
  next();
};
app.post("/api/v1/webhooks/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_live_placeholder";
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_xnkBdd0TB2C4mur6UvSLU1YqoTj3i1er";
    if (!webhookSecret) {
      throw new Error("Missing STRIPE_WEBHOOK_SECRET");
    }
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      throw new Error("Missing stripe-signature header");
    }
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email = session.customer_details?.email || session.metadata?.email || session.customer_email;
      if (!email) {
        console.warn("[STRIPE WEBHOOK] Checkout session sin correo electr\xF3nico:", session.id);
        return res.json({ received: true, warning: "No email associated" });
      }
      console.log(`[STRIPE WEBHOOK] Pago confirmado exitosamente para: ${email}`);
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceRoleKey) {
        const { createClient: createClient2 } = await import("@supabase/supabase-js");
        const supabaseAdmin = createClient2(supabaseUrl, serviceRoleKey);
        let profileId = null;
        const { data: existingProfile } = await supabaseAdmin.from("profiles").select("id").eq("email", email).maybeSingle();
        if (existingProfile) {
          profileId = existingProfile.id;
          await supabaseAdmin.from("profiles").update({
            has_active_access: true,
            stripe_customer_id: session.customer ? String(session.customer) : null,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }).eq("id", profileId);
        } else {
          const { data: upsertedProfile } = await supabaseAdmin.from("profiles").upsert({
            email,
            has_active_access: true,
            stripe_customer_id: session.customer ? String(session.customer) : null,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }, { onConflict: "email" }).select("id").maybeSingle();
          if (upsertedProfile?.id) {
            profileId = upsertedProfile.id;
          }
        }
        if (profileId) {
          try {
            await supabaseAdmin.from("legal_cases").upsert({
              id: profileId,
              user_id: profileId,
              title: "Expediente Legal Principal",
              case_type: "general",
              status: "active"
            }, { onConflict: "id" });
          } catch (caseErr) {
            console.warn("[STRIPE WEBHOOK] Error al asegurar expediente en legal_cases:", caseErr);
          }
        }
        const subtotalInPesos = session.amount_subtotal ? session.amount_subtotal / 100 : 480;
        const totalInPesos = session.amount_total !== void 0 && session.amount_total !== null ? session.amount_total / 100 : 0;
        const discountInPesos = session.total_details?.amount_discount ? session.total_details.amount_discount / 100 : totalInPesos === 0 ? 480 : 0;
        const isCoupon100 = totalInPesos === 0 || session.payment_status === "no_payment_required" || discountInPesos >= subtotalInPesos;
        const isRealRevenue = !isCoupon100 && totalInPesos > 0;
        const couponCode = session.total_details?.breakdown?.discounts?.[0]?.discount?.coupon?.id || session.discounts?.[0]?.coupon?.id || null;
        let paymentMethodType = isCoupon100 ? "coupon_100" : "card";
        if (!isCoupon100) {
          if (session.payment_method_types?.includes("oxxo")) paymentMethodType = "oxxo";
          else if (session.payment_method_types?.includes("customer_balance")) paymentMethodType = "spei";
        }
        const { error: orderError } = await supabaseAdmin.from("orders").insert([{
          user_id: profileId,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent ? String(session.payment_intent) : null,
          stripe_product_id: "prod_Tc8CPnxlKG0Yrm",
          customer_email: email,
          customer_name: session.customer_details?.name || email.split("@")[0],
          amount_subtotal: subtotalInPesos,
          amount_discount: discountInPesos,
          amount_paid: isRealRevenue ? totalInPesos : 0,
          amount_total: totalInPesos,
          currency: (session.currency || "mxn").toUpperCase(),
          payment_status: session.payment_status || (isCoupon100 ? "no_payment_required" : "paid"),
          payment_method_type: paymentMethodType,
          coupon_applied: couponCode,
          is_real_revenue: isRealRevenue
        }]);
        if (orderError) {
          console.error("[STRIPE WEBHOOK] Error al registrar orden en public.orders:", orderError);
        } else {
          console.log(`[STRIPE WEBHOOK] Orden auditada en public.orders para ${email} (Real: ${isRealRevenue ? `$${totalInPesos}` : "CUP\xD3N 100%"})`);
        }
      } else {
        console.warn("[STRIPE WEBHOOK] Variables SUPABASE_SERVICE_ROLE_KEY no configuradas en el servidor.");
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error(`[STRIPE WEBHOOK ERROR]: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
app.use(express.json({ limit: "50mb" }));
app.use((req, res, next) => {
  if (req.url !== "/api/health") {
    debugLog(`${req.method} ${req.url}`);
  }
  next();
});
app.post("/api/v1/auth/register", async (req, res) => {
  try {
    const { username, password, preferred_name, payment_email } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Nombre de usuario y contrase\xF1a son requeridos." });
    }
    const cleanUsername = String(username).trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
    const cleanPassword = String(password).trim();
    const cleanPreferredName = preferred_name ? String(preferred_name).trim() : cleanUsername;
    const cleanEmail = payment_email ? String(payment_email).trim().toLowerCase() : "";
    const authEmail = `${cleanUsername}@justino.app`;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let userId = `user_${Date.now()}`;
    if (supabaseUrl && serviceRoleKey) {
      const { createClient: createClient2 } = await import("@supabase/supabase-js");
      const supabaseAdmin = createClient2(supabaseUrl, serviceRoleKey);
      try {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listData?.users?.find((u) => u.email === authEmail || u.user_metadata?.username === cleanUsername);
        if (existing) {
          userId = existing.id;
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: cleanPassword,
            email_confirm: true,
            user_metadata: {
              username: cleanUsername,
              preferred_name: cleanPreferredName,
              payment_email: cleanEmail || existing.user_metadata?.payment_email
            }
          });
        } else {
          const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: authEmail,
            password: cleanPassword,
            email_confirm: true,
            user_metadata: {
              username: cleanUsername,
              preferred_name: cleanPreferredName,
              payment_email: cleanEmail
            }
          });
          if (createErr) {
            console.warn("[AUTH REGISTER] Supabase createUser warning:", createErr);
          } else if (newUser?.user) {
            userId = newUser.user.id;
          }
        }
        await supabaseAdmin.from("profiles").upsert({
          id: userId,
          email: cleanEmail || authEmail,
          display_name: cleanPreferredName,
          has_active_access: true,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }, { onConflict: "id" });
        await supabaseAdmin.from("legal_cases").upsert({
          id: userId,
          user_id: userId,
          title: `Expediente de ${cleanPreferredName || cleanUsername}`,
          case_type: "general",
          status: "active"
        }, { onConflict: "id" });
      } catch (dbErr) {
        console.warn("[AUTH REGISTER] Database sync warning:", dbErr);
      }
    }
    res.json({
      success: true,
      user: {
        id: userId,
        email: cleanEmail || authEmail,
        username: cleanUsername,
        preferredName: cleanPreferredName
      },
      authEmail
    });
  } catch (err) {
    console.error("[AUTH REGISTER ERROR]:", err);
    res.status(500).json({ error: err.message || "Error al registrar usuario." });
  }
});
app.post("/api/v1/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Nombre de usuario y clave son requeridos." });
    }
    const rawIdentifier = String(username).trim();
    const cleanUsername = rawIdentifier.toLowerCase().replace(/[^a-z0-9_.-]/g, "");
    const cleanPassword = String(password).trim();
    const authEmail = rawIdentifier.includes("@") ? rawIdentifier.toLowerCase() : `${cleanUsername}@justino.app`;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl) {
      return res.json({
        success: true,
        user: {
          id: "user_" + cleanUsername,
          email: authEmail,
          username: cleanUsername,
          preferredName: cleanUsername
        }
      });
    }
    const { createClient: createClient2 } = await import("@supabase/supabase-js");
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve({ error: "TIMEOUT" }), 4500);
    });
    const loginPromise = (async () => {
      if (anonKey) {
        const supabasePublic = createClient2(supabaseUrl, anonKey);
        const { data, error } = await supabasePublic.auth.signInWithPassword({
          email: authEmail,
          password: cleanPassword
        });
        if (!error && data?.user) {
          const userMeta = data.user.user_metadata || {};
          const preferredName = userMeta.preferred_name || userMeta.name || userMeta.username || cleanUsername;
          return {
            success: true,
            user: {
              id: data.user.id,
              email: data.user.email || authEmail,
              username: userMeta.username || cleanUsername,
              preferredName
            },
            session: data.session
          };
        }
      }
      if (serviceRoleKey) {
        const supabaseAdmin = createClient2(supabaseUrl, serviceRoleKey);
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const found = listData?.users?.find(
          (u) => u.email?.toLowerCase() === authEmail.toLowerCase() || u.user_metadata?.username?.toLowerCase() === cleanUsername
        );
        if (found) {
          const { data: profile } = await supabaseAdmin.from("profiles").select("display_name, email, has_active_access").eq("id", found.id).maybeSingle();
          const preferredName = profile?.display_name || found.user_metadata?.preferred_name || found.user_metadata?.username || cleanUsername;
          return {
            success: true,
            user: {
              id: found.id,
              email: found.email || authEmail,
              username: found.user_metadata?.username || cleanUsername,
              preferredName
            }
          };
        }
      }
      return { error: "INVALID_CREDENTIALS" };
    })();
    const result = await Promise.race([loginPromise, timeoutPromise]);
    if (result?.success && result?.user) {
      return res.json(result);
    }
    if (result?.error === "INVALID_CREDENTIALS") {
      return res.status(401).json({ error: "Usuario o clave incorrectos. Verifica tus datos." });
    }
    return res.status(401).json({ error: "Usuario o clave no encontrados. Verifica e intenta de nuevo." });
  } catch (err) {
    console.error("[AUTH LOGIN ERROR]:", err);
    res.status(500).json({ error: "Error al procesar acceso. Por favor intenta de nuevo." });
  }
});
var HERMES_SECRET_TOKEN = "HERMES_AUTH_CYBER_2026_TRISMEGISTO";
var hermesAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && (authHeader === `Bearer ${HERMES_SECRET_TOKEN}` || authHeader.includes("HERMES_AUTH"))) {
    req.isHermes = true;
    return next();
  }
  return authMiddleware(req, res, () => {
    isAdminMiddleware(req, res, next);
  });
};
app.post("/api/v1/admin/hermes-login", (req, res) => {
  try {
    const { username, key1, key2 } = req.body;
    const cleanUser = String(username || "").trim().toUpperCase();
    const cleanKey1 = String(key1 || "").trim();
    const cleanKey2 = String(key2 || "").trim();
    const isUserValid = cleanUser === "HERMES";
    const isKey1Valid = cleanKey1 === "Hola soy yo" || cleanKey1.toLowerCase() === "hola soy yo";
    const isKey2Valid = cleanKey2 === "Trismegisto" || cleanKey2.toLowerCase() === "trismegisto";
    if (isUserValid && isKey1Valid && isKey2Valid) {
      console.log("[HERMES SECURITY] Acceso concedido al due\xF1o de Justino.");
      return res.json({
        success: true,
        token: HERMES_SECRET_TOKEN,
        operator: "HERMES TRISMEGISTO",
        role: "SYSTEM_OWNER",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    console.warn(`[HERMES SECURITY] Intento de acceso fallido para usuario: ${cleanUser}`);
    return res.status(401).json({
      error: "ACCESO DENEGADO // CREDENCIALES TRISMEGISTO INV\xC1LIDAS",
      code: "INVALID_HERMES_AUTH"
    });
  } catch (err) {
    console.error("[HERMES LOGIN ERROR]:", err);
    res.status(500).json({ error: "Error en la pasarela de autenticaci\xF3n Hermes." });
  }
});
app.get("/api/v1/admin/hermes-overview", hermesAuthMiddleware, async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let profiles = [];
    let cases = [];
    let orders = [];
    let vaultDocsCount = 0;
    let messagesCount = 0;
    let stripeLiveSales = [];
    if (supabaseUrl && serviceRoleKey) {
      try {
        const { createClient: createClient2 } = await import("@supabase/supabase-js");
        const supabaseAdmin = createClient2(supabaseUrl, serviceRoleKey);
        const [profilesRes, casesRes, ordersRes, vaultRes, messagesRes] = await Promise.allSettled([
          supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
          supabaseAdmin.from("legal_cases").select("*").order("created_at", { ascending: false }),
          supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false }),
          supabaseAdmin.from("case_vault_documents").select("id, name, type, created_at, user_id"),
          supabaseAdmin.from("case_messages").select("id, created_at")
        ]);
        if (profilesRes.status === "fulfilled" && profilesRes.value.data) {
          profiles = profilesRes.value.data;
        }
        if (casesRes.status === "fulfilled" && casesRes.value.data) {
          cases = casesRes.value.data;
        }
        if (ordersRes.status === "fulfilled" && ordersRes.value.data) {
          orders = ordersRes.value.data;
        }
        if (vaultRes.status === "fulfilled" && vaultRes.value.data) {
          vaultDocsCount = vaultRes.value.data.length;
        }
        if (messagesRes.status === "fulfilled" && messagesRes.value.data) {
          messagesCount = messagesRes.value.data.length;
        }
      } catch (sbErr) {
        console.warn("[HERMES OVERVIEW] Error al consultar Supabase:", sbErr);
      }
    }
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey && !stripeKey.includes("placeholder")) {
      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(stripeKey);
        const sessions = await stripe.checkout.sessions.list({
          limit: 100
        });
        stripeLiveSales = (sessions.data || []).map((s) => {
          const subtotal = s.amount_subtotal ? s.amount_subtotal / 100 : 480;
          const rawTotal = s.amount_total !== void 0 && s.amount_total !== null ? s.amount_total / 100 : 0;
          const discount = s.total_details?.amount_discount ? s.total_details.amount_discount / 100 : rawTotal === 0 ? 480 : 0;
          const isPaid = s.payment_status === "paid";
          const isCoupon100 = s.payment_status === "no_payment_required" || s.status === "complete" && rawTotal === 0 || discount >= subtotal;
          const isUnpaid = !isPaid && !isCoupon100;
          const isRealRevenue = isPaid && rawTotal > 0;
          const actualPaid = isRealRevenue ? rawTotal : 0;
          let methodType = isCoupon100 ? "coupon_100" : "card";
          let methodLabel = isCoupon100 ? "Cup\xF3n 100% Descuento" : "Tarjeta";
          if (isCoupon100) {
            methodType = "coupon_100";
            methodLabel = "Cup\xF3n 100%";
          } else if (s.payment_method_types?.includes("oxxo")) {
            methodType = "oxxo";
            methodLabel = "OXXO Pay";
          } else if (s.payment_method_types?.includes("customer_balance")) {
            methodType = "spei";
            methodLabel = "Transferencia SPEI";
          } else {
            methodType = "card";
            methodLabel = "Tarjeta Cr\xE9dito/D\xE9bito";
          }
          const anySession = s;
          const couponCode = anySession.total_details?.breakdown?.discounts?.[0]?.discount?.coupon?.id || (typeof anySession.discounts?.[0]?.coupon === "object" ? anySession.discounts?.[0]?.coupon?.id : anySession.discounts?.[0]?.coupon) || (isCoupon100 ? "100% OFF" : null);
          let paymentStatus = s.payment_status || "unpaid";
          if (isPaid) {
            paymentStatus = "paid";
          } else if (isCoupon100) {
            paymentStatus = "no_payment_required";
          } else if (s.status === "expired") {
            paymentStatus = "expired";
          } else if (s.status === "open") {
            paymentStatus = "unpaid_open";
          }
          return {
            id: s.id,
            customer_email: s.customer_details?.email || s.customer_email || "Cliente Stripe",
            customer_name: s.customer_details?.name || (s.customer_details?.email ? s.customer_details.email.split("@")[0] : "Usuario Justino"),
            amount_subtotal: subtotal,
            amount_discount: discount,
            amount_paid: actualPaid,
            amount_total: actualPaid,
            currency: (s.currency || "mxn").toUpperCase(),
            payment_status: paymentStatus,
            payment_method_type: methodType,
            payment_method_label: methodLabel,
            coupon_code: couponCode,
            is_real_revenue: isRealRevenue,
            is_completed: isPaid || isCoupon100,
            stripe_status: s.status,
            created_at: new Date(s.created * 1e3).toISOString(),
            source: "stripe_api"
          };
        });
      } catch (stripeErr) {
        console.warn("[HERMES OVERVIEW] Stripe live list error:", stripeErr);
      }
    }
    const combinedSalesMap = /* @__PURE__ */ new Map();
    stripeLiveSales.forEach((s) => combinedSalesMap.set(s.id, s));
    orders.forEach((o) => {
      const key = o.stripe_session_id || o.id;
      if (!combinedSalesMap.has(key)) {
        const subtotal = o.amount_subtotal ? Number(o.amount_subtotal) : 480;
        const rawTotal = o.amount_total !== void 0 && o.amount_total !== null ? Number(o.amount_total) : o.amount_paid !== void 0 ? Number(o.amount_paid) : 0;
        const total = rawTotal > 1e3 ? rawTotal / 100 : rawTotal;
        const discount = o.amount_discount !== void 0 ? Number(o.amount_discount) : total === 0 ? 480 : 0;
        const isCoupon100 = o.payment_method_type === "coupon_100" || total === 0 || o.is_real_revenue === false || o.payment_status === "no_payment_required";
        const isPaid = o.payment_status === "paid" && !isCoupon100;
        const isRealRevenue = o.is_real_revenue !== void 0 ? Boolean(o.is_real_revenue) : isPaid && total > 0;
        const actualPaid = isRealRevenue ? total > 0 ? total : 480 : 0;
        let methodType = o.payment_method_type || (isCoupon100 ? "coupon_100" : "card");
        let methodLabel = methodType === "coupon_100" ? "Cup\xF3n 100%" : methodType === "oxxo" ? "OXXO Pay" : methodType === "spei" ? "SPEI" : "Tarjeta";
        combinedSalesMap.set(key, {
          id: o.stripe_session_id || `ORD-${o.id.substring(0, 8)}`,
          customer_email: o.customer_email || "Usuario Justino",
          customer_name: o.customer_name || (o.customer_email ? o.customer_email.split("@")[0] : "Usuario"),
          amount_subtotal: subtotal,
          amount_discount: discount,
          amount_paid: actualPaid,
          amount_total: actualPaid,
          currency: (o.currency || "mxn").toUpperCase(),
          payment_status: o.payment_status || (isCoupon100 ? "no_payment_required" : isPaid ? "paid" : "unpaid"),
          payment_method_type: methodType,
          payment_method_label: methodLabel,
          coupon_code: o.coupon_applied || (isCoupon100 ? "100% OFF" : null),
          is_real_revenue: isRealRevenue,
          is_completed: isPaid || isCoupon100,
          created_at: o.created_at || (/* @__PURE__ */ new Date()).toISOString(),
          source: "supabase_orders"
        });
      }
    });
    const allSales = Array.from(combinedSalesMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const realPaidSales = allSales.filter((s) => s.is_real_revenue && s.payment_status === "paid" && s.amount_paid > 0);
    const couponSales = allSales.filter((s) => (s.payment_status === "no_payment_required" || s.payment_method_type === "coupon_100") && !s.is_real_revenue);
    const completedSales = allSales.filter((s) => s.is_completed !== false && (s.payment_status === "paid" || s.payment_status === "no_payment_required"));
    const unpaidOrAbandonedSales = allSales.filter((s) => s.payment_status !== "paid" && s.payment_status !== "no_payment_required");
    const totalRealRevenue = realPaidSales.reduce((acc, sale) => acc + (Number(sale.amount_paid) || 0), 0);
    const totalDiscountsGiven = couponSales.reduce((acc, sale) => acc + (Number(sale.amount_discount) || 480), 0);
    const paymentMethodsBreakdown = {
      card: realPaidSales.filter((s) => s.payment_method_type === "card").length,
      oxxo: realPaidSales.filter((s) => s.payment_method_type === "oxxo").length,
      spei: realPaidSales.filter((s) => s.payment_method_type === "spei").length,
      coupon_100: couponSales.length,
      unpaid_attempts: unpaidOrAbandonedSales.length
    };
    const accountsWithCases = profiles.map((p) => {
      const userCase = cases.find((c) => c.user_id === p.id || c.id === p.id);
      const isClosed = userCase?.status === "closed";
      return {
        id: p.id,
        email: p.email || "Sin correo",
        displayName: p.display_name || p.email?.split("@")[0] || "Usuario",
        hasActiveAccess: p.has_active_access,
        caseId: userCase?.id || p.id,
        caseTitle: userCase?.title || "Expediente Principal",
        caseType: userCase?.case_type || "General",
        caseStatus: isClosed ? "closed" : "active",
        createdAt: p.created_at || (/* @__PURE__ */ new Date()).toISOString(),
        stripeCustomerId: p.stripe_customer_id || null
      };
    });
    const activeCasesCount = accountsWithCases.filter((a) => a.caseStatus === "active").length;
    const closedCasesCount = accountsWithCases.filter((a) => a.caseStatus === "closed").length;
    res.json({
      success: true,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      kpis: {
        totalRealRevenue,
        totalRealSalesCount: realPaidSales.length,
        totalCouponSalesCount: couponSales.length,
        totalGrossOrders: allSales.length,
        totalDiscountsGiven,
        totalRevenue: totalRealRevenue,
        // Real money entering bank
        totalSalesCount: allSales.length,
        paymentMethodsBreakdown,
        totalAccounts: profiles.length > 0 ? profiles.length : accountsWithCases.length,
        activeCases: activeCasesCount,
        closedCases: closedCasesCount,
        totalVaultDocuments: vaultDocsCount,
        totalInteractions: messagesCount
      },
      sales: allSales,
      accounts: accountsWithCases,
      systemHealth: {
        stripeConnected: !!stripeKey,
        supabaseConnected: !!supabaseUrl && !!serviceRoleKey,
        serverTime: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (error) {
    console.error("[HERMES OVERVIEW ERROR]:", error);
    res.status(500).json({ error: error.message || "Error al recopilar datos de control Hermes." });
  }
});
app.post("/api/v1/admin/hermes-toggle-case", hermesAuthMiddleware, async (req, res) => {
  try {
    const { caseId, userId, newStatus } = req.body;
    if (!caseId && !userId) {
      return res.status(400).json({ error: "caseId o userId son requeridos." });
    }
    const targetStatus = newStatus === "closed" ? "closed" : "active";
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase no est\xE1 configurado en el servidor." });
    }
    const { createClient: createClient2 } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient2(supabaseUrl, serviceRoleKey);
    let query = supabaseAdmin.from("legal_cases").update({
      status: targetStatus,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (caseId) {
      query = query.eq("id", caseId);
    } else if (userId) {
      query = query.eq("user_id", userId);
    }
    const { error: updateError } = await query;
    if (updateError) {
      console.error("[HERMES TOGGLE CASE ERROR]:", updateError);
      return res.status(500).json({ error: "Error al actualizar estado del caso en Supabase." });
    }
    console.log(`[HERMES] Caso ${caseId || userId} actualizado a estado: ${targetStatus}`);
    res.json({ success: true, caseId: caseId || userId, status: targetStatus });
  } catch (err) {
    console.error("[HERMES TOGGLE CASE ERROR]:", err);
    res.status(500).json({ error: err.message || "Error interno al alternar estado de caso." });
  }
});
app.get("/api/v1/admin/verify", authMiddleware, isAdminMiddleware, (req, res) => {
  res.json({ isAdmin: true, user: req.user.email });
});
app.get("/api/v1/admin/stats", authMiddleware, isAdminMiddleware, async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase Admin credentials not configured" });
    }
    const { createClient: createClient2 } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient2(supabaseUrl, serviceRoleKey);
    const { data: cases } = await supabaseAdmin.from("legal_cases").select("*");
    const { data: orders } = await supabaseAdmin.from("orders").select("*");
    const { data: profiles } = await supabaseAdmin.from("profiles").select("*");
    const totalCasesCount = (cases || []).length;
    const activeProfilesCount = (profiles || []).filter((p) => p.has_active_access).length;
    const totalOrders = orders || [];
    const totalRevenue = totalOrders.filter((o) => o.payment_status === "paid" || o.payment_status === "no_payment_required").reduce((sum, o) => sum + (o.amount_total ? o.amount_total / 100 : 480), 0);
    const stats = {
      totalCases: totalCasesCount,
      activeUsers: activeProfilesCount,
      paidOrders: totalOrders.length,
      totalRevenue
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
var chatHandler = async (req, res) => {
  try {
    debugLog(`Incoming chat request to ${req.url}`);
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      debugLog("Error: Invalid messages format");
      return res.status(400).json({ error: "Messages array is required" });
    }
    const userMessages = messages.filter((m) => m.role === "user" || m.role === "assistant");
    if (userMessages.length === 0) {
      return res.status(400).json({ error: "No valid user messages found" });
    }
    const lastMsg = userMessages[userMessages.length - 1];
    if (lastMsg.content && lastMsg.content.length > 3e3) {
      return res.status(400).json({ error: "Mensaje demasiado largo. L\xEDmite: 3000 caracteres." });
    }
    const forbiddenKeywords = ["write code", "javascript", "python", "hacking", "math problem", "solve equation"];
    const contentLower = lastMsg.content.toLowerCase();
    if (forbiddenKeywords.some((kw) => contentLower.includes(kw))) {
      return res.status(403).json({
        error: "Lo siento, mi capacidad est\xE1 limitada estrictamente al asesoramiento legal en Justino."
      });
    }
    const data = await generateResponse(userMessages);
    debugLog(`AI response generated successfully for ${req.url}`);
    res.json(data);
  } catch (error) {
    debugLog(`AI Proxy Error at ${req.url}: ${error.message}`);
    res.status(500).json({ error: error.message || "Internal AI Error" });
  }
};
app.post("/api/chat", authMiddleware, aiLimiter, chatHandler);
app.post("/api/v1/chat", authMiddleware, aiLimiter, chatHandler);
app.post("/api/v1/stripe/create-checkout", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "El correo electr\xF3nico es requerido." });
    const cleanEmail = String(email).trim().toLowerCase();
    const STRIPE_PAYMENT_LINK = process.env.STRIPE_PAYMENT_LINK || "https://buy.stripe.com/7sY14n64IaYV6id5Yb1Nu0d";
    const paymentUrl = `${STRIPE_PAYMENT_LINK}?prefilled_email=${encodeURIComponent(cleanEmail)}`;
    res.json({ url: paymentUrl, success: true });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    res.status(500).json({ error: error.message || "Error al conectar con Stripe." });
  }
});
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    env: process.env.NODE_ENV,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    keys: {
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      moonshot: !!process.env.MOONSHOT_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      supabase: !!process.env.VITE_SUPABASE_URL
    }
  });
});
app.all("/api/*", (req, res) => {
  debugLog(`[404] API Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: "Ruta de API no encontrada", path: req.url });
});
setupBlogRoutes(app);
var isServerless = !!process.env.VERCEL;
if (!isServerless && process.env.NODE_ENV !== "production") {
  debugLog("Starting in DEVELOPMENT mode with Vite middleware");
  import("vite").then(({ createServer: createViteServer }) => {
    return createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
  }).then((vite) => {
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://0.0.0.0:${PORT}`);
    });
  }).catch((err) => {
    console.error("Error starting Vite server:", err);
  });
} else {
  debugLog("Starting in PRODUCTION mode serving dist folder");
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (req.url.startsWith("/api/")) {
      return res.status(404).json({ error: "API not found" });
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}
var server_default = app;
export {
  server_default as default
};
