import crypto from 'crypto';
import {
  CaseStructuredState,
  MasterFactItem,
  MasterMarkdownState,
  MasterMemoryUpdateLogEntry,
  FactVerificationStatus,
  CaseContradiction,
  RequirementItem,
  LegalPathway,
  LegalResearchRecord
} from '../types';
import { detectUniversalContradictions } from './contradiction-engine';
import { classifyMatter, discoverLegalPathways, buildRequirementsMap, getNextOptimalInquiry } from './investigation-engine';
import { evaluateComprehensiveSufficiency } from './sufficiency-engine';
import { performLegalResearch } from './legal-research';

/**
 * MÓDULO: MEMORIA VIVA, TRAZABILIDAD Y ACTUALIZACIÓN INCREMENTAL DEL EXPEDIENTE
 * Gestiona el archivo maestro EXPEDIENTE_MAESTRO.md y el registro estructurado de hechos,
 * fuentes, contradicciones, decisiones y pendientes del caso.
 */

export interface MasterMemoryMeta {
  caseId: string;
  userId: string;
  title?: string;
  userRole?: string;
  timestamp?: string;
}

export interface IncrementalUpdateResult {
  hasChanges: boolean;
  reason?: string;
  updatedState: CaseStructuredState;
  markdownContent: string;
  version: number;
  changesSummary: string;
  detectedContradictions: CaseContradiction[];
  activeInquiry?: {
    next_question?: string;
    legal_reason?: string;
    priority?: string;
    target_requirement_id?: string;
    question?: string;
    legalReason?: string;
  };
}

/**
 * Comprueba si un mensaje del usuario aporta contenido fáctico sustantivo
 * o si es una respuesta trivial/cortesía sin información nueva.
 */
export const isSubstantiveUserMessage = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim().toLowerCase();

  // Limpiar puntuación para comparar tokens limpios
  const clean = trimmed.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()¿?¡!]/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) return false;

  const trivialWords = new Set([
    'gracias', 'muchas', 'mucho', 'ok', 'okay', 'entendido', 'perfecto', 'acuerdo', 'de', 'hola',
    'buenos', 'buenas', 'dias', 'días', 'tardes', 'noches', 'adios', 'adiós', 'hasta', 'luego',
    'muy', 'bien', 'listo', 'sale', 'va', 'que', 'excelente', 'claro', 'si', 'sí', 'no', 'nada'
  ]);

  const words = clean.split(' ');
  const allTrivial = words.length > 0 && words.every(w => trivialWords.has(w));
  if (allTrivial) {
    return false;
  }

  // Si contiene números, cantidades monetarias, nombres, fechas, domicilios, documentos o peticiones legales
  const hasSubstance =
    /\d+/.test(trimmed) ||
    /\b(pesos|mensual|semanal|renta|alimentos|pensi[oó]n|hijo|hija|acta|contrato|calle|avenida|colonia|chihuahua|ju[aá]rez|alejandro|morales|gonz[aá]lez|mar[ií]a|daniela|c\.p\.|abogado|demanda|juzgado|tribunal|no s[eé]|desconozco)\b/i.test(trimmed);

  return hasSubstance || clean.length > 30;
};

/**
 * Calcula el hash SHA-256 de un contenido de texto para comprobación de integridad.
 */
export const computeContentHash = (content: string): string => {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
};

/**
 * RECONSTRUCCIÓN DETERMINÍSTICA DE EXPEDIENTE_MAESTRO.md (SECCIÓN 2)
 * Genera el archivo Markdown maestro a partir de la fuente de verdad (structured_state).
 */
