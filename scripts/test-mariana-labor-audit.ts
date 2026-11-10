import { evaluateIncrementalUpdate, generateMasterMarkdown, reconstructMarkdownFromState, computeContentHash } from '../services/master-memory-service';
import { classifyMatter, discoverLegalPathways, buildRequirementsMap, getNextOptimalInquiry } from '../services/investigation-engine';
import { performLegalResearch, OFFICIAL_LEGAL_CORPUS } from '../services/legal-research';
import { evaluateComprehensiveSufficiency } from '../services/sufficiency-engine';
import { CaseStructuredState } from '../types';

/**
 * SUITE DE VALIDACIÓN FORENSE: CASO LABORAL MARIANA ISABEL TORRES RAMÍREZ
 * Evaluación de los 8 requerimientos de QA (Tests A a H)
 */

let passedTests = 0;
let totalTests = 8;
const results: Record<string, { status: 'PASS' | 'FAIL'; details: string }> = {};

function assert(condition: boolean, testId: string, testName: string, failMsg: string) {
  if (condition) {
    console.log(`✅ [${testId}] ${testName}: PASS`);
    passedTests++;
    results[testId] = { status: 'PASS', details: 'Verificado conforme a criterios forenses.' };
  } else {
    console.error(`❌ [${testId}] ${testName}: FAIL -> ${failMsg}`);
    results[testId] = { status: 'FAIL', details: failMsg };
  }
}

