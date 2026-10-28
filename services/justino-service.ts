import { Message, CaseSummary, Attachment, GroundingSource } from "../types";
import { supabase } from "./supabaseClient";

// 1) Interfaces de Dominio Empresarial para Casos y Bóveda
export interface LegalCase {
  id?: string;
  user_id?: string;
  title: string;
  case_type?: string;
  status?: string;
  state_jurisdiction?: string;
  city_jurisdiction?: string;
  victim_name?: string;
  aggressor_name?: string;
  economic_claim_amount?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CaseMessage {
  id?: string;
  case_id?: string;
  user_id?: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: GroundingSource[] | string[];
  created_at?: string;
}

export interface CaseVaultDocument {
  id?: string;
  case_id?: string;
  user_id?: string;
  title: string;
  legal_content?: string;
  physical_address?: string;
  requirements?: string[];
  type?: string;
  url?: string;
  path?: string;
  origin?: 'generated' | 'uploaded';
  created_at?: string;
}

// Helper to get auth header safely without hanging on browser locks
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (supabase) {
    try {
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) => 
        setTimeout(() => resolve({ data: { session: null } }), 1500)
      );
      const res: any = await Promise.race([sessionPromise, timeoutPromise]);
      const session = res?.data?.session;
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
        headers["x-user-id"] = session.user.id;
      }
    } catch (e) {
      console.warn("Could not retrieve Supabase session token:", e);
    }
  }

  // Fallback to cached token in localStorage if getSession timed out or lock was congested
  if (!headers["Authorization"] && typeof localStorage !== 'undefined') {
    const cachedToken = localStorage.getItem('justino_access_token');
    if (cachedToken) {
      headers["Authorization"] = `Bearer ${cachedToken}`;
    }
  }

  const localUsername = typeof localStorage !== 'undefined' ? localStorage.getItem('justino_username') : null;
  if (localUsername && !headers["x-user-id"]) {
    headers["x-user-id"] = localUsername;
  }
  return headers;
};

