import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  evaluateIncrementalUpdate,
  generateMasterMarkdown,
  reconstructMarkdownFromState,
  persistMasterMemory,
  computeContentHash,
  isSubstantiveUserMessage
} from '../services/master-memory-service';
import { extractCandidateFacts } from '../services/ai-provider';
import { detectUniversalContradictions } from '../services/contradiction-engine';
import { CaseStructuredState } from '../types';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials in environment");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

interface TestResult {
  num: number;
  code: string;
  name: string;
  expected: string;
  actual: string;
  evidence: string;
  status: 'PASS' | 'FAIL';
  severity: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';
}

async function runMasterMemoryTestSuite() {
  console.log("====================================================================");
  console.log("JUSTINO AI LEGAL // BATERÍA DE PRUEBAS DE MEMORIA VIVA Y EXPEDIENTE MAESTRO");
  console.log("ESCENARIOS OBLIGATORIOS 1 - 14 (SECCIÓN 11)");
  console.log("====================================================================\n");

  const results: TestResult[] = [];
  const testUserId = "053921a3-dfb9-45e1-9d09-e190878c001d";
  const otherUserId = "45dad389-e500-48fd-8a06-74b860f03b80";

  // Base state inicial
  const baseInitialState: CaseStructuredState = {
    identity: { full_name: "Daniela Fernanda Ríos Salazar", address: "Calle Juárez 400", city: "Chihuahua", state: "Chihuahua", postal_code: "31000" },
    jurisdiction: { country: "México", state: "Chihuahua", city: "Chihuahua", judicial_district: "Morelos", authority: "Juzgados Familiares", source: "Declaración", confirmed: true },
    participants: [
      { name: "Daniela Fernanda Ríos Salazar", role: "promovente" },
      { name: "Alejandro López García", role: "demandado" },
      { name: "Sofía Martínez Ramos", role: "hijo_menor", relationship: "hijo" }
    ],
    facts: { confirmed: [], alleged_unverified: [], hypothesis_inference: [], unknown: [], contradictions: [], legal_conclusions_provisional: [] },
    evidence: [],
    expenses: { general_claim: "prácticamente todos los gastos", is_exact_100_percent: false, monthly_budget_breakdown: null, breakdown_status: 'pending_breakdown' },
    paternity_filiation: { status: 'alleged_unverified', birth_certificate_inspected: false, father_appears_on_certificate: null, dna_test_needed: false },
    counterparty_details: { name: "Alejandro López García", address: null, address_status: 'unknown', employment: null, employment_status: 'unknown', income: null, income_status: 'unknown', willingness_to_negotiate: 'unknown' },
    readiness: { is_ready_for_legal_draft: false, missing_indispensable_requirements: [], information_sufficiency_score: 0, current_phase: 'interview_preliminary' },
    corrections_history: [],
    dates: [],
    amounts: [],
    strategy: { current: null, reason: null, alternatives: [], pending_questions: [] },
    actions: [],
    decisions: [],
    document_state: { current_documents: [], pending_documents: [] },
    master_markdown_version: 1
  };

  // ============================================================================
  // PRUEBA 1: Actualización después de una declaración relevante
  // ============================================================================
  try {
    const meta = { caseId: "case-mem-01", userId: testUserId, title: "Alimentos Daniela Ríos" };
    const userMsgs = [
      { role: "user", content: "Alejandro dejó de aportar alrededor de junio de 2026 y no sé dónde vive actualmente." }
    ];

    const result = evaluateIncrementalUpdate(baseInitialState, userMsgs, meta);
    const passed = Boolean(
      result.hasChanges === true &&
      result.version > 1 &&
      result.updatedState.facts_registry &&
      result.updatedState.facts_registry.some(f => f.id === 'fact_counterparty_address') &&
      result.markdownContent.includes("EXPEDIENTE MAESTRO")
    );

    results.push({
      num: 1,
      code: "MEM-01",
      name: "Actualización después de una declaración relevante",
      expected: "hasChanges: true, incremento de versión a v2 y registro del hecho de domicilio desconocido",
      actual: `hasChanges=${result.hasChanges}, version=v${result.version}.0, facts_count=${result.updatedState.facts_registry?.length}`,
      evidence: `Resumen de cambios: "${result.changesSummary}"`,
      status: passed ? "PASS" : "FAIL",
      severity: "ALTA"
    });
  } catch (err: any) {
    results.push({ num: 1, code: "MEM-01", name: "Actualización relevante", expected: "Éxito", actual: err.message, evidence: "Error", status: "FAIL", severity: "ALTA" });
  }

  // ============================================================================
  // PRUEBA 2: Conservación del estado después de una respuesta sin información nueva
  // ============================================================================
  try {
    const meta = { caseId: "case-mem-01", userId: testUserId, title: "Alimentos Daniela Ríos" };
    const stateWithLog = {
      ...baseInitialState,
      master_markdown_version: 2,
      master_markdown: {
        case_id: "case-mem-01",
        user_id: testUserId,
        version: 2,
        markdown_content: "# EXPEDIENTE MAESTRO v2",
        content_hash: "hash123",
        last_updated_at: new Date().toISOString(),
        update_log: [{ version: 2, timestamp: new Date().toISOString(), change_type: 'fact_added' as any, summary: 'Hecho agregado', affected_fields: ['facts'] }]
      }
    };

    const trivialMsgs = [
      { role: "user", content: "Muchas gracias, entendido." }
    ];

    const result = evaluateIncrementalUpdate(stateWithLog, trivialMsgs, meta);
    const passed = Boolean(
      result.hasChanges === false &&
      result.version === 2 &&
      result.reason?.includes("No se aportó información fáctica nueva")
    );

    results.push({
      num: 2,
      code: "MEM-02",
      name: "Conservación del estado después de una respuesta sin información nueva",
      expected: "hasChanges: false, versión conservada en v2 sin crear registros redundantes",
      actual: `hasChanges=${result.hasChanges}, version=v${result.version}.0, reason="${result.reason}"`,
      evidence: `Mensaje evaluado como trivial: isSubstantiveUserMessage("Muchas gracias, entendido.") = ${isSubstantiveUserMessage("Muchas gracias, entendido.")}`,
      status: passed ? "PASS" : "FAIL",
      severity: "MEDIA"
    });
  } catch (err: any) {
    results.push({ num: 2, code: "MEM-02", name: "Conservación sin cambios", expected: "Conservar", actual: err.message, evidence: "Error", status: "FAIL", severity: "MEDIA" });
  }

  // ============================================================================
  // PRUEBA 3: Detección de nombres y apellidos discrepantes en archivo maestro
  // ============================================================================
  try {
    const meta = { caseId: "case-mem-03", userId: testUserId, title: "Caso Apellidos" };
    const msgs = [
      { role: "user", content: "El padre es Alejandro López García y mi hija se llama Sofía Martínez Ramos." }
    ];
    const result = evaluateIncrementalUpdate(baseInitialState, msgs, meta);
    const hasSurnameContra = result.detectedContradictions.some(c => c.category === 'identity_relations' && c.id === 'contra_surname_filiation_mismatch');
    const inMarkdown = result.markdownContent.includes("Discrepancia en apellidos") && result.markdownContent.includes("Sofía Martínez");

    const passed = Boolean(hasSurnameContra && inMarkdown);

    results.push({
      num: 3,
      code: "MEM-03",
      name: "Detección de nombres y apellidos discrepantes",
      expected: "Detectar discrepancia y reflejarla en la sección 5 del archivo maestro",
      actual: `hasSurnameContra=${hasSurnameContra}, inMarkdown=${inMarkdown}`,
      evidence: `Pregunta en Markdown: "${result.detectedContradictions[0]?.question_to_clarify}"`,
      status: passed ? "PASS" : "FAIL",
      severity: "ALTA"
    });
  } catch (err: any) {
    results.push({ num: 3, code: "MEM-03", name: "Apellidos discrepantes", expected: "Detección", actual: err.message, evidence: "Error", status: "FAIL", severity: "ALTA" });
  }

  // ============================================================================
  // PRUEBA 4: Detección de fechas contradictorias
  // ============================================================================
  try {
    const meta = { caseId: "case-mem-04", userId: testUserId, title: "Caso Fechas" };
    const msgs = [
      { role: "user", content: "Alejandro dejó de aportar en junio de 2026 pero el cese definitivo ocurrió en marzo de 2026." }
    ];
    const result = evaluateIncrementalUpdate(baseInitialState, msgs, meta);
    const dateContra = result.detectedContradictions.find(c => c.category === 'dates_chronology');
    const inFactRegistry = result.updatedState.facts_registry?.some(f => f.id === 'fact_cessation_date' && f.verification_status === 'CONTRADICTORIO');

    const passed = Boolean(dateContra && inFactRegistry && result.markdownContent.includes("Inconsistencia cronológica"));

    results.push({
      num: 4,
      code: "MEM-04",
      name: "Detección de fechas contradictorias",
      expected: "Clasificar hecho como CONTRADICTORIO y registrar ambas fechas en versiones en conflicto",
      actual: `dateContra=${Boolean(dateContra)}, inFactRegistry=${inFactRegistry}`,
      evidence: `Versiones en conflicto: ${dateContra?.versions.map(v => v.text).join(' vs ')}`,
      status: passed ? "PASS" : "FAIL",
      severity: "ALTA"
    });
  } catch (err: any) {
    results.push({ num: 4, code: "MEM-04", name: "Fechas contradictorias", expected: "Detección", actual: err.message, evidence: "Error", status: "FAIL", severity: "ALTA" });
  }

  // ============================================================================
  // PRUEBA 5: Corrección de un hecho sin pérdida del historial
  // ============================================================================
  try {
    const meta = { caseId: "case-mem-05", userId: testUserId, title: "Caso Corrección" };
    // Turno 1: Usuario declara junio de 2026
    const msgsTurn1 = [{ role: "user", content: "Alejandro dejó de pagar en junio de 2026." }];
    const res1 = evaluateIncrementalUpdate(baseInitialState, msgsTurn1, meta);

    // Turno 2: Usuario corrige formalmente a marzo de 2026
    const msgsTurn2 = [
      { role: "user", content: "Alejandro dejó de pagar en junio de 2026." },
      { role: "assistant", content: "Entendido." },
      { role: "user", content: "Deseo corregir un dato: Alejandro en realidad dejó de aportar en marzo de 2026 formalmente." }
    ];
    const res2 = evaluateIncrementalUpdate(res1.updatedState, msgsTurn2, meta);

    const factItem = res2.updatedState.facts_registry?.find(f => f.id === 'fact_cessation_date');
    const hasHistory = Boolean(factItem && factItem.correction_history && factItem.correction_history.length > 0);
    const prevStatementPreserved = factItem?.correction_history?.[0]?.previous_statement.includes("junio de 2026");

    const passed = Boolean(hasHistory && prevStatementPreserved);

    results.push({
      num: 5,
      code: "MEM-05",
      name: "Corrección de un hecho sin pérdida del historial",
      expected: "Conservar previous_statement con junio de 2026 y registrar nuevo statement con marzo de 2026",
      actual: `hasHistory=${hasHistory}, prevPreserved=${prevStatementPreserved}`,
      evidence: `Valor previo en historial: "${factItem?.correction_history?.[0]?.previous_statement}" | Valor actual: "${factItem?.statement}"`,
      status: passed ? "PASS" : "FAIL",
      severity: "ALTA"
    });
  } catch (err: any) {
    results.push({ num: 5, code: "MEM-05", name: "Corrección con historial", expected: "Conservar", actual: err.message, evidence: "Error", status: "FAIL", severity: "ALTA" });
  }

  // ============================================================================
  // PRUEBA 6: Diferenciación entre documento mencionado y documento revisado
  // ============================================================================
  try {
    const meta = { caseId: "case-mem-06", userId: testUserId, title: "Caso Documento" };
    const msgs = [{ role: "user", content: "Tengo el acta de nacimiento de mi hijo y con eso ya se demuestra todo." }];
    const result = evaluateIncrementalUpdate(baseInitialState, msgs, meta);

    const birthFact = result.updatedState.facts_registry?.find(f => f.id === 'fact_birth_certificate');
    const notVerifiedDocumentally = birthFact?.verification_status !== 'VERIFICADO_DOCUMENTALMENTE';
    const inMarkdownExplicit = result.markdownContent.includes("NO inspeccionada formalmente (solo mencionada)");

    const passed = Boolean(notVerifiedDocumentally && inMarkdownExplicit);

    results.push({
      num: 6,
      code: "MEM-06",
      name: "Diferenciación entre documento mencionado y documento revisado",
      expected: "Acta marcada como no cotejada formalmente; no se promueve a VERIFICADO_DOCUMENTALMENTE",
      actual: `verification_status=${birthFact?.verification_status}, inMarkdown=${inMarkdownExplicit}`,
      evidence: `Texto en registro: "${birthFact?.statement}"`,
      status: passed ? "PASS" : "FAIL",
      severity: "ALTA"
    });
  } catch (err: any) {
    results.push({ num: 6, code: "MEM-06", name: "Diferenciación documental", expected: "Diferenciación", actual: err.message, evidence: "Error", status: "FAIL", severity: "ALTA" });
  }

  // ============================================================================
  // PRUEBA 7: Recuperación del caso después de cerrar y reabrir sesión
  // ============================================================================
  try {
    const meta = { caseId: "00000000-0000-0000-0000-000000000001", userId: testUserId, title: "Test Recuperación Sesión" };

    // Crear caso temporal en DB
    const { data: createdCase, error: createErr } = await supabaseAdmin.from('legal_cases').insert([{
      user_id: testUserId,
      title: "Expediente Test Recuperación Memoria",
      case_type: "familiar",
      state_jurisdiction: "Chihuahua",
      city_jurisdiction: "Chihuahua",
      status: "active",
      structured_state: {
        ...baseInitialState,
        master_markdown_version: 3,
        facts_registry: [
          {
            id: 'fact_sample_01',
            statement: 'Promovente tiene la custodia de facto de la menor en Chihuahua.',
            category: 'procedure',
            source: { type: 'user_declaration', reference: 'msg1', timestamp: new Date().toISOString() },
            verification_status: 'DECLARADO_POR_USUARIO',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      },
      updated_at: new Date().toISOString()
    }]).select().single();

    if (createErr) throw createErr;

    // Generar y persistir EXPEDIENTE_MAESTRO.md
    const markdown = generateMasterMarkdown(createdCase.structured_state, { caseId: createdCase.id, userId: testUserId, title: createdCase.title });
    const persistRes = await persistMasterMemory(supabaseAdmin, { caseId: createdCase.id, userId: testUserId, title: createdCase.title }, createdCase.structured_state, markdown);

    // Simular "Reapertura de sesión": leer de nuevo desde Supabase
    const { data: reloadedCase, error: reloadErr } = await supabaseAdmin
      .from('legal_cases')
      .select('id, user_id, structured_state')
      .eq('id', createdCase.id)
      .single();

    if (reloadErr) throw reloadErr;

    // Simular lectura de documento en bóveda
    const { data: vaultDoc, error: docErr } = await supabaseAdmin
      .from('case_vault_documents')
      .select('title, legal_content, version')
      .eq('case_id', createdCase.id)
      .eq('title', 'EXPEDIENTE_MAESTRO.md')
      .single();

    // Limpieza
    await supabaseAdmin.from('case_vault_documents').delete().eq('case_id', createdCase.id);
    await supabaseAdmin.from('legal_cases').delete().eq('id', createdCase.id);

    const factPreserved = reloadedCase.structured_state?.facts_registry?.[0]?.statement?.includes("custodia de facto");
    const vaultDocRecovered = Boolean(vaultDoc && vaultDoc.legal_content?.includes("EXPEDIENTE MAESTRO"));

    const passed = Boolean(persistRes.success && factPreserved && vaultDocRecovered);

    results.push({
      num: 7,
      code: "MEM-07",
      name: "Recuperación del caso después de cerrar y reabrir sesión",
      expected: "Recuperar íntegramente hechos y archivo maestro desde legal_cases y case_vault_documents",
      actual: `persistSuccess=${persistRes.success}, factPreserved=${factPreserved}, vaultDocRecovered=${vaultDocRecovered}`,
      evidence: `Vault Doc version=${vaultDoc?.version}, título=${vaultDoc?.title}`,
      status: passed ? "PASS" : "FAIL",
      severity: "CRITICA"
    });
  } catch (err: any) {
    results.push({ num: 7, code: "MEM-07", name: "Recuperación de sesión", expected: "Recuperar", actual: err.message, evidence: "Error", status: "FAIL", severity: "CRITICA" });
  }

  // ============================================================================
  // PRUEBA 8: Escrituras duplicadas sin duplicación de registros (Idempotencia)
  // ============================================================================
  try {
    const meta = { caseId: "case-mem-08", userId: testUserId, title: "Test Idempotencia" };
    const msgs = [{ role: "user", content: "No sé dónde vive Alejandro." }];

    // Ejecución 1
    const res1 = evaluateIncrementalUpdate(baseInitialState, msgs, meta, { force: true });
    const count1 = res1.updatedState.facts_registry?.length || 0;

    // Ejecución 2 con el mismo contenido
    const res2 = evaluateIncrementalUpdate(res1.updatedState, msgs, meta, { force: true });
    const count2 = res2.updatedState.facts_registry?.length || 0;

    const noFactDuplicated = count1 === count2;
    const sameFactId = res2.updatedState.facts_registry?.filter(f => f.id === 'fact_counterparty_address').length === 1;

    const passed = Boolean(noFactDuplicated && sameFactId);

    results.push({
      num: 8,
      code: "MEM-08",
      name: "Escrituras duplicadas sin duplicación de registros (idempotencia)",
      expected: "El conteo de hechos en facts_registry no aumenta ante el mismo mensaje repetido",
      actual: `count1=${count1}, count2=${count2}, sameFactIdUnique=${sameFactId}`,
      evidence: `Hechos únicos mantenidos: ${res2.updatedState.facts_registry?.map(f => f.id).join(', ')}`,
      status: passed ? "PASS" : "FAIL",
      severity: "ALTA"
    });
  } catch (err: any) {
    results.push({ num: 8, code: "MEM-08", name: "Idempotencia", expected: "Sin duplicados", actual: err.message, evidence: "Error", status: "FAIL", severity: "ALTA" });
  }

  // ============================================================================
  // PRUEBA 9: Fallos de persistencia con recuperación segura
  // ============================================================================
  try {
    const meta = { caseId: "case-inexistente-9999", userId: testUserId, title: "Test Error" };
    const fakeMarkdown = "# Test Error Content";

    // Intentar persistir contra un case_id que no existe en Supabase
    const persistResult = await persistMasterMemory(supabaseAdmin, meta, baseInitialState, fakeMarkdown);

    // Debe retornar success: false y un mensaje de error claro, sin afirmar falsamente que se guardó
    const passed = Boolean(persistResult.success === false && persistResult.error?.includes("no encontrado"));

    results.push({
      num: 9,
      code: "MEM-09",
      name: "Fallos de persistencia con recuperación segura",
      expected: "success: false con mensaje de error explícito; no fingir almacenamiento exitoso",
      actual: `success=${persistResult.success}, error="${persistResult.error}"`,
      evidence: `Respuesta segura ante fallo: ${JSON.stringify(persistResult)}`,
      status: passed ? "PASS" : "FAIL",
      severity: "ALTA"
    });
  } catch (err: any) {
    results.push({ num: 9, code: "MEM-09", name: "Fallo seguro", expected: "Captura de error", actual: err.message, evidence: "Error", status: "FAIL", severity: "ALTA" });
  }

  // ============================================================================
  // PRUEBA 10: Reconstrucción del Markdown a partir de la fuente de verdad
  // ============================================================================
  try {
    const meta = { caseId: "case-mem-10", userId: testUserId, title: "Reconstrucción Purista", timestamp: '2026-10-27T18:00:00.000Z' };
    const md1 = generateMasterMarkdown(baseInitialState, meta);
    const md2 = reconstructMarkdownFromState(baseInitialState, meta);

    const hash1 = computeContentHash(md1);
    const hash2 = computeContentHash(md2);
    const areIdentical = hash1 === hash2;
    const hasRequiredSections =
      md2.includes("## 1. Identificación del caso") &&
      md2.includes("## 2. Personas, relaciones y datos de identidad") &&
      md2.includes("## 3. Registro de hechos y declaraciones") &&
      md2.includes("## 5. Contradicciones abiertas y resueltas") &&
      md2.includes("## 8. Investigación jurídica") &&
      md2.includes("## 13. Historial de cambios y versión actual");

    const passed = Boolean(areIdentical && hasRequiredSections);

    results.push({
      num: 10,
      code: "MEM-10",
      name: "Reconstrucción del Markdown a partir de la fuente de verdad",
      expected: "reconstructMarkdownFromState genera determinísticamente el Markdown idéntico con todos los encabezados",
      actual: `hashesMatch=${areIdentical}, hasRequiredSections=${hasRequiredSections}`,
      evidence: `Hash SHA-256: ${hash1.slice(0, 16)}...`,
      status: passed ? "PASS" : "FAIL",
      severity: "CRITICA"
    });
  } catch (err: any) {
    results.push({ num: 10, code: "MEM-10", name: "Reconstrucción Markdown", expected: "Reconstrucción", actual: err.message, evidence: "Error", status: "FAIL", severity: "CRITICA" });
  }

  // ============================================================================
  // PRUEBA 11: Aislamiento estricto entre expedientes y usuarios
  // ============================================================================
  try {
    // Crear caso propiedad de testUserId
    const { data: createdCase, error: createErr } = await supabaseAdmin.from('legal_cases').insert([{
      user_id: testUserId,
      title: "Expediente Aislado User A",
      case_type: "familiar",
      state_jurisdiction: "Chihuahua",
      city_jurisdiction: "Chihuahua",
      status: "active",
      structured_state: baseInitialState,
      updated_at: new Date().toISOString()
    }]).select().single();

    if (createErr) throw createErr;

    // Intentar persistir o actualizar haciéndose pasar por otherUserId
    const maliciousMeta = { caseId: createdCase.id, userId: otherUserId, title: "Hack Attempt" };
    const hijackResult = await persistMasterMemory(supabaseAdmin, maliciousMeta, baseInitialState, "# Hack Content");

    // Limpieza
    await supabaseAdmin.from('legal_cases').delete().eq('id', createdCase.id);

    const isBlocked = hijackResult.success === false && hijackResult.error?.includes("SECURITY VIOLATION");

    results.push({
      num: 11,
      code: "MEM-11",
      name: "Aislamiento estricto entre expedientes y usuarios",
      expected: "Bloquear intento de escritura de Usuario B sobre expediente de Usuario A (SECURITY VIOLATION)",
      actual: `success=${hijackResult.success}, error="${hijackResult.error}"`,
      evidence: `Intento de acceso cruzado denegado: ${hijackResult.error}`,
      status: isBlocked ? "PASS" : "FAIL",
      severity: "CRITICA"
    });
  } catch (err: any) {
    results.push({ num: 11, code: "MEM-11", name: "Aislamiento de usuarios", expected: "Bloqueo", actual: err.message, evidence: "Error", status: "FAIL", severity: "CRITICA" });
  }

  // ============================================================================
  // PRUEBA 12: Revisión de conclusiones cuando cambia un hecho esencial (Pivote de estrategia)
  // ============================================================================
  try {
    const meta = { caseId: "case-mem-12", userId: testUserId, title: "Pivote Estratégico" };
    const msgs = [
      { role: "user", content: "Quiero demandar a Alejandro pero desconozco su domicilio y no sé dónde vive." }
    ];
    const result = evaluateIncrementalUpdate(baseInitialState, msgs, meta);

    const searchPathway = result.updatedState.legal_pathways?.find(p => p.id === 'via_familiar_prejudicial_busqueda');
    const isPreferred = searchPathway?.status === 'preferente';
    const inMarkdownReflected = result.markdownContent.includes("Diligencias Prejudiciales de Localización de Domicilio");

    const passed = Boolean(searchPathway && isPreferred && inMarkdownReflected);

    results.push({
      num: 12,
      code: "MEM-12",
      name: "Revisión de conclusiones cuando cambia un hecho esencial",
      expected: "Domicilio desconocido pivota la vía preferente a Diligencias Prejudiciales de Búsqueda",
      actual: `via_preferente=${searchPathway?.name}, status=${searchPathway?.status}`,
      evidence: `Estrategia en Markdown: "${searchPathway?.description}"`,
      status: passed ? "PASS" : "FAIL",
      severity: "ALTA"
    });
  } catch (err: any) {
    results.push({ num: 12, code: "MEM-12", name: "Pivote de estrategia", expected: "Pivote", actual: err.message, evidence: "Error", status: "FAIL", severity: "ALTA" });
  }

  // ============================================================================
  // PRUEBA 13: Actualización de la lista de preguntas pendientes
  // ============================================================================
  try {
    const meta = { caseId: "case-mem-13", userId: testUserId, title: "Inquiry Update" };
    const msgs = [
      { role: "user", content: "Mi hija se llama Sofía Martínez Ramos y el papá es Alejandro López García." }
    ];
    const result = evaluateIncrementalUpdate(baseInitialState, msgs, meta);

    const hasActiveInquiry = Boolean(result.activeInquiry && result.activeInquiry.next_question);
    const inMarkdownSection11 = result.markdownContent.includes("## 11. Preguntas, pruebas y acciones pendientes") &&
      result.markdownContent.includes("Pregunta principal activa");

    const passed = Boolean(hasActiveInquiry && inMarkdownSection11);

    results.push({
      num: 13,
      code: "MEM-13",
      name: "Actualización de la lista de preguntas pendientes",
      expected: "activeInquiry formulado con justificación jurídica y reflejado en Sección 11 del archivo maestro",
      actual: `hasActiveInquiry=${hasActiveInquiry}, inMarkdownSection11=${inMarkdownSection11}`,
      evidence: `Pregunta formulada: "${result.activeInquiry?.next_question}" (Motivo: ${result.activeInquiry?.legal_reason})`,
      status: passed ? "PASS" : "FAIL",
      severity: "ALTA"
    });
  } catch (err: any) {
    results.push({ num: 13, code: "MEM-13", name: "Preguntas pendientes", expected: "Actualización", actual: err.message, evidence: "Error", status: "FAIL", severity: "ALTA" });
  }

  // ============================================================================
  // PRUEBA 14: Ausencia de afirmaciones falsas sobre operaciones de almacenamiento
  // ============================================================================
  try {
    // Crear caso temporal
    const { data: createdCase, error: createErr } = await supabaseAdmin.from('legal_cases').insert([{
      user_id: testUserId,
      title: "Expediente Verificación Almacenamiento",
      case_type: "familiar",
      state_jurisdiction: "Chihuahua",
      city_jurisdiction: "Chihuahua",
      status: "active",
      structured_state: baseInitialState,
      updated_at: new Date().toISOString()
    }]).select().single();

    if (createErr) throw createErr;

    const meta = { caseId: createdCase.id, userId: testUserId, title: createdCase.title };
    const md = generateMasterMarkdown(baseInitialState, meta);

    // Escribir y verificar
    const persistRes = await persistMasterMemory(supabaseAdmin, meta, baseInitialState, md);

    // Limpieza
    await supabaseAdmin.from('case_vault_documents').delete().eq('case_id', createdCase.id);
    await supabaseAdmin.from('legal_cases').delete().eq('id', createdCase.id);

    const noFalseClaims = persistRes.success === true && persistRes.version === 1;

    results.push({
      num: 14,
      code: "MEM-14",
      name: "Ausencia de afirmaciones falsas sobre operaciones de almacenamiento",
      expected: "Confirmar persistencia real mediante verificación post-escritura en legal_cases y case_vault_documents",
      actual: `success=${persistRes.success}, version=${persistRes.version}`,
      evidence: `Persistencia comprobada con verificación atómica de estado y documento en bóveda: ${persistRes.documentId}`,
      status: noFalseClaims ? "PASS" : "FAIL",
      severity: "CRITICA"
    });
  } catch (err: any) {
    results.push({ num: 14, code: "MEM-14", name: "Sin afirmaciones falsas", expected: "Verificación", actual: err.message, evidence: "Error", status: "FAIL", severity: "CRITICA" });
  }

  // ============================================================================
  // CONSOLIDATED REPORT
  // ============================================================================
  console.log("\n====================================================================");
  console.log("REPORTE CONSOLIDADO DE PRUEBAS DE MEMORIA VIVA (1 - 14)");
  console.log("====================================================================\n");

  let totalPassed = 0;
  for (const r of results) {
    const symbol = r.status === 'PASS' ? "✅ [PASS]" : "❌ [FAIL]";
    console.log(`${symbol} PRUEBA ${r.num} (${r.code}): ${r.name}`);
    console.log(`   ├─ Esperado: ${r.expected}`);
    console.log(`   ├─ Real:     ${r.actual}`);
    console.log(`   ├─ Evidencia: ${r.evidence}`);
    console.log(`   └─ Severidad: ${r.severity}`);
    if (r.status === 'PASS') totalPassed++;
  }

  console.log(`\nTotal Pruebas Aprobadas: ${totalPassed} / ${results.length}`);
  if (totalPassed === results.length) {
    console.log("🎉 TODAS LAS 14 PRUEBAS OBLIGATORIAS DE MEMORIA VIVA PASARON EXITOSAMENTE.");
    process.exit(0);
  } else {
    console.error("⚠️ SE ENCONTRARON FALLOS EN LA BATERÍA DE PRUEBAS DE MEMORIA VIVA.");
    process.exit(1);
  }
}

runMasterMemoryTestSuite();