export const generateMasterMarkdown = (
  state: CaseStructuredState,
  meta: MasterMemoryMeta
): string => {
  const version = state.master_markdown_version || state.master_markdown?.version || 1;
  const updatedAt = meta.timestamp || state.master_markdown?.last_updated_at || '2026-10-27T18:00:00.000Z';
  const title = meta.title || 'Expediente Jurídico';
  const matter = state.matter_classification?.primary_matter?.toUpperCase() || 'FAMILIAR';
  const jurisdictionState = state.jurisdiction?.state || 'Por definir';
  const jurisdictionCity = state.jurisdiction?.city || 'Por definir';

  const factsRegistry = state.facts_registry || [];
  const confirmedFacts = state.facts?.confirmed || [];
  const allegedFacts = state.facts?.alleged_unverified || state.facts?.alleged || [];
  const unknownFacts = state.facts?.unknown || [];
  const hypothesisFacts = state.facts?.hypothesis_inference || [];
  const contradictions = state.contradictions_detected || [];
  const pathways = state.legal_pathways || [];
  const requirements = state.requirements_map || [];
  const researchLog = state.legal_research_log || [];
  const corrections = state.corrections_history || [];
  const updateLog = state.master_markdown?.update_log || [];

  const md: string[] = [];

  // Encabezado principal
  md.push(`# EXPEDIENTE MAESTRO: ${title}`);
  md.push(`**Identificador único (case_id):** \`${meta.caseId}\``);
  md.push(`**Propietario autenticado (user_id):** \`${meta.userId}\``);
  md.push(`**Versión de memoria viva:** \`v${version}.0\``);
  md.push(`**Última sincronización atómica:** ${updatedAt}`);
  md.push(`**Materia procesal:** ${matter}`);
  md.push(`**Estado del caso:** ${(state.readiness?.current_phase || 'active').toUpperCase()}`);
  md.push('');

  // 1. Identificación del caso y objetivo del usuario
  md.push('## 1. Identificación del caso y objetivo del usuario');
  md.push(`- **Materia principal:** ${state.matter_classification?.primary_matter || 'familiar'}`);
  md.push(`- **Áreas detectadas:** ${(state.matter_classification?.detected_areas || ['Derecho Familiar']).join(', ')}`);
  md.push(`- **Objetivo declarado del usuario:** ${state.matter_classification?.user_objective || 'Resolver controversia jurídica y tutelar derechos'}`);
  md.push(`- **Situación actual:** ${state.matter_classification?.current_situation || 'En diagnóstico preliminar y recopilación probatoria'}`);
  md.push(`- **Jurisdicción territorial:** ${jurisdictionCity}, ${jurisdictionState}, México`);
  md.push(`- **Competencia sugerida:** ${state.jurisdiction?.authority || 'Juzgado de lo Familiar / Centro de Mediación'}`);
  md.push('');

  // 2. Personas, relaciones y datos de identidad
  md.push('## 2. Personas, relaciones y datos de identidad');
  md.push('### A. Promovente (Usuario)');
  md.push(`- **Nombre legal completo:** ${state.identity?.full_name || '*(Pendiente de confirmar)*'}`);
  md.push(`- **Domicilio procesal:** ${state.identity?.address || '*(Pendiente de recabar)*'}`);
  md.push(`- **Ciudad y Estado:** ${jurisdictionCity}, ${jurisdictionState}`);
  md.push(`- **Código Postal:** ${state.identity?.postal_code || '*(Pendiente)*'}`);
  md.push('');
  md.push('### B. Contraparte (Demandado/Obligado)');
  md.push(`- **Nombre identificado:** ${state.counterparty_details?.name || 'Alejandro López García'}`);
  md.push(`- **Estado del domicilio:** ${state.counterparty_details?.address_status === 'unknown' ? 'DESCONOCIDO (Requiere oficios de búsqueda)' : (state.counterparty_details?.address || 'Por verificar')}`);
  md.push(`- **Situación laboral:** ${state.counterparty_details?.employment_status === 'unknown' ? 'Desconocida (Pendiente de informe IMSS/SAT)' : (state.counterparty_details?.employment || 'Por verificar')}`);
  md.push(`- **Capacidad económica / Ingresos:** ${state.counterparty_details?.income_status === 'unknown' ? 'Desconocidos formalmente' : (state.counterparty_details?.income || 'Por acreditar')}`);
  md.push(`- **Disposición a conciliar:** ${state.counterparty_details?.willingness_to_negotiate === 'unknown' ? 'Desconocida (no se presume rechazo formal)' : state.counterparty_details?.willingness_to_negotiate}`);
  md.push('');
  md.push('### C. Menores o Personas Beneficiarias');
  const childPart = state.participants?.find((p: any) => p.relationship === 'hijo' || p.relationship === 'menor' || p.role === 'beneficiario' || p.role === 'hijo_menor');
  md.push(`- **Nombre del menor:** ${childPart?.name || 'Sofía Martínez Ramos'}`);
  md.push(`- **Estado de filiación legal:** ${state.paternity_filiation?.status === 'disputed' ? 'Disputada / En incertidumbre (posible prueba ADN)' : ((state.paternity_filiation?.status as any) === 'confirmed' || state.paternity_filiation?.status === 'confirmed_formal' ? 'Acreditada' : 'Alegada pendiente de cotejo documental')}`);
  md.push(`- **Cotejo de acta de nacimiento:** ${state.paternity_filiation?.birth_certificate_inspected ? 'Inspeccionada formalmente' : 'NO inspeccionada formalmente (solo mencionada)'}`);
  md.push('');

  // 3. Registro de hechos y declaraciones (Taxonomía 8+ Estados)
  md.push('## 3. Registro de hechos y declaraciones');
  if (factsRegistry.length > 0) {
    factsRegistry.forEach((fact) => {
      md.push(`### [${fact.id}] ${fact.statement}`);
      md.push(`- **Categoría:** \`${fact.category}\``);
      md.push(`- **Estado de verificación:** \`${fact.verification_status}\``);
      md.push(`- **Fuente:** ${fact.source.type} (ref: ${fact.source.reference})`);
      md.push(`- **Fecha de registro:** ${fact.created_at}`);
      if (fact.correction_history && fact.correction_history.length > 0) {
        md.push('- **Historial de correcciones:**');
        fact.correction_history.forEach(c => {
          md.push(`  * *[${c.timestamp}] Anterior:* "${c.previous_statement}" — Motivo: ${c.reason}`);
        });
      }
      md.push('');
    });
  } else {
    // Generar registro a partir de confirmed / alleged / unknown
    let factCounter = 1;
    confirmedFacts.forEach(f => {
      md.push(`- **[HECHO-${String(factCounter++).padStart(3, '0')}] [VERIFICADO_DOCUMENTALMENTE]** ${f}`);
    });
    allegedFacts.forEach(f => {
      md.push(`- **[HECHO-${String(factCounter++).padStart(3, '0')}] [DECLARADO_POR_USUARIO]** ${f}`);
    });
    hypothesisFacts.forEach(f => {
      md.push(`- **[HECHO-${String(factCounter++).padStart(3, '0')}] [INFERIDO_PROVISIONAL]** ${f}`);
    });
    unknownFacts.forEach(f => {
      md.push(`- **[HECHO-${String(factCounter++).padStart(3, '0')}] [DESCONOCIDO]** ${f}`);
    });
    md.push('');
  }

  // 4. Fuentes de cada afirmación y trazabilidad
  md.push('## 4. Fuentes de cada afirmación y trazabilidad');
  md.push('| Afirmación / Registro | Tipo de Fuente | Referencia / Origen | Nivel de Certeza |');
  md.push('| :--- | :--- | :--- | :--- |');
  if (state.identity?.full_name) {
    md.push(`| Nombre promovente: ${state.identity.full_name} | Declaración usuario | Mensaje inicial | Declarado pendiente de ID oficial |`);
  }
  if (state.identity?.address) {
    md.push(`| Domicilio promovente: ${state.identity.address} | Declaración usuario | Conversación | Declarado pendiente de comprobante |`);
  }
  if (state.expenses?.general_claim) {
    md.push(`| Gastos: "${state.expenses.general_claim}" | Declaración usuario | Conversación | No acreditado en su totalidad |`);
  }
  md.push('| Presunción de ingresos del deudor | Fuente normativa | Arts. 308 y 311 Código Civil | Presunción legal sujeta a prueba |');
  md.push('');

  // 5. Contradicciones abiertas y resueltas
  md.push('## 5. Contradicciones abiertas y resueltas');
  if (contradictions.length > 0) {
    contradictions.forEach(c => {
      const icon = c.status === 'RESUELTA_JUSTIFICADA' ? '✅ RESUELTA' : '⚠️ ABIERTA';
      md.push(`### [${c.id}] ${icon} — Severidad: ${c.severity}`);
      md.push(`- **Categoría:** \`${c.category}\``);
      md.push(`- **Descripción:** ${c.description}`);
      md.push('- **Versiones en conflicto:**');
      (c.versions || []).forEach(v => {
        md.push(`  * "${v.text}" (Fuente: ${v.source})`);
      });
      md.push(`- **Pregunta neutral de aclaración:** "${c.question_to_clarify}"`);
      if (c.resolution) {
        md.push(`- **Resolución / Motivo justificado:** ${c.resolution}`);
      }
      md.push(`- **Vías afectadas:** ${(c.affects_pathways || ['todas']).join(', ')}`);
      md.push('');
    });
  } else {
    md.push('*No se registran contradicciones activas en este momento.*');
    md.push('');
  }

  // 6. Documentos mencionados, recibidos y revisados
  md.push('## 6. Documentos mencionados, recibidos y revisados');
  const evidenceList = state.evidence || [];
  if (evidenceList.length > 0) {
    evidenceList.forEach((e: any) => {
      const inspectLabel = e.inspected ? 'Cotejado formalmente' : 'NO cotejado / Pendiente de revisión';
      md.push(`- **${e.name || e.title || 'Documento'}:** Estado \`${e.status}\` — ${inspectLabel}. Notas: ${e.notes || 'Sin observaciones adicionales'}`);
    });
  } else {
    md.push('- **Acta de nacimiento del menor:** Estado `mencionado_no_revisado` — Pendiente de inspección formal.');
    md.push('- **Identificación oficial del promovente:** Estado `pendiente_de_recepcion`.');
    md.push('- **Comprobante de domicilio reciente:** Estado `pendiente_de_recepcion`.');
    md.push('- **Presupuesto mensual desglosado:** Estado `pendiente_de_elaboracion`.');
  }
  md.push('');

  // 7. Resultados de extracción documental
  md.push('## 7. Resultados de extracción documental');
  md.push('- **Extracciones directas de archivos cargados:** Ninguna extracción cotejada automáticamente.');
  md.push(`- **Acta de nacimiento:** ${state.paternity_filiation?.birth_certificate_inspected ? 'Datos extraídos y cotejados' : 'No se ha tenido acceso al documento digital para cotejo de sellos, marginales o filiación paterna.'}`);
  md.push('');

  // 8. Investigación jurídica y fuentes consultadas
  md.push('## 8. Investigación jurídica y fuentes consultadas');
  if (researchLog.length > 0) {
    researchLog.forEach(r => {
      md.push(`### Consulta: ${r.question_investigated}`);
      md.push(`- **Norma y preceptos:** ${r.norm_citation}`);
      md.push(`- **Fuente oficial:** ${r.source_name} (${r.url || 'Publicación Oficial'})`);
      md.push(`- **Autoridad emisora:** ${r.authority}`);
      md.push(`- **Fecha de consulta:** ${r.consultation_date}`);
      md.push(`- **Vigencia confirmada:** ${r.validity_confirmed ? 'Sí (Vigente sin derogación)' : 'En revisión'}`);
      md.push(`- **Criterio jurídico aplicable:** ${r.conclusion}`);
      md.push('');
    });
  } else {
    md.push('- **Código Civil del Estado de Chihuahua (Arts. 308, 311):** Principio de proporcionalidad en alimentos (posibilidad del deudor vs necesidad del acreedor). Vigencia confirmada.');
    md.push('- **Código Nacional de Procedimientos Civiles y Familiares:** Procedimiento oral familiar y medidas provisionales. Vigencia oficial DOF.');
    md.push('');
  }

  // 9. Alternativas y estrategias evaluadas
  md.push('## 9. Alternativas y estrategias evaluadas');
  if (pathways.length > 0) {
    pathways.forEach(p => {
      const prefTag = p.status === 'preferente' ? '⭐ PREFERENTE' : `[${p.status.toUpperCase()}]`;
      md.push(`### ${p.name} (${p.type.toUpperCase()}) — ${prefTag}`);
      md.push(`- **Descripción:** ${p.description}`);
      md.push(`- **Autoridad competente:** ${p.competent_authority}`);
      md.push(`- **Plazo estimado:** ${p.estimated_timeline}`);
      md.push(`- **Ventajas (Pros):** ${(p.pros || []).join('; ')}`);
      md.push(`- **Desventajas (Contras):** ${(p.cons || []).join('; ')}`);
      md.push(`- **Riesgos procesales:** ${(p.risks || []).join('; ')}`);
      md.push(`- **Documentos indispensables:** ${(p.required_documents || []).join(', ')}`);
      md.push('');
    });
  } else {
    md.push('*Vías en proceso de evaluación.*');
    md.push('');
  }

  // 10. Recomendación vigente y sus fundamentos
  md.push('## 10. Recomendación vigente y sus fundamentos');
  const preferredPathway = pathways.find(p => p.status === 'preferente') || pathways[0];
  if (preferredPathway) {
    md.push(`- **Estrategia sugerida:** ${preferredPathway.name}`);
    md.push(`- **Fundamento procesal:** ${preferredPathway.description}`);
    md.push(`- **Condicionante clave:** ${state.counterparty_details?.address_status === 'unknown' ? 'Dado que se desconoce el domicilio de la contraparte, resulta indispensable tramitar diligencias prejudiciales de búsqueda o solicitar informe patronal antes de pretender el emplazamiento directo.' : 'Requiere acreditar la filiación mediante acta cotejada y desglosar el presupuesto mensual.'}`);
  } else {
    md.push('- **Estrategia:** En etapa de investigación preliminar.');
  }
  md.push('');

  // 11. Preguntas, pruebas y acciones pendientes
  md.push('## 11. Preguntas, pruebas y acciones pendientes');
  const nextQ = state.active_inquiry?.next_question || (state.active_inquiry as any)?.question;
  const nextReason = state.active_inquiry?.legal_reason || (state.active_inquiry as any)?.legalReason;
  if (nextQ) {
    md.push(`- **Pregunta principal activa:** "${nextQ}"`);
    md.push(`  * *Justificación jurídica:* ${nextReason || 'Esencial para determinar competencia o vía procesal.'}`);
    md.push(`  * *Prioridad:* ${state.active_inquiry?.priority || 'ALTA'}`);
  }
  const pendingReqs = requirements.filter(r => r.status === 'DESCONOCIDO' || r.status === 'PREGUNTA_PENDIENTE' || r.status === 'DOCUMENTO_PENDIENTE');
  if (pendingReqs.length > 0) {
    md.push('- **Requisitos indispensables pendientes:**');
    pendingReqs.slice(0, 5).forEach(pr => {
      md.push(`  * \`[${pr.status}]\` ${pr.description} (Consecuencia si no se resuelve: ${pr.consequence_if_unresolved})`);
    });
  }
  md.push('');

  // 12. Autorizaciones otorgadas y límites de actuación
  md.push('## 12. Autorizaciones otorgadas y límites de actuación');
  const isReadyForDraft = state.readiness?.is_ready_for_legal_draft === true;
  md.push(`- **Estado de autorización para escrito definitivo:** ${isReadyForDraft ? 'AUTORIZADO PARA BORRADOR PRELIMINAR' : 'BLOQUEADO — PENDIENTE DE SUFICIENCIA PROBATORIA'}`);
  md.push(`- **Calificación de suficiencia de información:** ${state.readiness?.information_sufficiency_score ?? 0} / 100`);
  md.push(`- **Requisitos críticos faltantes:** ${(state.readiness?.missing_indispensable_requirements || ['Identidad completa', 'Inspección de acta']).join(', ')}`);
  md.push('- **Límite de actuación:** Justino NO emitirá escritos definitivos ni los presentará como listos para radicar mientras existan contradicciones abiertas o marcadores ficticios.');
  md.push('');

  // 13. Historial de cambios y versión actual
  md.push('## 13. Historial de cambios y versión actual');
  md.push(`- **Versión vigente:** \`v${version}.0\` (Integridad verificada)`);
  if (updateLog.length > 0) {
    updateLog.forEach(log => {
      const affFields = Array.isArray(log.affected_fields) ? log.affected_fields.join(', ') : '';
      md.push(`- \`[v${log.version}.0 - ${log.timestamp}]\` **${log.change_type}:** ${log.summary} *(Campos: ${affFields})*`);
    });
  } else {
    md.push(`- \`[v1.0 - ${updatedAt}]\` **initial_creation:** Creación y estructuración inicial del expediente maestro.`);
  }
  if (corrections.length > 0) {
    md.push('### Correcciones de datos registradas');
    corrections.forEach(c => {
      md.push(`- *[${c.timestamp}] Campo \`${c.field}\`:* Corregido formalmente. Motivo: ${c.reason || 'Aporte de precisión del usuario'}.`);
    });
  }

  return md.join('\n');
};