// --- VALIDACIÓN DOCUMENTAL ANTI-PLACEHOLDERS, JURISDICCIÓN E IDENTIDAD (FASE 4 & FASE 8) ---
export const validateDocumentContent = (
  content: string, 
  title?: string,
  caseContext?: {
    expectedJurisdiction?: { state?: string | null; city?: string | null };
    expectedIdentity?: { full_name?: string | null };
    structuredState?: any;
  }
): { isValid: boolean; missingFields: string[]; reason?: string } => {
  const missingFields: string[] = [];

  if (!content || content.trim().length < 120) {
    return {
      isValid: false,
      missingFields: ["Extensión insuficiente para un escrito formal"],
      reason: "El escrito es demasiado breve para cumplir con la estructura forense legal requerida."
    };
  }

  // 1. Detectar corchetes de relleno [ ... ]
  const bracketMatches = content.match(/\[[^\]\n]+\]/g);
  if (bracketMatches && bracketMatches.length > 0) {
    const offending = bracketMatches.filter(b => 
      !b.toLowerCase().includes('documento_oficial') &&
      !b.toLowerCase().includes('archivo') &&
      !b.toLowerCase().includes('evidencia')
    );
    if (offending.length > 0) {
      offending.forEach(b => missingFields.push(`Placeholder: ${b}`));
    }
  }

  // 2. Detectar textos de relleno conocidos sin corchetes
  const commonPlaceholders = [
    { pattern: /\bTU CALLE\b/i, name: "Calle y número del promovente" },
    { pattern: /\bTU N[UÚ]MERO\b/i, name: "Número exterior/interior" },
    { pattern: /\bTU COLONIA\b/i, name: "Colonia del domicilio" },
    { pattern: /\bTU C\.?P\.?\b/i, name: "Código Postal" },
    { pattern: /\bPOR DEFINIR\b/i, name: "Dato sin definir" },
    { pattern: /\bNOMBRE DEL DEMANDADO\b/i, name: "Nombre del demandado" },
    { pattern: /\bDOMICILIO DEL DEMANDADO\b/i, name: "Domicilio del demandado" },
    { pattern: /\bFECHA DE HOY\b/i, name: "Fecha de emisión" },
    { pattern: /\bNOMBRE COMPLETO\b/i, name: "Nombre completo" }
  ];

  for (const item of commonPlaceholders) {
    if (item.pattern.test(content) || (title && item.pattern.test(title))) {
      missingFields.push(item.name);
    }
  }

  // 3. FASE 7: Validación de fecha temporal (Bloquear fechas de entrenamiento como mayo de 2024)
  const legacyDateRegex = /\b(?:23 de mayo de 2024|mayo de 2024|mayo 2024|2024\b)/i;
  // Solo bloquear si la fecha 2024 aparece en el cierre/firma de emisión del escrito
  const proemioClosing = content.slice(-300);
  if (legacyDateRegex.test(proemioClosing)) {
    missingFields.push("Fecha de emisión inválida (Se detectó año 2024 en lugar del año en curso 2026)");
  }

  // 4. FASE 4: Validación de Jurisdicción (Evitar suplantación por Ciudad de México)
  const targetState = caseContext?.expectedJurisdiction?.state || caseContext?.structuredState?.jurisdiction?.state;
  if (targetState && targetState.toLowerCase().includes('chihuahua')) {
    const cdmxViolations = [
      "ciudad de méxico",
      "cdmx",
      "distrito federal",
      "tribunal superior de justicia de la ciudad de méxico",
      "código civil para el distrito federal"
    ];
    const contentLower = content.toLowerCase();
    for (const v of cdmxViolations) {
      if (contentLower.includes(v)) {
        missingFields.push(`Inconsistencia de Jurisdicción: El documento cita "${v}" pero la jurisdicción formal del caso es Chihuahua`);
        break;
      }
    }
  }

  // 5. FASE 5: Validación de Identidad (Verificar que el promovente coincide)
  const targetFullName = caseContext?.expectedIdentity?.full_name || caseContext?.structuredState?.identity?.full_name;
  if (targetFullName && targetFullName.length > 3 && targetFullName !== 'Usuario') {
    const contentLower = content.toLowerCase();
    const nameLower = targetFullName.toLowerCase();
    if (!contentLower.includes(nameLower)) {
      missingFields.push(`Inconsistencia de Identidad: El documento no individualiza a la promovente titular "${targetFullName}"`);
    }
  }

  // 6. TEST11: Validación de Hechos de Gastos (Prohibición de conversión a 100%)
  const isExact100 = caseContext?.structuredState?.expenses?.is_exact_100_percent;
  if (isExact100 === false) {
    const claimsExact100Regex = /\b(?:100% de los gastos|cien por ciento de los gastos|la totalidad del 100%|el 100% de las necesidades)\b/i;
    if (claimsExact100Regex.test(content)) {
      missingFields.push("Inconsistencia en gastos: El escrito afirma el '100% de los gastos' cuando la promovente sólo declaró cubrir 'prácticamente todos' sin cuantificación exacta");
    }
  }

  // 7. TEST11: Validación de Filiación e Inspección de Acta
  const birthCertInspected = caseContext?.structuredState?.paternity_filiation?.birth_certificate_inspected;
  if (birthCertInspected === false) {
    const claimsPaternityEstablishedRegex = /\b(?:se acredita la filiaci[oó]n con el acta de nacimiento debidamente cotejada|con el acta de nacimiento agregada que demuestra el reconocimiento formal)\b/i;
    if (claimsPaternityEstablishedRegex.test(content)) {
      missingFields.push("Inconsistencia en filiación: El acta de nacimiento solo ha sido mencionada y no se encuentra cotejada ni inspeccionada físicamente");
    }
  }

  // 8. TEST11: Proporcionalidad vs Porcentaje Fijo de Pensión
  const fixedPercentageRegex = /\b(?:la ley (?:fija|impone|obliga a|establece) un (?:30%|40%|35%)|fijar el 30% obligatorio|fijar el 40% forzoso)\b/i;
  if (fixedPercentageRegex.test(content)) {
    missingFields.push("Error de fundamentación: La pensión alimenticia en México se rige por el principio de proporcionalidad, no por porcentajes fijos automáticos");
  }

  // 9. TEST11: Domicilio del Demandado Desconocido
  const counterpartyAddressStatus = caseContext?.structuredState?.counterparty_details?.address_status;
  if (counterpartyAddressStatus === 'unknown') {
    const fictitiousAddrRegex = /\b(?:con domicilio en calle [^\n]+|con domicilio conocido en [^\n]+)\b/i;
    // Si no contiene petitorio o capítulo de solicitud de oficios de búsqueda
    const hasSearchPetition = /\b(?:oficios? de b[uú]squeda|solicito girar oficio|al instituto nacional electoral|al imss|al sat|notificaci[oó]n por edictos)\b/i.test(content);
    if (!hasSearchPetition && fictitiousAddrRegex.test(content)) {
      missingFields.push("Inconsistencia procesal: El domicilio del demandado es desconocido; el escrito debe solicitar formalmente oficios de localización (INE/SAT/IMSS) o emplazamiento por edictos");
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    reason: missingFields.length > 0
      ? `El documento contiene datos pendientes o inconsistencias: ${missingFields.join(', ')}`
      : undefined
  };
};