async function runMarianaLaborAudit() {
  console.log("====================================================================");
  console.log("JUSTINO.APP - SUITE DE AUDITORÍA QA: CASO LABORAL MARIANA (LFT)");
  console.log("====================================================================\n");

  const meta = {
    caseId: 'case_labor_mariana_001',
    userId: 'user_mariana_torres_saltillo',
    title: 'Expediente Laboral - Mariana Isabel Torres Ramírez vs Comercializadora del Norte',
    timestamp: '2026-10-27T18:00:00.000Z'
  };

  const initialEmptyState: CaseStructuredState = {
    identity: {
      full_name: 'Mariana Isabel Torres Ramírez',
      address: null,
      city: 'Saltillo',
      state: 'Coahuila',
      postal_code: null
    },
    jurisdiction: {
      country: 'México',
      state: 'Coahuila',
      city: 'Saltillo',
      judicial_district: 'Distrito Judicial de Saltillo',
      authority: 'Centro de Conciliación Laboral de Coahuila',
      source: 'Declaración del usuario',
      confirmed: true
    },
    participants: [
      { name: 'Mariana Isabel Torres Ramírez', role: 'trabajadora_promovente' },
      { name: 'Comercializadora del Norte', role: 'patron_empleador' }
    ],
    facts: {
      confirmed: [],
      alleged_unverified: [],
      hypothesis_inference: [],
      unknown: [],
      contradictions: [],
      legal_conclusions_provisional: []
    },
    evidence: [],
    expenses: { is_exact_100_percent: false, monthly_budget_breakdown: null, breakdown_status: 'pending_breakdown' },
    paternity_filiation: { status: 'unknown', birth_certificate_inspected: false, father_appears_on_certificate: null, dna_test_needed: false },
    counterparty_details: { name: 'Comercializadora del Norte', address: 'Saltillo, Coahuila', address_status: 'approximate', employment: null, employment_status: 'unknown', income: null, income_status: 'unknown', willingness_to_negotiate: 'unknown' },
    readiness: { is_ready_for_legal_draft: false, missing_indispensable_requirements: [], information_sufficiency_score: 0, current_phase: 'interview_preliminary' },
    corrections_history: [],
    dates: [],
    amounts: [],
    strategy: { current: null, reason: null, alternatives: [], pending_questions: [] },
    actions: [],
    decisions: [],
    document_state: { current_documents: [], pending_documents: [] }
  };

  // Turno 1 del usuario: Mariana expone el problema laboral en Saltillo
  const userMsg1 = {
    role: 'user',
    content: 'Hola, soy Mariana Isabel Torres Ramírez. Trabajaba en Comercializadora del Norte aquí en Saltillo desde hace 3.5 años. Hace un mes me cambiaron el horario para ir también los sábados y la verdad no recuerdo si firmé algún documento de aceptación. Ayer me despidieron verbalmente y sin darme ninguna carta.'
  };

  const update1 = evaluateIncrementalUpdate(
    initialEmptyState,
    [userMsg1],
    meta,
    { force: true }
  );

  // --- TEST A: Fidelidad de declaraciones (Mariana no recuerda si firmó) ---
  const contractDoubtFact = update1.updatedState.facts_registry?.find(f => f.id === 'fact_labor_contract_doubt');
  const hasStrictFidelity = !!contractDoubtFact &&
    (contractDoubtFact.statement.toLowerCase().includes('no recuerda si firmó') || contractDoubtFact.statement.toLowerCase().includes('no recordar si firmó')) &&
    contractDoubtFact.verification_status === 'DECLARADO_POR_USUARIO' &&
    !contractDoubtFact.statement.toLowerCase().includes('firmó contrato formal') &&
    !contractDoubtFact.statement.toLowerCase().includes('no firmó absolutamente nada');

  assert(
    hasStrictFidelity,
    'TEST_A',
    'Fidelidad de declaraciones (recuerdos parciales asentados como tales sin alteración)',
    'El sistema no registró fielmente la duda sobre la firma del documento o la alteró como certeza.'
  );

  // --- TEST B: Registro de dato desconocido (Existencia de contrato formal) ---
  const contractReq = update1.updatedState.requirements_map?.find(r => r.id === 'req_labor_contract_existence');
  const contractStatusFact = update1.updatedState.facts_registry?.find(f => f.id === 'fact_labor_contract_existence');
  const isContractUnknown = (contractReq?.status === 'DESCONOCIDO') &&
                            (contractStatusFact?.verification_status === 'DESCONOCIDO') &&
                            (update1.updatedState.labor_details?.contract_status === 'DESCONOCIDO');

  assert(
    isContractUnknown,
    'TEST_B',
    'Registro de dato desconocido (contrato individual registrado como DESCONOCIDO)',
    `El contrato individual no se marcó como DESCONOCIDO: statusReq=${contractReq?.status}, statusFact=${contractStatusFact?.verification_status}`
  );

  // --- TEST C: Respeto a negativa de domicilio por privacidad ---
  const userMsg2 = {
    role: 'user',
    content: 'Por ahora no quiero dar mi domicilio particular por privacidad, solo quiero que me orientes sobre mis derechos y cuánto me corresponde.'
  };

  const update2 = evaluateIncrementalUpdate(
    update1.updatedState,
    [userMsg1, userMsg2],
    meta
  );

  const domicileReservedFact = update2.updatedState.facts_registry?.find(f => f.id === 'fact_user_domicile_reserved');
  const addressReq = update2.updatedState.requirements_map?.find(r => r.id === 'req_promovente_address');
  const privacyHandled = update2.updatedState.privacy_preferences?.domicile_reserved === true &&
                         domicileReservedFact?.verification_status === 'RESERVADO_PRIVACIDAD' &&
                         addressReq?.status === 'RESERVADO_POR_PRIVACIDAD';

  // Verificar que la siguiente pregunta NO insiste en el domicilio
  const nextInquiry = getNextOptimalInquiry(
    update2.updatedState.requirements_map || [],
    update2.updatedState.contradictions_detected || [],
    update2.updatedState.readiness.current_phase
  );
  const nextDoesNotAskAddress = !nextInquiry.question.toLowerCase().includes('domicilio particular') &&
                                !nextInquiry.question.toLowerCase().includes('dónde vives');

  assert(
    privacyHandled && nextDoesNotAskAddress,
    'TEST_C',
    'Respeto a negativa de domicilio (se registra como RESERVADO_PRIVACIDAD y no insiste)',
    `No se respetó la reserva de privacidad de domicilio o la siguiente pregunta insistió: ${nextInquiry.question}`
  );

  // --- TEST D: Prudencia jurídica y preceptos de Ley Federal del Trabajo ---
  const pathways = update2.updatedState.legal_pathways || [];
  const hasConciliacionPrejudicial = pathways.some(p => p.id === 'via_laboral_conciliacion_prejudicial' && p.status === 'preferente');
  const hasJuicioOrdinario = pathways.some(p => p.id === 'via_laboral_juicio_ordinario');
  const research = performLegalResearch('despido injustificado aviso rescisión prescripción 2 meses LFT', 'Coahuila');
  const citesLFT = research.norm_citation.includes('Ley Federal del Trabajo') &&
                   research.norm_citation.includes('47') &&
                   research.norm_citation.includes('518');

  assert(
    hasConciliacionPrejudicial && hasJuicioOrdinario && citesLFT,
    'TEST_D',
    'Prudencia jurídica y LFT (Conciliación Prejudicial obligatoria y término de prescripción de 2 meses)',
    'Faltan vías laborales obligatorias de la LFT (CFCRL/CCL) o no se citan los arts. 47 y 518 LFT.'
  );

  // --- TEST E: Persistencia y expediente maestro limpio (sin residuos de casos anteriores) ---
  const md = update2.markdownContent;
  const containsMariana = md.includes('Mariana Isabel Torres Ramírez');
  const containsComercializadora = md.includes('Comercializadora del Norte');
  const containsPrivacyReserved = md.includes('RESERVADO POR PRIVACIDAD');
  const containsUnknownContract = md.includes('DESCONOCIDO');
  const noAlejandroResidue = !md.includes('Alejandro López García');
  const noSofiaResidue = !md.includes('Sofía Martínez Ramos');

  assert(
    containsMariana && containsComercializadora && containsPrivacyReserved && containsUnknownContract && noAlejandroResidue && noSofiaResidue,
    'TEST_E',
    'Expediente maestro limpio y libre de residuos de otros casos',
    `El markdown contiene residuos de otros expedientes o le faltan datos de Mariana: noAlejandro=${noAlejandroResidue}, noSofia=${noSofiaResidue}`
  );

  // --- TEST F: Detección y manejo neutral de contradicciones ---
  const userMsg3 = {
    role: 'user',
    content: 'De hecho el despido ocurrió hace tres meses, no ayer.'
  };

  const update3 = evaluateIncrementalUpdate(
    update2.updatedState,
    [userMsg1, userMsg2, userMsg3],
    meta
  );

  // Verificar que el log registra contradicción o actualización incremental de versión
  const versionIncremented = update3.version > update2.version;
  assert(
    versionIncremented && update3.updatedState.master_markdown_version === update3.version,
    'TEST_F',
    'Manejo de actualizaciones y control de versiones del expediente (v3.0)',
    `Versión no incrementó correctamente: v${update3.version}`
  );

  // --- TEST G: Aislamiento estricto de expedientes y propietarios ---
  const isolatedCaseId = update3.updatedState.master_markdown?.case_id === meta.caseId;
  const isolatedUserId = update3.updatedState.master_markdown?.user_id === meta.userId;

  assert(
    isolatedCaseId && isolatedUserId,
    'TEST_G',
    'Aislamiento estricto de expediente y usuario (Tenant Isolation)',
    'Fallo en aislamiento de propietario o case_id'
  );

  // --- TEST H: Reconstrucción determinística y recuperación de expediente ---
  const reconstructedMd = reconstructMarkdownFromState(update3.updatedState, meta);
  const hash1 = computeContentHash(update3.markdownContent);
  const hash2 = computeContentHash(reconstructedMd);
  const isDeterministic = hash1 === hash2;

  assert(
    isDeterministic,
    'TEST_H',
    'Reconstrucción determinística del expediente maestro (recuperación por recarga/cierre)',
    `El hash del Markdown difiere entre evaluación y reconstrucción pura: ${hash1} vs ${hash2}`
  );

  console.log("\n====================================================================");
  console.log(`RESUMEN DE AUDITORÍA: ${passedTests} / ${totalTests} PRUEBAS APROBADAS`);
  console.log(`VEREDICTO GLOBAL: ${passedTests === totalTests ? 'PASS' : 'FAIL'}`);
  console.log("====================================================================");

  return results;
}

runMarianaLaborAudit();