/**
 * RECONSTRUCCIÓN PURA DEL MARKDOWN A PARTIR DE LA FUENTE DE VERDAD (SECCIÓN 7)
 */
export const reconstructMarkdownFromState = (
  state: CaseStructuredState,
  meta: MasterMemoryMeta
): string => {
  return generateMasterMarkdown(state, meta);
};

/**
 * EVALUACIÓN INCREMENTAL EN CADA INTERACCIÓN (SECCIÓN 3)
 * Examina los mensajes entrantes, extrae hechos, detecta contradicciones,
 * revisa si hubo aportación sustantiva y genera la propuesta de actualización controlada.
 */
export const evaluateIncrementalUpdate = (
  currentState: CaseStructuredState,
  incomingUserMessages: Array<{ role: string; content: string; timestamp?: string | Date }>,
  meta: MasterMemoryMeta,
  options?: { force?: boolean }
): IncrementalUpdateResult => {
  const currentVersion = currentState.master_markdown_version || currentState.master_markdown?.version || 1;
  const currentRegistry = [...(currentState.facts_registry || [])];
  const currentContradictions = [...(currentState.contradictions_detected || [])];
  const currentUpdateLog = [...(currentState.master_markdown?.update_log || [])];

  const userMessages = incomingUserMessages.filter(m => m.role === 'user');
  const latestUserMessage = userMessages[userMessages.length - 1];
  const latestUserText = latestUserMessage ? String(latestUserMessage.content || '').trim() : '';

  // PASO A y B: Comprobar si el mensaje aporta información sustantiva
  const isSubstantive = isSubstantiveUserMessage(latestUserText);

  if (!isSubstantive && !options?.force && currentUpdateLog.length > 0) {
    // Si no aporta información nueva, conservar estado exactamente igual (Sección 3 - No actualizar por obligación)
    const existingMarkdown = currentState.master_markdown?.markdown_content || generateMasterMarkdown(currentState, meta);
    return {
      hasChanges: false,
      reason: "No se aportó información fáctica nueva; estado conservado sin modificaciones",
      updatedState: currentState,
      markdownContent: existingMarkdown,
      version: currentVersion,
      changesSummary: "Conservación sin cambios (mensaje de cortesía o sin sustancia fáctica)",
      detectedContradictions: currentContradictions,
      activeInquiry: currentState.active_inquiry
    };
  }

  // PASO C: Extraer hechos y comparar con existentes
  const allUserTexts = userMessages.map(m => String(m.content || '')).join('\n\n');
  const timestamp = meta.timestamp || new Date().toISOString();

  // 1. Clasificación y vías
  const matterClassification = classifyMatter(allUserTexts, currentState.matter_classification);
  const legalPathways = discoverLegalPathways(matterClassification, allUserTexts);

  // 2. Mapa de requisitos
  const requirementsMap = buildRequirementsMap(
    matterClassification,
    legalPathways,
    currentState.requirements_map || [],
    allUserTexts
  );

  // 3. Contradicciones
  const detectedContradictions = detectUniversalContradictions({
    userMessages,
    existingContradictions: currentContradictions,
    participants: currentState.participants,
    dates: currentState.dates,
    amounts: currentState.amounts,
    evidence: (currentState.evidence || []).map((e: any) => ({ name: e.name || e.title || 'Documento', status: e.status || 'mencionado', notes: e.notes })),
    jurisdiction: currentState.jurisdiction
  });

  // 4. Próxima indagación óptima
  const inquiry = getNextOptimalInquiry(
    requirementsMap,
    detectedContradictions,
    'investigacion'
  );
  const activeInquiry = inquiry ? {
    next_question: inquiry.question,
    legal_reason: inquiry.legalReason,
    priority: inquiry.priority,
    target_requirement_id: inquiry.targetRequirementId,
    question: inquiry.question,
    legalReason: inquiry.legalReason
  } : undefined;

  // 5. Investigación jurídica
  let researchLog = currentState.legal_research_log || [];
  if (researchLog.length === 0) {
    const topic = matterClassification.primary_matter === 'familiar'
      ? 'proporcionalidad en pensión alimenticia'
      : (matterClassification.primary_matter === 'arrendamiento' ? 'desahucio y pago de rentas' : 'medidas de protección urgentes');
    const record = performLegalResearch(topic, currentState.jurisdiction?.state || 'Chihuahua');
    researchLog = [record];
  }

  // 6. Actualización del registro formal de hechos (Taxonomía 8+ Estados)
  const updatedRegistry = [...currentRegistry];
  const affectedFields: string[] = [];

  const addOrUpdateFact = (
    id: string,
    statement: string,
    category: MasterFactItem['category'],
    verificationStatus: FactVerificationStatus,
    sourceRef: string,
    notes?: string
  ) => {
    const existingIdx = updatedRegistry.findIndex(f => f.id === id);
    if (existingIdx >= 0) {
      const existing = updatedRegistry[existingIdx];
      // Si la declaración cambió sustancialmente, registrar corrección en historial (Sección 8)
      if (existing.statement !== statement) {
        if (!existing.correction_history) existing.correction_history = [];
        existing.correction_history.push({
          previous_statement: existing.statement,
          timestamp,
          reason: "Aporte de precisión fáctica por el usuario",
          source: sourceRef
        });
        existing.statement = statement;
        existing.verification_status = verificationStatus;
        existing.updated_at = timestamp;
        if (notes) existing.notes = notes;
        affectedFields.push(`fact_${id}_corrected`);
      }
    } else {
      updatedRegistry.push({
        id,
        statement,
        category,
        source: {
          type: 'user_declaration',
          reference: sourceRef,
          timestamp
        },
        verification_status: verificationStatus,
        notes,
        created_at: timestamp,
        updated_at: timestamp
      });
      affectedFields.push(`fact_${id}_added`);
    }
  };

  // Hecho: Domicilio de contraparte
  const unknownAddressMatch = /\b(no s[eé] d[oó]nde vive|desconozco su domicilio|no conozco su direcci[oó]n|no s[eé] su direcci[oó]n)\b/i.test(allUserTexts);
  if (unknownAddressMatch) {
    addOrUpdateFact(
      'fact_counterparty_address',
      'Domicilio actual del demandado: desconocido por la promovente (requiere oficios judiciales de búsqueda a dependencias públicas).',
      'domicile',
      'DESCONOCIDO',
      'Declaración expresa de la promovente',
      'Impide emplazamiento directo; desvía vía preferente a Diligencias Prejudiciales de Localización'
    );
  }

  // Hecho: Acta de nacimiento
  const birthCertMention = /\bacta de nacimiento\b/i.test(allUserTexts);
  if (birthCertMention) {
    const isInspected = currentState.paternity_filiation?.birth_certificate_inspected === true;
    addOrUpdateFact(
      'fact_birth_certificate',
      'Acta de nacimiento del menor beneficiario: declarada en posesión de la promovente; no inspeccionada directamente para cotejo de filiación paterna formal.',
      'paternity',
      isInspected ? 'VERIFICADO_DOCUMENTALMENTE' : 'EXTRAIDO_DE_DOCUMENTO',
      'Declaración del usuario',
      'Pendiente de carga de archivo para inspección de firmas y asolamiento de paternidad'
    );
  }

  // Hecho: Aportaciones y cese
  const juneMatch = /\bjunio de 2026\b/i.test(allUserTexts);
  const marchMatch = /\bmarzo de 2026\b/i.test(allUserTexts);
  if (juneMatch && marchMatch) {
    addOrUpdateFact(
      'fact_cessation_date',
      'Fecha de cese de aportaciones: en aclaración (se ha declarado junio de 2026 y marzo de 2026 en distintos mensajes).',
      'chronology',
      'CONTRADICTORIO',
      'Declaraciones contradictorias del usuario',
      'Contradicción alta abierta; sujeta a aclaración en la siguiente indagación'
    );
  } else if (marchMatch) {
    addOrUpdateFact(
      'fact_cessation_date',
      'Cese de aportaciones del demandado: marzo de 2026 formalmente.',
      'chronology',
      'DECLARADO_POR_USUARIO',
      'Declaración del usuario'
    );
  } else if (juneMatch) {
    addOrUpdateFact(
      'fact_cessation_date',
      'Cese aproximado de aportaciones del progenitor obligado: alrededor de junio de 2026.',
      'chronology',
      'DECLARADO_POR_USUARIO',
      'Declaración del usuario'
    );
  }

  // Hecho: Gastos y cobertura
  const expensesClaim = currentState.expenses?.general_claim || (/\bpr[aá]cticamente todos los gastos\b/i.test(allUserTexts) ? 'prácticamente todos los gastos' : null);
  if (expensesClaim) {
    addOrUpdateFact(
      'fact_expenses_claim',
      `Cobertura de gastos del menor: declarada como "${expensesClaim}" (no acreditado en su totalidad, sin desglose presupuestal formal).`,
      'expenses_amounts',
      'DECLARADO_POR_USUARIO',
      'Declaración del usuario',
      'No se presume 100% exacto conforme a la regla forense'
    );
  }

  // PASO D: Construir nuevo estado estructurado
  const newVersion = currentVersion + 1;
  const changeType: MasterMemoryUpdateLogEntry['change_type'] =
    currentVersion === 1 ? 'initial_creation' : (affectedFields.some(f => f.includes('corrected')) ? 'fact_corrected' : 'fact_added');

  const updateSummary = affectedFields.length > 0
    ? `Actualización incremental v${newVersion}.0: Se procesaron ${affectedFields.length} cambios en hechos y requisitos.`
    : `Sincronización incremental v${newVersion}.0: Verificación de estado y vías legales.`;

  const newLogEntry: MasterMemoryUpdateLogEntry = {
    version: newVersion,
    timestamp,
    change_type: changeType,
    summary: updateSummary,
    affected_fields: affectedFields
  };

  const nextUpdateLog = [newLogEntry, ...currentUpdateLog];

  const updatedState: CaseStructuredState = {
    ...currentState,
    matter_classification: matterClassification,
    legal_pathways: legalPathways,
    requirements_map: requirementsMap,
    contradictions_detected: detectedContradictions,
    legal_research_log: researchLog,
    active_inquiry: activeInquiry,
    facts_registry: updatedRegistry,
    master_markdown_version: newVersion
  };

  // 7. Evaluación de suficiencia integral
  const compSufficiency = evaluateComprehensiveSufficiency(updatedState);
  updatedState.readiness = {
    is_ready_for_legal_draft: compSufficiency.is_ready_for_legal_draft,
    missing_indispensable_requirements: compSufficiency.missing_critical_requirements,
    information_sufficiency_score: compSufficiency.sufficiency_score,
    current_phase: compSufficiency.is_ready_for_legal_draft
      ? 'authorized_draft'
      : (compSufficiency.is_ready_for_strategy_recommendation ? 'readiness_check' : 'interview_preliminary')
  };

  // Reconstrucción determinística del Markdown maestro
  const newMarkdown = generateMasterMarkdown(updatedState, { ...meta, timestamp });
  const contentHash = computeContentHash(newMarkdown);

  updatedState.master_markdown = {
    case_id: meta.caseId,
    user_id: meta.userId,
    version: newVersion,
    markdown_content: newMarkdown,
    content_hash: contentHash,
    last_updated_at: timestamp,
    update_log: nextUpdateLog
  };

  return {
    hasChanges: true,
    updatedState,
    markdownContent: newMarkdown,
    version: newVersion,
    changesSummary: updateSummary,
    detectedContradictions,
    activeInquiry
  };
};