// Evaluación de suficiencia previa a autorización de documentos (TEST11 Puerta de Autorización)
export const validateDocumentSufficiency = (
  structuredState: any,
  docType: string = 'demanda_alimentos'
): { isReady: boolean; missingRequirements: string[]; reason?: string } => {
  if (!structuredState) {
    return {
      isReady: false,
      missingRequirements: ["Estado estructurado no inicializado"],
      reason: "No se encontró el estado estructurado del expediente."
    };
  }

  // 1. Bloqueo por contradicciones abiertas (Sección 6 & 8)
  const openContradictions = (structuredState.contradictions_detected || []).filter(
    (c: any) => c.status === 'DETECTADA' && (c.severity === 'CRITICA' || c.severity === 'ALTA')
  );

  const readiness = structuredState.readiness || { is_ready_for_legal_draft: false, missing_indispensable_requirements: [] };
  const missing = [...(readiness.missing_indispensable_requirements || [])];

  if (openContradictions.length > 0) {
    openContradictions.forEach((c: any) => missing.push(`Inconsistencia sin resolver: ${c.description}`));
  }

  const isReady = Boolean(readiness.is_ready_for_legal_draft) && openContradictions.length === 0;

  return {
    isReady,
    missingRequirements: missing,
    reason: isReady 
      ? undefined 
      : (openContradictions.length > 0
          ? `No es posible emitir un documento definitivo mientras existan contradicciones críticas o altas abiertas: ${openContradictions.map((c: any) => c.description).join('; ')}`
          : `No es posible emitir un documento definitivo porque faltan requisitos indispensables: ${missing.join(', ')}`)
  };
};

// 2) Funciones de Servicio de Casos y Bóveda (Supabase)

