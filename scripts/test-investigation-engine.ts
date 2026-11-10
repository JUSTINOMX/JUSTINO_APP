import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { extractCandidateFacts } from '../services/ai-provider';
import { classifyMatter, discoverLegalPathways, buildRequirementsMap, getNextOptimalInquiry } from '../services/investigation-engine';
import { detectUniversalContradictions, resolveContradictionProtocol } from '../services/contradiction-engine';
import { performLegalResearch } from '../services/legal-research';
import { evaluateComprehensiveSufficiency } from '../services/sufficiency-engine';
import { knowledgeBase } from '../services/knowledge-base';
import { validateDocumentContent, validateDocumentSufficiency } from '../services/justino-service';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://mock-supabase-local.internal';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key-for-local-testing';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

interface AuditScenarioResult {
  code: string;
  name: string;
  expected: string;
  actual: string;
  evidence: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  severity: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA' | 'INFO';
  regressionCheck: string;
}

async function runInvestigationTestSuite() {
  console.log("====================================================================");
  console.log("JUSTINO AI LEGAL // BATERÍA DE PRUEBAS DE INVESTIGACIÓN JURÍDICA");
  console.log("ESCENARIOS OBLIGATORIOS A - L (SECCIÓN 14)");
  console.log("====================================================================\n");

  const results: AuditScenarioResult[] = [];

  // ============================================================================
  // PRUEBA A — Discrepancia de apellidos
  // ============================================================================
  try {
    const msgs = [
      { role: "user", content: "El padre es Alejandro López García y mi hija se llama Sofía Martínez Ramos." }
    ];
    const contradictions = detectUniversalContradictions({ userMessages: msgs });
    const surnameMismatch = contradictions.find(c => c.id === 'contra_surname_filiation_mismatch');

    const passed = Boolean(
      surnameMismatch &&
      surnameMismatch.status === 'DETECTADA' &&
      surnameMismatch.severity === 'ALTA' &&
      surnameMismatch.question_to_clarify.includes('Sofía Martínez')
    );

    results.push({
      code: "PRUEBA A",
      name: "Discrepancia de apellidos entre padre e hija detectada sin inferir falsedad automática",
      expected: "Detectar discrepancia de apellidos, clasificarla como ALTA y formular pregunta neutral",
      actual: surnameMismatch ? `Detectada [${surnameMismatch.severity}]: ${surnameMismatch.description}` : "No detectada",
      evidence: surnameMismatch ? `Pregunta neutral: "${surnameMismatch.question_to_clarify}"` : "Sin evidencia",
      status: passed ? "PASS" : "FAIL",
      severity: "ALTA",
      regressionCheck: "JUS-INV-01 (Filiation surname check)"
    });
  } catch (e: any) {
    results.push({
      code: "PRUEBA A",
      name: "Discrepancia de apellidos",
      expected: "Detección",
      actual: e.message,
      evidence: "Error",
      status: "FAIL",
      severity: "ALTA",
      regressionCheck: "JUS-INV-01"
    });
  }

  // ============================================================================
  // PRUEBA B — Cronología contradictoria
  // ============================================================================
  try {
    const msgs = [
      { role: "user", content: "Alejandro dejó de aportar en junio de 2026." },
      { role: "assistant", content: "¿Podrías darme más detalles?" },
      { role: "user", content: "Sí, el cese definitivo de pagos ocurrió en marzo de 2026." }
    ];
    const contradictions = detectUniversalContradictions({ userMessages: msgs });
    const dateConflict = contradictions.find(c => c.id === 'contra_dates_cessation_conflict');

    const passed = Boolean(
      dateConflict &&
      dateConflict.status === 'DETECTADA' &&
      dateConflict.versions.length >= 2
    );

    results.push({
      code: "PRUEBA B",
      name: "Cronología contradictoria con dos fechas diferentes para el mismo acontecimiento",
      expected: "Detectar las 2 fechas y plantear pregunta neutral sin elegir silenciosamente una",
      actual: dateConflict ? `Detectada inconsistencia: ${dateConflict.description}` : "No detectada",
      evidence: dateConflict ? `Versiones contrastadas: [${dateConflict.versions.map(v => v.text).join(' vs ')}]` : "Sin versiones",
      status: passed ? "PASS" : "FAIL",
      severity: "ALTA",
      regressionCheck: "JUS-INV-02 (Chronological consistency)"
    });
  } catch (e: any) {
    results.push({
      code: "PRUEBA B",
      name: "Cronología contradictoria",
      expected: "Detección",
      actual: e.message,
      evidence: "Error",
      status: "FAIL",
      severity: "ALTA",
      regressionCheck: "JUS-INV-02"
    });
  }

  // ============================================================================
  // PRUEBA C — Monto inconsistente
  // ============================================================================
  try {
    const msgs = [
      { role: "user", content: "Pagaba una renta de 5,000 pesos mensuales pero me estuvo entregando 1,500 semanales." }
    ];
    const contradictions = detectUniversalContradictions({ userMessages: msgs });
    const mathConflict = contradictions.find(c => c.id === 'contra_amount_periodicity_math');

    const passed = Boolean(mathConflict && mathConflict.category === 'quantities_math');

    results.push({
      code: "PRUEBA C",
      name: "Inconsistencia de montos y periodicidades (mensual vs semanal)",
      expected: "Detectar discrepancia de cálculo entre $5,000/mes y $1,500/semana ($6,500/mes)",
      actual: mathConflict ? `Detectada discrepancia matemática: ${mathConflict.description}` : "No detectada",
      evidence: mathConflict ? `Pregunta asignada: "${mathConflict.question_to_clarify}"` : "Sin evidencia",
      status: passed ? "PASS" : "FAIL",
      severity: "MEDIA",
      regressionCheck: "JUS-INV-03 (Mathematical periodicity check)"
    });
  } catch (e: any) {
    results.push({
      code: "PRUEBA C",
      name: "Monto inconsistente",
      expected: "Detección matemática",
      actual: e.message,
      evidence: "Error",
      status: "FAIL",
      severity: "MEDIA",
      regressionCheck: "JUS-INV-03"
    });
  }

  // ============================================================================
  // PRUEBA D — Documento no revisado
  // ============================================================================
  try {
    const msgs = [
      { role: "user", content: "Tengo el acta de nacimiento de mi hijo y con eso ya se demuestra todo." }
    ];
    const state = extractCandidateFacts(msgs);
    const reqItem = state.requirements_map?.find((r: any) => r.id === 'req_birth_cert_status');
    const evidenceItem = state.evidence?.find((e: any) => e.name?.toLowerCase().includes('acta'));

    const notInspected = state.paternity_filiation.birth_certificate_inspected === false;
    const isUnverifiedStatus = evidenceItem?.status === 'mentioned_unverified';
    const reqNotFullyVerified = reqItem?.status !== 'VERIFICADO_DOCUMENTALMENTE';

    const passed = Boolean(notInspected && isUnverifiedStatus && reqNotFullyVerified);

    results.push({
      code: "PRUEBA D",
      name: "Distinción entre existencia declarada de un documento y su contenido no cotejado",
      expected: "Marcar acta como mencionada no inspeccionada (NO como formalmente verificada)",
      actual: `evidence.status=${evidenceItem?.status}, inspected=${state.paternity_filiation.birth_certificate_inspected}, req.status=${reqItem?.status}`,
      evidence: `Nota de evidencia: "${evidenceItem?.notes || 'Mencionada sin cotejo'}"`,
      status: passed ? "PASS" : "FAIL",
      severity: "ALTA",
      regressionCheck: "JUS-INV-04 (Documentary status separation)"
    });
  } catch (e: any) {
    results.push({
      code: "PRUEBA D",
      name: "Documento no revisado",
      expected: "Distinción",
      actual: e.message,
      evidence: "Error",
      status: "FAIL",
      severity: "ALTA",
      regressionCheck: "JUS-INV-04"
    });
  }

  // ============================================================================
  // PRUEBA E — Identidad incompleta
  // ============================================================================
  try {
    const msgs = [
      { role: "user", content: "Hola, necesito demandar a mi expareja por alimentos en Chihuahua." }
    ];
    const state = extractCandidateFacts(msgs);
    const promoventeReq = state.requirements_map?.find((r: any) => r.id === 'req_promovente_identity');

    const nameIsNull = state.identity.full_name === null;
    const reqIsPending = promoventeReq?.status === 'DESCONOCIDO' || promoventeReq?.status === 'PREGUNTA_PENDIENTE';
    const notReady = state.readiness.is_ready_for_legal_draft === false;

    const passed = Boolean(nameIsNull && reqIsPending && notReady);

    results.push({
      code: "PRUEBA E",
      name: "Identidad incompleta no se inventa ni se asume confirmada",
      expected: "state.identity.full_name es null y req_promovente_identity permanece en DESCONOCIDO",
      actual: `full_name=${state.identity.full_name}, reqStatus=${promoventeReq?.status}, isReady=${state.readiness.is_ready_for_legal_draft}`,
      evidence: `Faltantes críticos: ${state.readiness.missing_indispensable_requirements.join(', ')}`,
      status: passed ? "PASS" : "FAIL",
      severity: "CRITICA",
      regressionCheck: "JUS-INV-05 (Identity completeness)"
    });
  } catch (e: any) {
    results.push({
      code: "PRUEBA E",
      name: "Identidad incompleta",
      expected: "No inventar",
      actual: e.message,
      evidence: "Error",
      status: "FAIL",
      severity: "CRITICA",
      regressionCheck: "JUS-INV-05"
    });
  }

  // ============================================================================
  // PRUEBA F — Vía jurídica alternativa
  // ============================================================================
  try {
    const msgs = [
      { role: "user", content: "Quiero resolver el pago de pensión de mi hijo con su papá Alejandro." }
    ];
    const state = extractCandidateFacts(msgs);
    const pathways = state.legal_pathways || [];

    const hasAtLeastTwo = pathways.length >= 2;
    const hasJudicial = pathways.some((p: any) => p.type === 'judicial');
    const hasExtrajudicial = pathways.some((p: any) => p.type === 'extrajudicial');
    const hasProsAndCons = pathways.every((p: any) => p.pros.length > 0 && p.cons.length > 0);

    const passed = Boolean(hasAtLeastTwo && hasJudicial && hasExtrajudicial && hasProsAndCons);

    results.push({
      code: "PRUEBA F",
      name: "Identificación y balance de vías alternativas (Judicial vs Mediación Extrajudicial)",
      expected: "Generar al menos 2 vías contrastadas con pros, contras, riesgos y autoridad",
      actual: `Generadas ${pathways.length} vías: [${pathways.map((p: any) => `${p.name} (${p.type})`).join(', ')}]`,
      evidence: `Pros vía judicial: ${pathways[0]?.pros.join('; ')} | Pros vía CEJA: ${pathways[1]?.pros.join('; ')}`,
      status: passed ? "PASS" : "FAIL",
      severity: "ALTA",
      regressionCheck: "JUS-INV-06 (Alternative pathways balance)"
    });
  } catch (e: any) {
    results.push({
      code: "PRUEBA F",
      name: "Vías alternativas",
      expected: "Generar 2 vías",
      actual: e.message,
      evidence: "Error",
      status: "FAIL",
      severity: "ALTA",
      regressionCheck: "JUS-INV-06"
    });
  }

  // ============================================================================
  // PRUEBA G — Cambio de estrategia ante nueva información
  // ============================================================================
  try {
    // Al declarar que no sabe dónde vive la contraparte, se activa la vía prejudicial de búsqueda
    const msgs = [
      { role: "user", content: "Quiero demandar a Alejandro pero no sé dónde vive ni conozco su dirección." }
    ];
    const state = extractCandidateFacts(msgs);
    const pathways = state.legal_pathways || [];
    const searchPathway = pathways.find((p: any) => p.id === 'via_familiar_prejudicial_busqueda');

    const searchIsPreferred = searchPathway?.status === 'preferente';
    const addressStatusUnknown = state.counterparty_details.address_status === 'unknown';

    const passed = Boolean(searchPathway && searchIsPreferred && addressStatusUnknown);

    results.push({
      code: "PRUEBA G",
      name: "Cambio dinámico de estrategia: domicilio desconocido activa diligencias prejudiciales de búsqueda",
      expected: "Desviar estrategia preferente a diligencias prejudiciales de localización",
      actual: `via_busqueda_status=${searchPathway?.status}, counterparty_addr=${state.counterparty_details.address_status}`,
      evidence: `Vía preferente asignada: "${searchPathway?.name}" ante ${searchPathway?.competent_authority}`,
      status: passed ? "PASS" : "FAIL",
      severity: "ALTA",
      regressionCheck: "JUS-INV-07 (Dynamic strategy pivot)"
    });
  } catch (e: any) {
    results.push({
      code: "PRUEBA G",
      name: "Cambio de estrategia",
      expected: "Pivote dinámico",
      actual: e.message,
      evidence: "Error",
      status: "FAIL",
      severity: "ALTA",
      regressionCheck: "JUS-INV-07"
    });
  }

  // ============================================================================
  // PRUEBA H — Investigación jurídica en tiempo real
  // ============================================================================
  try {
    const research = performLegalResearch("proporcionalidad en pensión alimenticia", "Chihuahua");

    const hasSource = Boolean(research.source_name && research.url);
    const hasNorm = research.norm_citation.includes("Código Civil");
    const isConfirmed = research.validity_confirmed === true;
    const hasDate = research.consultation_date.length > 5;

    const passed = Boolean(hasSource && hasNorm && isConfirmed && hasDate);

    results.push({
      code: "PRUEBA H",
      name: "Investigación jurídica con cotejo de fuente oficial, artículo y fecha de consulta",
      expected: "Registrar norma oficial (Art. 311 Código Civil), URL y confirmación de vigencia",
      actual: `Norma: ${research.norm_citation}, Fuente: ${research.source_name}, Vigente: ${research.validity_confirmed}`,
      evidence: `Cita: "${research.conclusion}" (Fecha de consulta: ${research.consultation_date})`,
      status: passed ? "PASS" : "FAIL",
      severity: "ALTA",
      regressionCheck: "JUS-INV-08 (Official legal research logging)"
    });
  } catch (e: any) {
    results.push({
      code: "PRUEBA H",
      name: "Investigación jurídica",
      expected: "Cotejo oficial",
      actual: e.message,
      evidence: "Error",
      status: "FAIL",
      severity: "ALTA",
      regressionCheck: "JUS-INV-08"
    });
  }

  // ============================================================================
  // PRUEBA I — Persistencia del expediente estructurado entre sesiones
  // ============================================================================
  try {
    const testUserId = "053921a3-dfb9-45e1-9d09-e190878c001d";
    const initialStructuredState = {
      matter_classification: { primary_matter: 'familiar', is_provisional: false },
      facts: { confirmed: ["Promovente vive en Chihuahua"], alleged_unverified: [], unknown: [] },
      contradictions_detected: [
        { id: 'c1', severity: 'ALTA', status: 'DETECTADA', description: 'Fecha contradictoria' }
      ],
      requirements_map: [
        { id: 'req_promovente_identity', status: 'DECLARADO_POR_USUARIO' }
      ]
    };

    // Guardar en Supabase
    const { data: createdCase, error: createErr } = await supabaseAdmin.from('legal_cases').insert([{
      user_id: testUserId,
      title: "Expediente Persistencia Audit",
      case_type: "familiar",
      state_jurisdiction: "Chihuahua",
      city_jurisdiction: "Chihuahua",
      status: "active",
      structured_state: initialStructuredState,
      updated_at: new Date().toISOString()
    }]).select().single();

    if (createErr) throw createErr;

    // Simular "recarga" leyendo de nuevo desde la base de datos
    const { data: reloadedCase, error: reloadErr } = await supabaseAdmin
      .from('legal_cases')
      .select('structured_state')
      .eq('id', createdCase.id)
      .single();

    if (reloadErr) throw reloadErr;

    const restoredContradiction = reloadedCase.structured_state?.contradictions_detected?.[0]?.description === 'Fecha contradictoria';
    const restoredReq = reloadedCase.structured_state?.requirements_map?.[0]?.status === 'DECLARADO_POR_USUARIO';

    // Limpieza
    await supabaseAdmin.from('legal_cases').delete().eq('id', createdCase.id);

    const passed = Boolean(restoredContradiction && restoredReq);

    results.push({
      code: "PRUEBA I",
      name: "Persistencia completa de hechos, contradicciones y mapa de requisitos tras recarga",
      expected: "Recuperar íntegramente contradicciones y mapa de requisitos desde legal_cases.structured_state",
      actual: `restoredContradiction=${restoredContradiction}, restoredReq=${restoredReq}`,
      evidence: `Estado recargado con ${reloadedCase.structured_state?.contradictions_detected?.length} contradicciones y ${reloadedCase.structured_state?.requirements_map?.length} requisitos`,
      status: passed ? "PASS" : "FAIL",
      severity: "CRITICA",
      regressionCheck: "JUS-INV-09 (Database persistence of structured state)"
    });
  } catch (e: any) {
    results.push({
      code: "PRUEBA I",
      name: "Persistencia",
      expected: "Persistencia",
      actual: e.message,
      evidence: "Error",
      status: "FAIL",
      severity: "CRITICA",
      regressionCheck: "JUS-INV-09"
    });
  }

  // ============================================================================
  // PRUEBA J — Aislamiento estricto entre usuarios y privacidad en conocimiento
  // ============================================================================
  try {
    const userA = "053921a3-dfb9-45e1-9d09-e190878c001d";
    const userB = "45dad389-e500-48fd-8a06-74b860f03b80";

    const caseParticularA = knowledgeBase.isolateCaseParticularKnowledge(
      "case-123",
      userA,
      ["Daniela Fernanda Ríos Salazar vive en Calle Juárez 400"],
      ["Acta_001.pdf"]
    );

    // Registro de nuevo patrón con anonimización (Class B)
    const newPattern = knowledgeBase.registerLearningPattern(
      "familiar",
      "Conflicto de alimentos de Daniela Ríos en CP 31000",
      ["req_alimentos_1"],
      ["Discrepancia detectada"],
      ["Desviar a CEJA"]
    );

    // Comprobar que el nombre 'Daniela' o números de CP fueron sanitizados en el patrón global
    const patternContainsPII = newPattern.pattern_name.includes("Daniela") || newPattern.pattern_name.includes("31000");
    const isolatedOwnerIsUserA = caseParticularA.user_id === userA;

    const passed = Boolean(!patternContainsPII && isolatedOwnerIsUserA);

    results.push({
      code: "PRUEBA J",
      name: "Aislamiento estricto por usuario y sanitización anti-PII en la base de conocimiento",
      expected: "Datos particulares aislados a User A; patrones globales anonimizan nombres y domicilios",
      actual: `patternContainsPII=${patternContainsPII}, patternName="${newPattern.pattern_name}"`,
      evidence: `Patrón sanitizado: "${newPattern.pattern_name}" (Class B) | Expediente particular User A: ${caseParticularA.user_id}`,
      status: passed ? "PASS" : "FAIL",
      severity: "CRITICA",
      regressionCheck: "JUS-INV-10 (Privacy isolation and anti-PII learning)"
    });
  } catch (e: any) {
    results.push({
      code: "PRUEBA J",
      name: "Aislamiento y privacidad",
      expected: "Sin PII",
      actual: e.message,
      evidence: "Error",
      status: "FAIL",
      severity: "CRITICA",
      regressionCheck: "JUS-INV-10"
    });
  }

  // ============================================================================
  // PRUEBA K — Criterio de suficiencia para recomendar estrategia
  // ============================================================================
  try {
    const incompleteState: any = {
      matter_classification: { primary_matter: 'familiar', user_objective: 'Alimentos' },
      identity: { full_name: "Daniela Fernanda Ríos Salazar", address: null },
      legal_pathways: [
        { id: 'p1', name: 'Juicio de Alimentos', type: 'judicial', pros: ['Embargo'], cons: ['Largo'], risks: ['Demora'], status: 'preferente' }
      ],
      requirements_map: [
        { id: 'req_minor_identity', description: 'Nombre del menor', importance: 'CRITICA', status: 'DESCONOCIDO' },
        { id: 'req_expenses_budget', description: 'Presupuesto mensual', importance: 'ALTA', status: 'DESCONOCIDO' }
      ],
      contradictions_detected: [
        { id: 'c1', severity: 'CRITICA', status: 'DETECTADA', description: 'Discrepancia grave de filiación' }
      ]
    };

    const sufficiency = evaluateComprehensiveSufficiency(incompleteState);

    const strategyBlocked = sufficiency.is_ready_for_strategy_recommendation === false;
    const draftBlocked = sufficiency.is_ready_for_legal_draft === false;
    const hasCriticalContradiction = sufficiency.open_critical_contradictions.length > 0;

    const passed = Boolean(strategyBlocked && draftBlocked && hasCriticalContradiction);

    results.push({
      code: "PRUEBA K",
      name: "Evaluación integral de suficiencia bloquea diagnóstico y redacción ante vacíos críticos",
      expected: "is_ready_for_strategy: false y is_ready_for_legal_draft: false mientras haya vacíos o contradicciones",
      actual: `strategyReady=${sufficiency.is_ready_for_strategy_recommendation}, draftReady=${sufficiency.is_ready_for_legal_draft}, score=${sufficiency.sufficiency_score}`,
      evidence: `Contradicciones abiertas: ${sufficiency.open_critical_contradictions.join('; ')}`,
      status: passed ? "PASS" : "FAIL",
      severity: "CRITICA",
      regressionCheck: "JUS-INV-11 (Comprehensive sufficiency gating)"
    });
  } catch (e: any) {
    results.push({
      code: "PRUEBA K",
      name: "Criterio de suficiencia",
      expected: "Bloqueo por insuficiencia",
      actual: e.message,
      evidence: "Error",
      status: "FAIL",
      severity: "CRITICA",
      regressionCheck: "JUS-INV-11"
    });
  }

  // ============================================================================
  // PRUEBA L — Puerta de autorización documental y verificación de guardado
  // ============================================================================
  try {
    const stateWithOpenContradiction: any = {
      readiness: { is_ready_for_legal_draft: true },
      contradictions_detected: [
        { id: 'c1', severity: 'CRITICA', status: 'DETECTADA', description: 'Discrepancia en acta' }
      ]
    };

    const suffCheck = validateDocumentSufficiency(stateWithOpenContradiction);
    const blockedByContradiction = suffCheck.isReady === false;

    // Verificar que validateDocumentContent bloquea marcadores de posición
    const contentWithPlaceholder = `
      C. JUEZ FAMILIAR.
      PROMOVENTE: DANIELA RÍOS.
      HECHOS: [ TU CALLE ] con fecha de hoy.
      PROTESTO LO NECESARIO.
    `;
    const docCheck = validateDocumentContent(contentWithPlaceholder, "Demanda");
    const blockedByPlaceholder = docCheck.isValid === false;

    const passed = Boolean(blockedByContradiction && blockedByPlaceholder);

    results.push({
      code: "PRUEBA L",
      name: "Puerta de autorización documental: bloqueo ante contradicciones abiertas y marcadores de relleno",
      expected: "Rechazar emisión definitiva tanto funcionalmente como a nivel forense textual",
      actual: `blockedByContradiction=${blockedByContradiction}, blockedByPlaceholder=${blockedByPlaceholder}`,
      evidence: `Motivo funcional: "${suffCheck.reason}" | Motivo textual: "${docCheck.reason}"`,
      status: passed ? "PASS" : "FAIL",
      severity: "CRITICA",
      regressionCheck: "JUS-INV-12 (Documentary authorization gate)"
    });
  } catch (e: any) {
    results.push({
      code: "PRUEBA L",
      name: "Autorización documental",
      expected: "Bloqueo documental",
      actual: e.message,
      evidence: "Error",
      status: "FAIL",
      severity: "CRITICA",
      regressionCheck: "JUS-INV-12"
    });
  }

  // ============================================================================
  // REPORTE CONSOLIDADO
  // ============================================================================
  console.log("\n====================================================================");
  console.log("REPORTE CONSOLIDADO DE PRUEBAS DE INVESTIGACIÓN JURÍDICA (A - L)");
  console.log("====================================================================\n");

  let totalPass = 0;
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅ [PASS]' : (r.status === 'WARN' ? '⚠️ [WARN]' : '❌ [FAIL]');
    console.log(`${icon} ${r.code}: ${r.name}`);
    console.log(`   ├─ Esperado: ${r.expected}`);
    console.log(`   ├─ Real:     ${r.actual}`);
    console.log(`   ├─ Evidencia: ${r.evidence}`);
    console.log(`   └─ Regresión: ${r.regressionCheck} (Severidad: ${r.severity})\n`);
    if (r.status === 'PASS') totalPass++;
  }

  console.log(`Total Pruebas Aprobadas: ${totalPass} / ${results.length}`);

  if (totalPass === results.length) {
    console.log("\n🎉 TODAS LAS 12 PRUEBAS OBLIGATORIAS (A-L) PASARON EXITOSAMENTE.");
    process.exit(0);
  } else {
    console.error("\n⚠️ SE ENCONTRARON FALLOS EN LA BATERÍA DE PRUEBAS.");
    process.exit(1);
  }
}

runInvestigationTestSuite();
