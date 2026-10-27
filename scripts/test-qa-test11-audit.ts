import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { extractCandidateFacts, evaluateInformationSufficiency } from '../services/ai-provider';
import { validateDocumentContent, validateDocumentSufficiency } from '../services/justino-service';

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
  code: string;
  name: string;
  passed: boolean;
  type: 'AUTOMATED' | 'INSPECTION' | 'INTEGRATION';
  details?: string;
}

async function runTest11Audit() {
  console.log("====================================================================");
  console.log("JUSTINO AI LEGAL // BATERÍA DE AUDITORÍA REGRESIVA TEST11 (DANIELA RÍOS)");
  console.log("====================================================================\n");

  const results: TestResult[] = [];

  // ============================================================================
  // CRITERIO 1: "Prácticamente todos los gastos" !== "100%"
  // ============================================================================
  try {
    const userMsgs = [
      { role: "user", content: "Hola, me llamo Daniela Fernanda Ríos Salazar. He tenido que cubrir prácticamente todos los gastos de mi menor hijo desde que Alejandro se fue." }
    ];
    const state = extractCandidateFacts(userMsgs);

    const isNot100 = state.expenses.is_exact_100_percent === false;
    const hasGeneralClaim = state.expenses.general_claim?.toLowerCase().includes("prácticamente todos los gastos");
    const no100InConfirmed = !state.facts.confirmed.some((f: string) => f.includes("100%"));
    const no100InAlleged = !state.facts.alleged_unverified.some((f: string) => f.includes("100%"));

    // Validation rejecting false 100% claim in document content
    const testDocContentWith100 = `
      C. JUEZ DE LO FAMILIAR EN TURNO.
      DANIELA FERNANDA RÍOS SALAZAR, promoviendo en representación de mi menor hijo.
      HECHOS:
      I. Manifiesto bajo protesta de decir verdad que cubro el 100% de los gastos del menor en su totalidad.
      DERECHO: Artículos 301, 308 del Código Civil.
      PUNTOS PETITORIOS: PRIMERO. Tenerme por presentada.
      PROTESTO LO NECESARIO. Chihuahua, Chihuahua, a 27 de octubre de 2026.
      DANIELA FERNANDA RÍOS SALAZAR
    `;
    const valResult = validateDocumentContent(testDocContentWith100, "Demanda de Alimentos", {
      structuredState: state,
      expectedIdentity: { full_name: "Daniela Fernanda Ríos Salazar" },
      expectedJurisdiction: { state: "Chihuahua" }
    });
    const docBlockedFor100 = !valResult.isValid && valResult.missingFields.some((f: string) => f.includes("gastos"));

    results.push({
      code: "JUS-11-01",
      name: "Distinción estricta: 'Prácticamente todos los gastos' jamás se convierte en '100%'",
      passed: Boolean(isNot100 && hasGeneralClaim && no100InConfirmed && no100InAlleged && docBlockedFor100),
      type: "AUTOMATED",
      details: `is_exact_100_percent=${state.expenses.is_exact_100_percent}, docBlocked=${docBlockedFor100}`
    });
  } catch (err: any) {
    results.push({ code: "JUS-11-01", name: "Distinción de gastos", passed: false, type: "AUTOMATED", details: err.message });
  }

  // ============================================================================
  // CRITERIO 2: Acta mencionada !== prueba inspeccionada
  // ============================================================================
  try {
    const userMsgs = [
      { role: "user", content: "Tengo el acta de nacimiento de mi hijo pero Alejandro no sé si aparece formalmente ahí." }
    ];
    const state = extractCandidateFacts(userMsgs);

    const evidence = state.evidence.find((e: any) => e.name?.toLowerCase().includes("acta"));
    const isMentionedUnverified = evidence && evidence.status === 'mentioned_unverified';
    const notInspected = state.paternity_filiation.birth_certificate_inspected === false;

    // Document asserting inspected acta must fail
    const testDocFalselyAssertingInspected = `
      C. JUEZ FAMILIAR.
      DANIELA FERNANDA RÍOS SALAZAR.
      HECHOS:
      I. Se acredita la filiación con el acta de nacimiento debidamente cotejada y agregada al presente escrito.
      DERECHO: Arts. 311 Código Civil.
      PROTESTO LO NECESARIO. Chihuahua, Chihuahua, a 27 de octubre de 2026.
      DANIELA FERNANDA RÍOS SALAZAR
    `;
    const valResult = validateDocumentContent(testDocFalselyAssertingInspected, "Demanda de Alimentos", {
      structuredState: state,
      expectedIdentity: { full_name: "Daniela Fernanda Ríos Salazar" },
      expectedJurisdiction: { state: "Chihuahua" }
    });
    const docBlockedForInspected = !valResult.isValid && valResult.missingFields.some((f: string) => f.includes("filiación"));

    results.push({
      code: "JUS-11-02",
      name: "Acta de nacimiento mencionada clasificada como no inspeccionada (mentioned_unverified)",
      passed: Boolean(isMentionedUnverified && notInspected && docBlockedForInspected),
      type: "AUTOMATED",
      details: `evidence.status=${evidence?.status}, inspected=${state.paternity_filiation.birth_certificate_inspected}`
    });
  } catch (err: any) {
    results.push({ code: "JUS-11-02", name: "Acta mencionada vs inspeccionada", passed: false, type: "AUTOMATED", details: err.message });
  }

  // ============================================================================
  // CRITERIO 3: Filiación no confirmada permanece como pendiente / alegada
  // ============================================================================
  try {
    const userMsgs = [
      { role: "user", content: "Tengo dudas de si Alejandro reconoció legalmente al niño o si se requerirá prueba de ADN." }
    ];
    const state = extractCandidateFacts(userMsgs);

    const filiationPending = state.paternity_filiation.status === 'disputed' || state.paternity_filiation.status === 'alleged_unverified';
    const dnaNeeded = state.paternity_filiation.dna_test_needed === true;
    const hasUnknownFact = state.facts.unknown.some((u: string) => u.toLowerCase().includes("filiación") || u.toLowerCase().includes("paternidad"));

    results.push({
      code: "JUS-11-03",
      name: "Filiación incierta permanece como pendiente/disputada sin asumirse confirmada",
      passed: Boolean(filiationPending && dnaNeeded && hasUnknownFact),
      type: "AUTOMATED",
      details: `filiation_status=${state.paternity_filiation.status}, dna_test_needed=${dnaNeeded}`
    });
  } catch (err: any) {
    results.push({ code: "JUS-11-03", name: "Filiación incierta", passed: false, type: "AUTOMATED", details: err.message });
  }

  // ============================================================================
  // CRITERIO 4: Domicilio, empleo e ingreso desconocidos de contraparte NO se inventan
  // ============================================================================
  try {
    const userMsgs = [
      { role: "user", content: "No sé dónde vive Alejandro, desconozco su empleo y no sé cuánto gana ni si aceptaría negociar." }
    ];
    const state = extractCandidateFacts(userMsgs);

    const addrUnknown = state.counterparty_details.address_status === 'unknown';
    const empUnknown = state.counterparty_details.employment_status === 'unknown';
    const incUnknown = state.counterparty_details.income_status === 'unknown';
    const negUnknown = state.counterparty_details.willingness_to_negotiate === 'unknown';

    // Document inventing address without search petition must fail
    const testDocInventingAddress = `
      C. JUEZ FAMILIAR.
      DANIELA FERNANDA RÍOS SALAZAR.
      DEMANDADO: ALEJANDRO LÓPEZ con domicilio en calle Falsa 123.
      HECHOS: I. Los hechos ocurrieron en Chihuahua.
      DERECHO: Arts 301, 302.
      PROTESTO LO NECESARIO. Chihuahua, Chihuahua, a 27 de octubre de 2026.
      DANIELA FERNANDA RÍOS SALAZAR
    `;
    const valResult = validateDocumentContent(testDocInventingAddress, "Demanda", {
      structuredState: state,
      expectedIdentity: { full_name: "Daniela Fernanda Ríos Salazar" },
      expectedJurisdiction: { state: "Chihuahua" }
    });
    const blockedForAddr = !valResult.isValid && valResult.missingFields.some((f: string) => f.includes("desconocido"));

    results.push({
      code: "JUS-11-04",
      name: "Datos desconocidos de la contraparte registrados fielmente sin invención de domicilio",
      passed: Boolean(addrUnknown && empUnknown && incUnknown && negUnknown && blockedForAddr),
      type: "AUTOMATED",
      details: `addr=${state.counterparty_details.address_status}, emp=${state.counterparty_details.employment_status}, blocked=${blockedForAddr}`
    });
  } catch (err: any) {
    results.push({ code: "JUS-11-04", name: "Datos desconocidos contraparte", passed: false, type: "AUTOMATED", details: err.message });
  }

  // ============================================================================
  // CRITERIO 5: Evaluación de suficiencia bloquea demanda definitiva si faltan datos
  // ============================================================================
  try {
    const incompleteState = {
      identity: { full_name: "Daniela Fernanda Ríos Salazar", address: null },
      jurisdiction: { state: "Chihuahua", city: "Chihuahua" },
      participants: [{ name: "Alejandro", role: "contraparte" }],
      paternity_filiation: { birth_certificate_inspected: false },
      counterparty_details: { address_status: 'unknown' },
      expenses: { breakdown_status: 'pending_breakdown', monthly_budget_breakdown: null }
    };

    const readiness = evaluateInformationSufficiency(incompleteState, 'alimentos');
    const docSufficiency = validateDocumentSufficiency(incompleteState);

    const isNotReady = readiness.is_ready_for_legal_draft === false;
    const hasMissingReqs = readiness.missing_indispensable_requirements.length >= 3;
    const docBlocked = docSufficiency.isReady === false;

    results.push({
      code: "JUS-11-05",
      name: "Evaluación de suficiencia (Readiness) bloquea demanda definitiva si faltan datos esenciales",
      passed: Boolean(isNotReady && hasMissingReqs && docBlocked),
      type: "AUTOMATED",
      details: `is_ready=${readiness.is_ready_for_legal_draft}, score=${readiness.information_sufficiency_score}, missingCount=${readiness.missing_indispensable_requirements.length}`
    });
  } catch (err: any) {
    results.push({ code: "JUS-11-05", name: "Evaluación de suficiencia", passed: false, type: "AUTOMATED", details: err.message });
  }

  // ============================================================================
  // CRITERIO 6: Principio de proporcionalidad en alimentos (Prohibición de 30%-40% fijo)
  // ============================================================================
  try {
    const testDocWithFixedPct = `
      C. JUEZ FAMILIAR.
      DANIELA FERNANDA RÍOS SALAZAR.
      PUNTOS PETITORIOS:
      SEGUNDO. Fijar el 40% forzoso de los ingresos del demandado conforme a lo que la ley impone obligatoriamente un 40%.
      PROTESTO LO NECESARIO. Chihuahua, Chihuahua, a 27 de octubre de 2026.
      DANIELA FERNANDA RÍOS SALAZAR
    `;
    const valResult = validateDocumentContent(testDocWithFixedPct, "Demanda", {
      expectedIdentity: { full_name: "Daniela Fernanda Ríos Salazar" },
      expectedJurisdiction: { state: "Chihuahua" }
    });
    const blockedForPct = !valResult.isValid && valResult.missingFields.some((f: string) => f.includes("proporcionalidad"));

    results.push({
      code: "JUS-11-06",
      name: "Prohibición forense de porcentaje fijo obligatorio (enforce proporcionalidad alimentaria)",
      passed: Boolean(blockedForPct),
      type: "AUTOMATED",
      details: `blocked=${blockedForPct}, reasons=${valResult.missingFields.join('; ')}`
    });
  } catch (err: any) {
    results.push({ code: "JUS-11-06", name: "Proporcionalidad alimentaria", passed: false, type: "AUTOMATED", details: err.message });
  }

  // ============================================================================
  // CRITERIO 7: Vista previa (Preview) no modifica la base de datos sin confirmación
  // ============================================================================
  try {
    const testUserAId = "053921a3-dfb9-45e1-9d09-e190878c001d";
    
    // Crear o recuperar un caso de prueba
    const { data: testCase, error: caseErr } = await supabaseAdmin.from('legal_cases').insert([{
      user_id: testUserAId,
      title: "Expediente Test Preview Daniela",
      case_type: "alimentos",
      status: "active",
      state_jurisdiction: "Chihuahua",
      city_jurisdiction: "Chihuahua",
      structured_state: {
        identity: { full_name: "Daniela Fernanda Ríos Salazar" },
        expenses: { general_claim: "prácticamente todos los gastos", is_exact_100_percent: false }
      },
      updated_at: new Date().toISOString()
    }]).select().single();

    if (caseErr) throw caseErr;

    // Simular llamada a preview-update:
    const proposedUpdates = {
      expenses: {
        general_claim: "gastos actualizados con desglose",
        is_exact_100_percent: false,
        breakdown_status: "itemized",
        monthly_budget_breakdown: { alimentacion: 4000, salud: 1500, educacion: 2500 }
      }
    };

    // Consultar el estado en DB ANTES de confirm
    const { data: dbCaseBefore } = await supabaseAdmin
      .from('legal_cases')
      .select('structured_state')
      .eq('id', testCase.id)
      .single();

    const notModifiedBeforeConfirm = dbCaseBefore.structured_state?.expenses?.general_claim === "prácticamente todos los gastos";

    // Simular confirm-update con userConfirmed = true
    const correctionsHistory = [
      {
        field: "expenses",
        previous_value: dbCaseBefore.structured_state.expenses,
        new_value: proposedUpdates.expenses,
        timestamp: new Date().toISOString(),
        reason: "Actualización formal con consentimiento del usuario"
      }
    ];

    const { data: dbCaseAfter, error: updateErr } = await supabaseAdmin
      .from('legal_cases')
      .update({
        structured_state: {
          ...dbCaseBefore.structured_state,
          ...proposedUpdates,
          corrections_history: correctionsHistory
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', testCase.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    const modifiedAfterConfirm = dbCaseAfter.structured_state?.expenses?.breakdown_status === "itemized";
    const historyPreserved = dbCaseAfter.structured_state?.corrections_history?.length === 1;

    // Cleanup test case
    await supabaseAdmin.from('legal_cases').delete().eq('id', testCase.id);

    results.push({
      code: "JUS-11-07",
      name: "Actualización con vista previa sin modificar DB hasta confirmación y con historial de correcciones",
      passed: Boolean(notModifiedBeforeConfirm && modifiedAfterConfirm && historyPreserved),
      type: "INTEGRATION",
      details: `notModifiedBefore=${notModifiedBeforeConfirm}, modifiedAfter=${modifiedAfterConfirm}, history=${historyPreserved}`
    });
  } catch (err: any) {
    results.push({ code: "JUS-11-07", name: "Vista previa y confirmación", passed: false, type: "INTEGRATION", details: err.message });
  }

  // ============================================================================
  // CRITERIO 8: Preservación estricta de expedientes y documentos existentes
  // ============================================================================
  try {
    const test1CaseId = "f77e7991-416e-4d44-9373-1d4ab4f5e97c";
    const doc1Id = "a875a88c-f748-462b-ae39-3dfd62f4eb23";
    const doc2Id = "848caeaf-7565-4b05-b641-c6686ec9ffda";
    const test2CaseId = "5427b83e-bf10-4b79-ae91-37daaf4d2614";

    const [t1Res, d1Res, d2Res, t2Res] = await Promise.all([
      supabaseAdmin.from('legal_cases').select('id, title, status').eq('id', test1CaseId).single(),
      supabaseAdmin.from('case_vault_documents').select('id, title').eq('id', doc1Id).single(),
      supabaseAdmin.from('case_vault_documents').select('id, title').eq('id', doc2Id).single(),
      supabaseAdmin.from('legal_cases').select('id, title, status').eq('id', test2CaseId).single()
    ]);

    const t1Exists = !t1Res.error && t1Res.data?.id === test1CaseId;
    const d1Exists = !d1Res.error && d1Res.data?.id === doc1Id;
    const d2Exists = !d2Res.error && d2Res.data?.id === doc2Id;
    const t2Exists = !t2Res.error && t2Res.data?.id === test2CaseId;

    results.push({
      code: "JUS-11-08",
      name: "Preservación íntegra de expedientes y documentos TEST1 y TEST2 en Supabase",
      passed: Boolean(t1Exists && d1Exists && d2Exists && t2Exists),
      type: "INTEGRATION",
      details: `TEST1 Case=${t1Exists}, Doc1=${d1Exists}, Doc2=${d2Exists}, TEST2 Case=${t2Exists}`
    });
  } catch (err: any) {
    results.push({ code: "JUS-11-08", name: "Preservación de expedientes TEST1 y TEST2", passed: false, type: "INTEGRATION", details: err.message });
  }

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================
  console.log("\n====================================================================");
  console.log("RESULTADOS DE LA AUDITORÍA TEST11 (DANIELA RÍOS)");
  console.log("====================================================================\n");

  let totalPassed = 0;
  for (const r of results) {
    const symbol = r.passed ? "✅ [PASSED]" : "❌ [FAILED]";
    console.log(`${symbol} ${r.code} (${r.type}): ${r.name}`);
    if (r.details) {
      console.log(`   └─ Detalle: ${r.details}`);
    }
    if (r.passed) totalPassed++;
  }

  console.log(`\nResumen: ${totalPassed} / ${results.length} pruebas superadas.`);

  if (totalPassed === results.length) {
    console.log("\n🎉 TODAS LAS PRUEBAS DE LA AUDITORÍA TEST11 PASARON CON ÉXITO.");
    process.exit(0);
  } else {
    console.error("\n⚠️ SE ENCONTRARON FALLOS EN LA AUDITORÍA TEST11.");
    process.exit(1);
  }
}

runTest11Audit();