export const listCases = async (userId: string): Promise<LegalCase[]> => {
  if (!supabase) throw new Error("Supabase client is not initialized");
  const { data, error } = await supabase
    .from('legal_cases')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// FASE 14: Creación de Nuevo Caso formal sin reabrir casos concluidos
export const createNewCase = async (
  userId: string, 
  title?: string, 
  stateJurisdiction?: string, 
  cityJurisdiction?: string
): Promise<LegalCase> => {
  // 1. Intentar endpoint backend con autenticación
  try {
    const headers = await getAuthHeaders();
    if (headers["Authorization"]) {
      const response = await fetch("/api/v1/cases/new", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: title || `Nuevo Expediente Legal`,
          stateJurisdiction: stateJurisdiction || 'Nacional / México',
          cityJurisdiction: cityJurisdiction || 'Por definir'
        })
      });
      if (response.ok) {
        const resData = await response.json();
        if (resData.case) return resData.case;
      }
    }
  } catch (backendErr) {
    console.warn("Backend createNewCase notice, falling back to direct Supabase insert:", backendErr);
  }

  // 2. Fallback directo a Supabase
  if (!supabase) throw new Error("Supabase client is not initialized");
  const { data, error } = await supabase
    .from('legal_cases')
    .insert([{
      user_id: userId,
      title: title || `Expediente Legal`,
      case_type: 'general',
      status: 'active',
      state_jurisdiction: stateJurisdiction || 'Nacional / México',
      city_jurisdiction: cityJurisdiction || 'Por definir',
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createCase = async (userId: string, caseData: Partial<LegalCase>): Promise<LegalCase> => {
  if (!supabase) throw new Error("Supabase client is not initialized");
  const { data, error } = await supabase
    .from('legal_cases')
    .insert([{
      ...caseData,
      user_id: userId,
      status: caseData.status || 'active',
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// FASE 1.3: Cierre Real del Caso en Supabase
export const closeCase = async (caseId: string, userId: string): Promise<boolean> => {
  const now = new Date().toISOString();
  
  // 1. Intentar endpoint de backend autenticado
  try {
    const headers = await getAuthHeaders();
    if (headers["Authorization"]) {
      const response = await fetch("/api/v1/cases/close", {
        method: "POST",
        headers,
        body: JSON.stringify({ caseId })
      });
      if (response.ok) {
        return true;
      }
    }
  } catch (backendErr) {
    console.warn("Backend closeCase notice, trying direct Supabase update:", backendErr);
  }

  // 2. Direct Supabase update fallback
  if (supabase) {
    try {
      const { error } = await supabase
        .from('legal_cases')
        .update({
          status: 'closed',
          closed_at: now,
          updated_at: now
        })
        .eq('id', caseId)
        .eq('user_id', userId);

      if (error) {
        // Fallback si la columna closed_at no ha sido migrada aún
        await supabase
          .from('legal_cases')
          .update({
            status: 'closed',
            updated_at: now
          })
          .eq('id', caseId)
          .eq('user_id', userId);
      }
      return true;
    } catch (dbErr) {
      console.error("Error updating legal_cases status:", dbErr);
    }
  }
  return false;
};

// FASE 1.2: Obtener Estado del Caso como Fuente de Verdad
export const getCaseStatus = async (caseId?: string, userId?: string): Promise<{ status: string; isClosed: boolean; closedAt?: string | null }> => {
  if (!supabase || !userId) return { status: 'active', isClosed: false };

  try {
    let query = supabase.from('legal_cases').select('status, closed_at').eq('user_id', userId);
    if (caseId) {
      query = query.eq('id', caseId);
    }
    const { data, error } = await query.order('updated_at', { ascending: false }).limit(1);

    if (error || !data || data.length === 0) {
      return { status: 'active', isClosed: false };
    }

    const current = data[0];
    const isClosed = current.status === 'closed';
    return {
      status: current.status || 'active',
      isClosed,
      closedAt: current.closed_at || null
    };
  } catch (err) {
    console.warn("Could not retrieve case status from DB:", err);
    return { status: 'active', isClosed: false };
  }
};

export const addCaseMessage = async (caseId: string, userId: string, message: CaseMessage): Promise<CaseMessage> => {
  if (!supabase) throw new Error("Supabase client is not initialized");
  const { data, error } = await supabase
    .from('case_messages')
    .insert([{
      case_id: caseId,
      user_id: userId,
      role: message.role,
      content: message.content,
      sources: message.sources || []
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const saveVaultDocument = async (caseId: string, userId: string, doc: CaseVaultDocument): Promise<CaseVaultDocument> => {
  if (!supabase) throw new Error("Supabase client is not initialized");

  // Validación anti-placeholders si es generado
  if (doc.origin === 'generated') {
    const val = validateDocumentContent(doc.legal_content || '', doc.title);
    if (!val.isValid) {
      throw new Error(val.reason || "Documento rechazado por contener campos incompletos.");
    }
  }

  const { data, error } = await supabase
    .from('case_vault_documents')
    .insert([{
      case_id: caseId,
      user_id: userId,
      title: doc.title,
      legal_content: doc.legal_content || '',
      physical_address: doc.physical_address || '',
      requirements: doc.requirements || [],
      type: doc.type || 'application/pdf',
      url: doc.url || null,
      path: doc.path || null,
      origin: doc.origin || 'generated'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 3) Subida a Storage y persistencia en case_vault_documents con Versionado
export const uploadToVault = async (
  userId: string,
  name: string,
  type: string,
  content: string,
  origin: 'generated' | 'uploaded' = 'generated',
  caseId?: string
) => {
  if (!supabase) throw new Error("Supabase client is not initialized");

  // Validar contenido anti-placeholders si es generado
  if (origin === 'generated') {
    const val = validateDocumentContent(content, name);
    if (!val.isValid) {
      throw new Error(val.reason || "El documento contiene placeholders pendientes y no puede archivarse como oficial.");
    }
  }

  const filename = `${Date.now()}_${name.replace(/\s+/g, '_')}`;
  const path = `${userId}/${filename}`;
  let publicUrl = "";

  try {
    let fileBody: any;
    if (content.startsWith('data:')) {
      const response = await fetch(content);
      fileBody = await response.blob();
    } else {
      fileBody = content;
    }

    const { error: uploadError } = await supabase.storage
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
    console.warn("Storage upload notice:", storageErr);
  }

  const effectiveCaseId = caseId;
  if (!effectiveCaseId) {
    throw new Error("No se puede subir ni registrar documento a la Bóveda: caseId es obligatorio.");
  }

  // FASE 4.5: CONTROL DE VERSIONES DOCUMENTALES
  let nextVersion = 1;
  let previousDocId: string | null = null;

  try {
    const { data: existingDocs } = await supabase
      .from('case_vault_documents')
      .select('id, title, requirements')
      .eq('case_id', effectiveCaseId)
      .eq('title', name)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingDocs && existingDocs.length > 0) {
      const prevDoc = existingDocs[0] as any;
      previousDocId = prevDoc.id;
      let prevVer = 1;
      if (Array.isArray(prevDoc.requirements)) {
        prevDoc.requirements.forEach((r: string) => {
          if (typeof r === 'string' && r.startsWith('version:')) {
            prevVer = Number(r.split(':')[1]) || 1;
          }
        });
      }
      nextVersion = prevVer + 1;

      // Marcar documento anterior como superseded
      try {
        await supabase
          .from('case_vault_documents')
          .update({ is_latest: false, status: 'superseded' })
          .eq('id', previousDocId);
      } catch (e) {
        // Fallback updating requirements array
        await supabase
          .from('case_vault_documents')
          .update({
            requirements: [`version:${prevVer}`, `status:superseded`, `superseded_by:${nextVersion}`]
          })
          .eq('id', previousDocId);
      }
    }
  } catch (verErr) {
    console.warn("Version lookup notice:", verErr);
  }

  // Intentar inserción con columnas de versionado completas
  const payloadFull: any = {
    case_id: effectiveCaseId,
    user_id: userId,
    title: name,
    legal_content: origin === 'generated' ? content : '',
    physical_address: '',
    requirements: [`version:${nextVersion}`, `status:current`, `origin:${origin}`],
    type,
    path: path || null,
    url: publicUrl || null,
    origin,
    version: nextVersion,
    is_latest: true,
    status: 'current',
    supersedes_document_id: previousDocId
  };

  const { data, error: dbError } = await supabase
    .from('case_vault_documents')
    .insert([payloadFull])
    .select()
    .single();

  if (dbError) {
    // Fallback seguro en caso de que las columnas nuevas aún no existan en el esquema de Supabase
    const payloadBase: any = {
      case_id: effectiveCaseId,
      user_id: userId,
      title: name,
      legal_content: origin === 'generated' ? content : '',
      physical_address: '',
      requirements: [
        `version:${nextVersion}`,
        `status:current`,
        `origin:${origin}`,
        previousDocId ? `supersedes:${previousDocId}` : null
      ].filter(Boolean)
    };
    const { data: fallbackData, error: fallbackErr } = await supabase
      .from('case_vault_documents')
      .insert([payloadBase])
      .select()
      .single();

    if (fallbackErr) throw fallbackErr;
    return { ...fallbackData, version: nextVersion, is_latest: true, status: 'current', origin };
  }

  return data;
};

// 4) Instrucción Maestra del Prompt de Justino
const SYSTEM_INSTRUCTION = `
ERES "JUSTINO", EL GUIADOR Y ASISTENTE LEGAL DIGITAL LÍDER EN MÉXICO.
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
   - Los títulos, nombres, firmas y encabezados del escrito legal deben escribirse en texto plano limpio o en MAYÚSCULAS normales (ejemplo: "HECHOS", "DENUNCIA PENAL", "PROTESTO LO NECESARIO", "C. AGENTE DEL MINISTERIO PÚBLICO", "SAMUEL SOLIS AYALA"). NUNCA pongas "**HECHOS**" ni "**SAMUEL SOLIS AYALA**".

6. PROHIBICIÓN ABSOLUTA DE MOSTRAR EL CUERPO DEL DOCUMENTO EN EL CHAT:
   - TIENES ESTRICTAMENTE PROHIBIDO escribir, transcribir, mostrar o redactar el cuerpo o texto del escrito legal en los párrafos visibles del chat.
   - El escrito legal completo debe ir ÚNICAMENTE Y EXCLUSIVAMENTE adentro del tag técnico de salida al final de tu mensaje:
     [DOCUMENTO_OFICIAL: Título del Documento | Contenido formal y técnico completo del escrito listo para imprimir y firmar | Dirección física exacta con juzgado, calle, número y colonia en la ciudad del usuario]
   - REGLA DEL CARÁCTER TUBERÍA: DENTRO DEL CONTENIDO DEL DOCUMENTO NO USES EL CARÁCTER '|' (tubería/pipe) bajo ninguna circunstancia.

7. INDICACIONES OBLIGATORIAS EN LA VENTANA DE CHAT (DESPUÉS DE GENERAR EL DOCUMENTO):
   En tu mensaje visible en el chat (fuera del tag técnico), debes incluir EXCLUSIVAMENTE:
   a) Una explicación sencilla de qué es el documento y para qué sirve.
   b) La notificación clara y explícita de que su documento oficial 100% completo ha sido guardado automáticamente en su BÓVEDA DIGITAL dentro de la plataforma, donde podrá revisarlo, descargarlo e imprimirlo listo para firmar.
   c) La ubicación e indicaciones de EXACTAMENTE DÓNDE ENTREGAR EL DOCUMENTO: Nombre oficial de la autoridad (ej. Fiscalía Especializada en Justicia para Adolescentes del Estado de Chihuahua), dirección física real completa (calle, número, colonia, C.P., ciudad).
   d) Las instrucciones exactas de QUÉ LLEVAR al acudir (ej. el documento impreso firmado de su puño y letra, 2 copias adicionales para acuse de traslado, identificación oficial INE y documentos comprobatorios originales).

8. PROHIBICIÓN ABSOLUTA DE BUCLES O LISTAS EXTENSAS DE ARTÍCULOS:
   - TIENES ESTRICTAMENTE PROHIBIDO enumerar o listar secuencias de números de artículos (por ejemplo, JAMÁS escribas "artículos 1, 2, 3, 4, 5... 428" ni "artículos 1 al 200").
   - Cita ÚNICAMENTE entre 2 y 4 artículos específicos, reales y directamente aplicables al escrito (por ejemplo: "artículos 16 y 20, apartado C, de la Constitución Política de los Estados Unidos Mexicanos, y artículos 1 y 14 de la Ley Nacional del Sistema Integral de Justicia Penal para Adolescentes").

9. PROHIBICIÓN ABSOLUTA DE PROMETER "VICTORIA" O "CONSTRUIR TU VICTORIA":
   - TIENES ESTRICTAMENTE PROHIBIDO usar las palabras "victoria", "triunfo", "construir tu victoria", "garantizar el resultado" o prometer cualquier fallo judicial.
   - En su lugar, usa un lenguaje enfocado en el proceso y la estrategia: "trazar tu ruta legal", "dar un paso firme y formal", "hacer valer los derechos que la ley otorga a tus hijos", "avanzar con total claridad".

10. PROHIBICIÓN CRÍTICA DE DERIVACIÓN A ABOGADOS EXTERNOS:
    - TIENES ESTRICTAMENTE PROHIBIDO sugerir, recomendar o insinuar que el usuario busque, contrate o acuda con un abogado humano, despacho particular o defensoría legal externa.
    - Los usuarios acuden a Justino para EVITAR a los abogados por desconfianza y altos costos.
    - TÚ eres su guía legal completo. Tú redactas sus escritos y le das las instrucciones exactas para que el usuario o usuaria realice sus trámites directamente por su propia cuenta ("pro se") de manera segura, rápida y formal.
`;

export const sendMessageToJustino = async (
  message: string, 
  history: Message[],
  attachment?: Attachment,
  userName?: string,
  caseId?: string
): Promise<{text: string, sources: GroundingSource[], caseStatus?: string}> => {
  try {
    const headers = await getAuthHeaders();
    const nameContext = userName ? `\n\nDATOS DEL CLIENTE:\nEl usuario con quien hablas prefiere que le llames "${userName}". Dirígete a él o ella por su nombre con calidez, respeto y empatía.` : '';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch("/api/v1/chat", {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: "deepseek-chat",
        userName: userName,
        caseId: caseId,
        messages: [
          { role: "system", content: `${SYSTEM_INSTRUCTION}${nameContext}` },
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

    clearTimeout(timeoutId);

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
      sources: [],
      caseStatus: data.caseStatus
    };
  } catch (error: any) {
    console.error("Justino SaaS Engine Error:", error);
    throw error;
  }
};

export const generateCaseSummary = async (messages: Message[]): Promise<CaseSummary> => {
  try {
    const headers = await getAuthHeaders();

    // FASE 6: Filtrar rigurosamente los hechos del usuario vs análisis del asistente
    const userOnlyFacts = messages
      .filter(m => m.sender === 'user')
      .map(m => `- ${m.text}`)
      .slice(-15)
      .join('\n');

    const botAdvice = messages
      .filter(m => m.sender === 'bot' && m.id !== 'welcome')
      .map(m => `- ${m.text}`)
      .slice(-3)
      .join('\n');

    const response = await fetch("/api/v1/chat", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { 
            role: "user", 
            content: `Actúa como un actuario legal mexicano imparcial y riguroso.
Tu misión es resumir este expediente legal diferenciando estrictamente entre HECHOS NARRADOS POR EL USUARIO y RECOMENDACIONES TÉCNICAS DEL ASISTENTE.
REGLA CRÍTICA: Las opiniones, hipótesis o sugerencias del asistente legal NUNCA deben catalogarse como antecedentes o hechos del usuario.

HECHOS NARRADOS POR EL USUARIO (FUENTE DE ANTECEDENTES):
${userOnlyFacts || 'Sin antecedentes expresados aún'}

ANÁLISIS Y ESTRATEGIA SUGERIDA POR EL ASISTENTE:
${botAdvice || 'En análisis preliminar'}

Devuelve EXCLUSIVAMENTE JSON con esta estructura exacta:
{
  "antecedents": ["hecho verificado narrado por el usuario 1", "hecho narrado 2"],
  "recommendedActions": ["paso legal recomendado 1", "paso legal recomendado 2"]
}` 
          }
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
      antecedents: Array.isArray(parsed.antecedents) ? parsed.antecedents : [],
      recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
      lastUpdated: new Date()
    };
  } catch (e) {
    console.error("Summary error:", e);
    return { antecedents: [], recommendedActions: [], lastUpdated: new Date() };
  }
};