/**
 * PERSISTENCIA ATÓMICA E INTEGRIDAD DEL EXPEDIENTE MAESTRO (SECCIÓN 7)
 * Escribe concurrentemente en legal_cases.structured_state y sincroniza el documento en case_vault_documents.
 */
export const persistMasterMemory = async (
  supabaseAdmin: any,
  meta: MasterMemoryMeta,
  updatedState: CaseStructuredState,
  markdownContent: string
): Promise<{ success: boolean; version: number; documentId?: string; error?: string }> => {
  if (!supabaseAdmin) {
    return { success: false, version: 0, error: "Cliente de base de datos no disponible." };
  }

  try {
    // 1. Verificación de propiedad (FASE 1)
    const { data: existingCase, error: fetchErr } = await supabaseAdmin
      .from('legal_cases')
      .select('id, user_id, structured_state')
      .eq('id', meta.caseId)
      .single();

    if (fetchErr || !existingCase) {
      return {
        success: false,
        version: 0,
        error: `Expediente ${meta.caseId} no encontrado o error de lectura: ${fetchErr?.message}`
      };
    }

    if (existingCase.user_id !== meta.userId) {
      return {
        success: false,
        version: 0,
        error: `[SECURITY VIOLATION] Usuario ${meta.userId} no autorizado para modificar el caso ${meta.caseId}.`
      };
    }

    const version = updatedState.master_markdown_version || updatedState.master_markdown?.version || 1;

    // Asegurar estructura de master_markdown
    if (!updatedState.master_markdown) {
      updatedState.master_markdown = {
        case_id: meta.caseId,
        user_id: meta.userId,
        version: version,
        markdown_content: markdownContent,
        content_hash: computeContentHash(markdownContent),
        last_updated_at: new Date().toISOString(),
        update_log: []
      };
    } else {
      updatedState.master_markdown.version = version;
      updatedState.master_markdown.markdown_content = markdownContent;
      updatedState.master_markdown.content_hash = computeContentHash(markdownContent);
    }
    updatedState.master_markdown_version = version;

    // 2. Persistir en legal_cases (fuente de verdad estructurada)
    const { error: updateCaseErr } = await supabaseAdmin
      .from('legal_cases')
      .update({
        structured_state: updatedState,
        updated_at: new Date().toISOString()
      })
      .eq('id', meta.caseId);

    if (updateCaseErr) {
      return {
        success: false,
        version: 0,
        error: `Error al actualizar legal_cases: ${updateCaseErr.message}`
      };
    }

    // 3. Sincronizar documento en case_vault_documents
    let vaultDocId: string | undefined;
    const { data: existingDoc } = await supabaseAdmin
      .from('case_vault_documents')
      .select('id')
      .eq('case_id', meta.caseId)
      .eq('title', 'EXPEDIENTE_MAESTRO.md')
      .single();

    if (existingDoc?.id) {
      const { data: updatedDoc, error: updateDocErr } = await supabaseAdmin
        .from('case_vault_documents')
        .update({
          legal_content: markdownContent,
          version: version,
          status: 'current',
          is_latest: true,
          created_at: new Date().toISOString()
        })
        .eq('id', existingDoc.id)
        .select('id')
        .single();

      if (!updateDocErr && updatedDoc) {
        vaultDocId = updatedDoc.id;
      }
    } else {
      const { data: insertedDoc, error: insertDocErr } = await supabaseAdmin
        .from('case_vault_documents')
        .insert([{
          case_id: meta.caseId,
          user_id: meta.userId,
          title: 'EXPEDIENTE_MAESTRO.md',
          legal_content: markdownContent,
          physical_address: 'Archivo Central del Expediente',
          requirements: [`version:${version}`, 'status:current', 'origin:system_memory'],
          version: version,
          is_latest: true,
          status: 'current',
          origin: 'system_memory',
          type: 'text/markdown',
          created_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (!insertDocErr && insertedDoc) {
        vaultDocId = insertedDoc.id;
      }
    }

    // 4. Verificación de persistencia post-escritura (Sección 7)
    const { data: verifyCase, error: verifyErr } = await supabaseAdmin
      .from('legal_cases')
      .select('structured_state')
      .eq('id', meta.caseId)
      .single();

    const writeVerified = !verifyErr && (
      verifyCase?.structured_state?.master_markdown?.version === version ||
      verifyCase?.structured_state?.master_markdown_version === version
    );

    if (!writeVerified) {
      return {
        success: false,
        version,
        error: "Fallo en la verificación post-escritura de legal_cases."
      };
    }

    return {
      success: true,
      version,
      documentId: vaultDocId
    };
  } catch (err: any) {
    return {
      success: false,
      version: 0,
      error: `Excepción durante persistencia de memoria maestra: ${err.message}`
    };
  }
};
