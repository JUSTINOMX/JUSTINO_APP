import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { OFFICIAL_LEGAL_CORPUS, performLegalResearch } from '../services/legal-research';
import { classifyMatter, discoverLegalPathways, buildRequirementsMap } from '../services/investigation-engine';
import { evaluateIncrementalUpdate, generateMasterMarkdown, reconstructMarkdownFromState, computeContentHash } from '../services/master-memory-service';

/**
 * JUSTINO.APP — SUITE DE AUDITORÍA FINAL
 * PRUEBAS REALES EN SUPABASE, AISLAMIENTO RLS Y PRECISIÓN JURÍDICA LABORAL
 */

interface AuditResult {
  suite: string;
  test: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED';
  evidence: string;
  notes?: string;
}

const auditResults: AuditResult[] = [];

function recordResult(r: AuditResult) {
  auditResults.push(r);
  const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${r.status}] [${r.suite}] ${r.test}`);
  console.log(`   Método: ${r.method}`);
  console.log(`   Evidencia: ${r.evidence}\n`);
}

async function runRealBackendAudit() {
  console.log("================================================================================");
  console.log("JUSTINO.APP — AUDITORÍA FINAL DE PERSISTENCIA, AISLAMIENTO Y PRECISIÓN JURÍDICA");
  console.log("================================================================================\n");

  const supabaseUrl = config.supabaseUrl;
  const supabaseAnonKey = config.supabaseAnonKey;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("FATAL: Credenciales de Supabase no configuradas.");
    process.exit(1);
  }

  // ====================================================================================
  // PRUEBA 1: PERSISTENCIA REAL EN SUPABASE
  // ====================================================================================
  console.log("--- INICIANDO PRUEBA 1: PERSISTENCIA REAL EN SUPABASE ---");

  const clientA1 = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });

  const timestamp = Date.now();
  const userAEmail = `audit_user_a_${timestamp}@justino.app`;
  const userAPass = `TestPassword_A_${timestamp}!`;

  // 1.1 Registro real de Usuario A en Supabase Auth
  const { data: authDataA, error: authErrA } = await clientA1.auth.signUp({
    email: userAEmail,
    password: userAPass,
    options: {
      data: { full_name: "Mariana Isabel Torres Ramírez (Sintético A)", username: `user_a_${timestamp}` }
    }
  });

  if (authErrA || !authDataA?.user || !authDataA.session) {
    recordResult({
      suite: "PRUEBA 1 — Persistencia Supabase",
      test: "1.1 Registro de Usuario A en Supabase Auth",
      method: "supabase.auth.signUp con backend remoto",
      status: "FAIL",
      evidence: `Error al crear usuario A: ${authErrA?.message}`
    });
    return;
  }

  const userA = authDataA.user;
  const sessionTokenA = authDataA.session.access_token;

  // 1.2 Inserción real de un expediente en la tabla legal_cases con JWT autenticado de Usuario A
  const initialMasterMarkdown = `# EXPEDIENTE MAESTRO
## Caso: Despido Injustificado Mariana Torres vs Comercializadora del Norte
- Promovente: Mariana Isabel Torres Ramírez
- Estado: Activo`;

  const initialPayloadA = {
    user_id: userA.id,
    title: `Expediente Laboral Mariana A - ${timestamp}`,
    case_type: "laboral",
    status: "active",
    state_jurisdiction: "Coahuila",
    city_jurisdiction: "Saltillo",
    structured_state: {
      identity: {
        full_name: "Mariana Isabel Torres Ramírez",
        address: null,
        city: "Saltillo",
        state: "Coahuila",
        postal_code: null
      },
      jurisdiction: {
        country: "México",
        state: "Coahuila",
        city: "Saltillo",
        authority: "Centro de Conciliación Laboral del Estado de Coahuila",
        confirmed: true
      },
      facts: {
        confirmed: [
          {
            id: "f_01",
            description: "Trabajó 3 años y medio como auxiliar administrativa en Comercializadora del Norte",
            source: "Declaración expresa de la trabajadora",
            category: "CONFIRMADO_POR_USUARIO",
            created_at: new Date().toISOString()
          }
        ],
        alleged_unverified: [
          {
            id: "f_02",
            description: "El 24 de octubre de 2026 su jefe le indicó verbalmente que ya no se presentara a laborar sin entregar aviso de rescisión",
            source: "Declaración de la trabajadora",
            category: "DECLARADO_PENDIENTE_VERIFICACION",
            created_at: new Date().toISOString()
          }
        ],
        unknown: [
          {
            id: "f_03",
            description: "No recuerda si firmó contrato individual de trabajo por escrito al ingresar",
            source: "Manifestación de duda de la trabajadora",
            category: "DATO_DESCONOCIDO",
            created_at: new Date().toISOString()
          }
        ]
      },
      master_markdown: {
        case_id: "pending_id",
        user_id: userA.id,
        version: 1,
        last_updated_at: new Date().toISOString(),
        content_hash: computeContentHash(initialMasterMarkdown),
        markdown_content: initialMasterMarkdown,
        update_log: [
          {
            version: 1,
            timestamp: new Date().toISOString(),
            user_input: "Hola, necesito ayuda, me despidieron verbalmente",
            facts_confirmed_added: ["Relación laboral con Comercializadora del Norte"],
            facts_pending_added: ["Despido verbal el 24 de octubre de 2026"],
            uncertainties_added: ["Existencia de contrato escrito individual"],
            contradictions_detected: [],
            hash: computeContentHash(initialMasterMarkdown)
          }
        ]
      }
    }
  };

  const { data: caseAInsert, error: caseAInsertErr } = await clientA1
    .from('legal_cases')
    .insert([initialPayloadA])
    .select()
    .single();

  if (caseAInsertErr || !caseAInsert) {
    recordResult({
      suite: "PRUEBA 1 — Persistencia Supabase",
      test: "1.2 Almacenamiento persistente de expediente en legal_cases",
      method: "clientA.from('legal_cases').insert() autenticado con JWT",
      status: "FAIL",
      evidence: `Error al insertar expediente: ${caseAInsertErr?.message}`
    });
    return;
  }

  const caseAId = caseAInsert.id;

  recordResult({
    suite: "PRUEBA 1 — Persistencia Supabase",
    test: "1.2 Almacenamiento persistente y confirmación verificable",
    method: "clientA.from('legal_cases').insert() con JWT de Usuario A",
    status: "PASS",
    evidence: `Expediente creado en backend real con ID UUID: ${caseAId}, user_id: ${caseAInsert.user_id}, status: ${caseAInsert.status}, created_at: ${caseAInsert.created_at}`
  });

  // 1.3 Almacenamiento de nueva declaración y actualización del expediente maestro
  const updatedMarkdown = `${initialMasterMarkdown}
- Hecho agregado: Sueldo quincenal declarado de $6,500 MXN`;
  const updatedStructuredState = {
    ...caseAInsert.structured_state,
    facts: {
      ...caseAInsert.structured_state.facts,
      confirmed: [
        ...caseAInsert.structured_state.facts.confirmed,
        {
          id: "f_04",
          description: "Percibía un salario de $6,500 pesos quincenales",
          source: "Declaración del usuario",
          category: "CONFIRMADO_POR_USUARIO",
          created_at: new Date().toISOString()
        }
      ]
    },
    master_markdown: {
      case_id: caseAId,
      user_id: userA.id,
      version: 2,
      last_updated_at: new Date().toISOString(),
      content_hash: computeContentHash(updatedMarkdown),
      markdown_content: updatedMarkdown,
      update_log: [
        ...caseAInsert.structured_state.master_markdown.update_log,
        {
          version: 2,
          timestamp: new Date().toISOString(),
          user_input: "Mi sueldo era de 6,500 quincenales",
          facts_confirmed_added: ["Salario de $6,500 pesos quincenales"],
          facts_pending_added: [],
          uncertainties_added: [],
          contradictions_detected: [],
          hash: computeContentHash(updatedMarkdown)
        }
      ]
    }
  };

  const { data: caseAUpdate, error: caseAUpdateErr } = await clientA1
    .from('legal_cases')
    .update({
      structured_state: updatedStructuredState,
      updated_at: new Date().toISOString()
    })
    .eq('id', caseAId)
    .select()
    .single();

  if (caseAUpdateErr || !caseAUpdate) {
    recordResult({
      suite: "PRUEBA 1 — Persistencia Supabase",
      test: "1.3 Actualización incremental con confirmación",
      method: "clientA.from('legal_cases').update() con JWT",
      status: "FAIL",
      evidence: `Error al actualizar: ${caseAUpdateErr?.message}`
    });
    return;
  }

  recordResult({
    suite: "PRUEBA 1 — Persistencia Supabase",
    test: "1.3 Actualización incremental de declaración",
    method: "clientA.from('legal_cases').update().select()",
    status: "PASS",
    evidence: `Declaración persistida en Supabase. Versión de master_markdown: ${caseAUpdate.structured_state.master_markdown.version}, hechos confirmados: ${caseAUpdate.structured_state.facts.confirmed.length}, hash: ${caseAUpdate.structured_state.master_markdown.content_hash}`
  });

  // 1.4 Simulación estricta de CIERRE DE SESIÓN: descartar completamente clientA1
  // y crear un cliente nuevo limpio e independiente
  const clientA_NewSession = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });

  // Restaurar sesión de Usuario A mediante el token persistente
  const { data: userReauth, error: reauthErr } = await clientA_NewSession.auth.setSession({
    access_token: sessionTokenA,
    refresh_token: authDataA.session.refresh_token
  });

  if (reauthErr || !userReauth?.user) {
    recordResult({
      suite: "PRUEBA 1 — Persistencia Supabase",
      test: "1.4 Nueva sesión tras cierre de la anterior",
      method: "clientA_NewSession.auth.setSession()",
      status: "FAIL",
      evidence: `Error en reautenticación: ${reauthErr?.message}`
    });
    return;
  }

  // 1.5 Recuperación desde el cliente nuevo independiente
  const { data: recoveredCaseA, error: recoverErr } = await clientA_NewSession
    .from('legal_cases')
    .select('*')
    .eq('id', caseAId)
    .single();

  if (recoverErr || !recoveredCaseA) {
    recordResult({
      suite: "PRUEBA 1 — Persistencia Supabase",
      test: "1.5 Recuperación del expediente en sesión nueva",
      method: "clientA_NewSession.from('legal_cases').select('*')",
      status: "FAIL",
      evidence: `Error al recuperar expediente en nueva sesión: ${recoverErr?.message}`
    });
    return;
  }

  const recState = recoveredCaseA.structured_state;
  const hasIdentity = recState?.identity?.full_name === "Mariana Isabel Torres Ramírez";
  const hasConfirmed = (recState?.facts?.confirmed || []).length === 2;
  const hasUnknown = (recState?.facts?.unknown || []).length === 1;
  const hasUpdateLog = (recState?.master_markdown?.update_log || []).length === 2;

  if (hasIdentity && hasConfirmed && hasUnknown && hasUpdateLog) {
    recordResult({
      suite: "PRUEBA 1 — Persistencia Supabase",
      test: "1.5 Integridad total tras recuperación en nueva sesión",
      method: "Verificación de campos, hechos, incertidumbres e historial en DB remota",
      status: "PASS",
      evidence: `Expediente recuperado íntegro: Identidad: '${recState.identity.full_name}', Hechos confirmados: ${recState.facts.confirmed.length}, Incertidumbres: ${recState.facts.unknown.length}, Entradas en update_log: ${recState.master_markdown.update_log.length}, Version: ${recState.master_markdown.version}`
    });
  } else {
    recordResult({
      suite: "PRUEBA 1 — Persistencia Supabase",
      test: "1.5 Integridad total tras recuperación en nueva sesión",
      method: "Cotejo de estado estructurado recuperado",
      status: "FAIL",
      evidence: `Faltan campos: hasIdentity=${hasIdentity}, hasConfirmed=${hasConfirmed}, hasUnknown=${hasUnknown}, hasUpdateLog=${hasUpdateLog}`
    });
  }

  // ====================================================================================
  // PRUEBA 2: AISLAMIENTO REAL ENTRE USUARIOS (TENANT ISOLATION Y RLS)
  // ====================================================================================
  console.log("--- INICIANDO PRUEBA 2: AISLAMIENTO REAL ENTRE USUARIOS (RLS) ---");

  const clientB = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });

  const userBEmail = `audit_user_b_${timestamp}@justino.app`;
  const userBPass = `TestPassword_B_${timestamp}!`;

  // 2.1 Registro real de Usuario B
  const { data: authDataB, error: authErrB } = await clientB.auth.signUp({
    email: userBEmail,
    password: userBPass,
    options: {
      data: { full_name: "Alejandro Mendoza (Sintético B)", username: `user_b_${timestamp}` }
    }
  });

  if (authErrB || !authDataB?.user || !authDataB.session) {
    recordResult({
      suite: "PRUEBA 2 — Aislamiento RLS",
      test: "2.1 Creación de Usuario B independiente",
      method: "clientB.auth.signUp",
      status: "FAIL",
      evidence: `Error al crear usuario B: ${authErrB?.message}`
    });
    return;
  }

  const userB = authDataB.user;
  const sessionTokenB = authDataB.session.access_token;

  // 2.2 Creación de expediente propio para Usuario B
  const initialPayloadB = {
    user_id: userB.id,
    title: `Expediente Arrendamiento B - ${timestamp}`,
    case_type: "arrendamiento",
    status: "active",
    state_jurisdiction: "Chihuahua",
    city_jurisdiction: "Chihuahua",
    structured_state: {
      identity: { full_name: "Alejandro Mendoza" },
      facts: { confirmed: [{ id: "fb_01", description: "Contrato de arrendamiento celebrado en 2025" }] }
    }
  };

  const { data: caseBInsert, error: caseBInsertErr } = await clientB
    .from('legal_cases')
    .insert([initialPayloadB])
    .select()
    .single();

  if (caseBInsertErr || !caseBInsert) {
    recordResult({
      suite: "PRUEBA 2 — Aislamiento RLS",
      test: "2.2 Creación de expediente para Usuario B",
      method: "clientB.from('legal_cases').insert() con JWT de Usuario B",
      status: "FAIL",
      evidence: `Error al crear caso de B: ${caseBInsertErr?.message}`
    });
    return;
  }

  const caseBId = caseBInsert.id;

  // 2.3 Usuario B consulta su propio expediente
  const { data: readSelfB, error: readSelfBErr } = await clientB
    .from('legal_cases')
    .select('*')
    .eq('id', caseBId)
    .single();

  const userBCanReadOwn = !!readSelfB && !readSelfBErr;

  // 2.4 Usuario A consulta su propio expediente
  const { data: readSelfA, error: readSelfAErr } = await clientA_NewSession
    .from('legal_cases')
    .select('*')
    .eq('id', caseAId)
    .single();

  const userACanReadOwn = !!readSelfA && !readSelfAErr;

  recordResult({
    suite: "PRUEBA 2 — Aislamiento RLS",
    test: "2.3 y 2.4 Consulta autorizada de expediente propio",
    method: "Consulta autenticada de cada usuario a su propio case_id",
    status: userACanReadOwn && userBCanReadOwn ? "PASS" : "FAIL",
    evidence: `Usuario A leyó su caso ${caseAId} (${userACanReadOwn}); Usuario B leyó su caso ${caseBId} (${userBCanReadOwn})`
  });

  // 2.5 Ataque Cruzado Directo en Supabase (RLS): Usuario A intenta leer el case_id de Usuario B
  const { data: crossReadAtoB, error: crossReadAtoBErr } = await clientA_NewSession
    .from('legal_cases')
    .select('*')
    .eq('id', caseBId);

  // Bajo RLS, Supabase devuelve un array vacío [] cuando el usuario intenta leer filas ajenas
  const rlsReadBlocked = !crossReadAtoB || crossReadAtoB.length === 0;

  recordResult({
    suite: "PRUEBA 2 — Aislamiento RLS",
    test: "2.5 Bloqueo RLS en BD: Usuario A intentando leer expediente de Usuario B",
    method: "clientA_NewSession.from('legal_cases').select('*').eq('id', caseBId)",
    status: rlsReadBlocked ? "PASS" : "FAIL",
    evidence: `Filas devueltas por Supabase para Usuario A consultando caso de B: ${crossReadAtoB?.length || 0}. RLS bloqueó completamente la lectura.`
  });

  // 2.6 Ataque Cruzado Directo en Supabase (RLS): Usuario B intenta leer el case_id de Usuario A
  const { data: crossReadBtoA } = await clientB
    .from('legal_cases')
    .select('*')
    .eq('id', caseAId);

  const rlsReadBlockedBtoA = !crossReadBtoA || crossReadBtoA.length === 0;

  recordResult({
    suite: "PRUEBA 2 — Aislamiento RLS",
    test: "2.6 Bloqueo RLS en BD: Usuario B intentando leer expediente de Usuario A",
    method: "clientB.from('legal_cases').select('*').eq('id', caseAId)",
    status: rlsReadBlockedBtoA ? "PASS" : "FAIL",
    evidence: `Filas devueltas por Supabase para Usuario B consultando caso de A: ${crossReadBtoA?.length || 0}. RLS bloqueó completamente la lectura.`
  });

  // 2.7 Ataque Cruzado de Modificación: Usuario A intenta hacer UPDATE al expediente de Usuario B
  const { data: crossUpdateAtoB, error: crossUpdateErr } = await clientA_NewSession
    .from('legal_cases')
    .update({ title: "EXPEDIENTE HACKEADO POR A" })
    .eq('id', caseBId)
    .select();

  const rlsUpdateBlocked = !crossUpdateAtoB || crossUpdateAtoB.length === 0;

  recordResult({
    suite: "PRUEBA 2 — Aislamiento RLS",
    test: "2.7 Bloqueo RLS en BD: Usuario A intentando modificar expediente de Usuario B",
    method: "clientA_NewSession.from('legal_cases').update().eq('id', caseBId)",
    status: rlsUpdateBlocked ? "PASS" : "FAIL",
    evidence: `Filas modificadas por Usuario A en caso de B: ${crossUpdateAtoB?.length || 0}. RLS impidió la modificación.`
  });

  // 2.8 Control de Autorización a Nivel Servidor HTTP (Defensa en Profundidad)
  // Probamos la ruta /api/v1/cases/:id/master-memory llamando con token de Usuario A pero caseId de B
  let serverIsolationAtoBPass = false;
  let serverIsolationDetails = '';
  try {
    const fetchRes = await fetch(`http://localhost:3000/api/v1/cases/${caseBId}/master-memory`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionTokenA}`,
        'Content-Type': 'application/json'
      }
    });

    const fetchJson = await fetchRes.json();
    if (fetchRes.status === 403 && fetchJson.code === 'FORBIDDEN') {
      serverIsolationAtoBPass = true;
      serverIsolationDetails = `HTTP Status 403 FORBIDDEN. Mensaje: "${fetchJson.error}". El servidor bloqueó la consulta antes de enviar datos.`;
    } else {
      serverIsolationDetails = `HTTP Status: ${fetchRes.status}. Respuesta: ${JSON.stringify(fetchJson)}`;
    }
  } catch (err: any) {
    serverIsolationDetails = `Error en fetch a servidor local: ${err.message}`;
  }

  recordResult({
    suite: "PRUEBA 2 — Aislamiento RLS",
    test: "2.8 Control de Autorización en Servidor (Defensa en Profundidad)",
    method: "GET /api/v1/cases/:id/master-memory con Bearer Token de Usuario A y caseId de B",
    status: serverIsolationAtoBPass ? "PASS" : "FAIL",
    evidence: serverIsolationDetails
  });

  // ====================================================================================
  // PRUEBA 3: PRECISIÓN JURÍDICA LABORAL (7 PUNTOS FORENSES)
  // ====================================================================================
  console.log("--- INICIANDO PRUEBA 3: PRECISIÓN JURÍDICA LABORAL ---");

  // 3.1 Excepciones a la conciliación prejudicial obligatoria (Art. 685-Ter LFT)
  const normExcepciones = OFFICIAL_LEGAL_CORPUS.find(n => n.topic === 'laboral_excepciones_conciliacion');
  const has685Ter = normExcepciones && normExcepciones.articles.includes('685-Ter') &&
    normExcepciones.rule.includes('discriminación') &&
    normExcepciones.rule.includes('acoso u hostigamiento sexual');

  recordResult({
    suite: "PRUEBA 3 — Precisión Jurídica Laboral",
    test: "3.1 Excepciones del Art. 685-Ter LFT registradas en el corpus normativo",
    method: "Inspección de catálogo OFFICIAL_LEGAL_CORPUS",
    status: has685Ter ? "PASS" : "FAIL",
    evidence: normExcepciones ? `${normExcepciones.norm}, ${normExcepciones.articles}: ${normExcepciones.rule}` : "No encontrado"
  });

  // 3.2 Regla de cómputo de prescripción (Arts. 518 y 522 LFT) sin atribuirle reglas al Art. 523
  const normPrescripcion = OFFICIAL_LEGAL_CORPUS.find(n => n.topic === 'laboral_despido_aviso_rescision');
  const hasArt522 = normPrescripcion && normPrescripcion.articles.includes('522') &&
    normPrescripcion.articles.includes('518') &&
    !normPrescripcion.articles.includes('523') &&
    normPrescripcion.rule.includes('fecha a fecha') &&
    !normPrescripcion.rule.includes('(60 días naturales)');

  recordResult({
    suite: "PRUEBA 3 — Precisión Jurídica Laboral",
    test: "3.2 Cómputo de prescripción de fecha a fecha (Arts. 518 y 522 LFT) sin invocar Art. 523",
    method: "Inspección de regla de prescripción en OFFICIAL_LEGAL_CORPUS",
    status: hasArt522 ? "PASS" : "FAIL",
    evidence: normPrescripcion ? `Artículos citados: ${normPrescripcion.articles}. Regla: "${normPrescripcion.rule}"` : "No encontrado"
  });

  // 3.3 Reglas de suspensión de la prescripción (Arts. 518, 521 frac. III y 684-D LFT)
  const normSuspension = OFFICIAL_LEGAL_CORPUS.find(n => n.topic === 'laboral_conciliacion_obligatoria_y_suspension');
  const hasSuspensionArticles = normSuspension && normSuspension.articles.includes('521 frac. III') &&
    normSuspension.articles.includes('518') &&
    normSuspension.articles.includes('684-D') &&
    normSuspension.rule.includes('suspende el plazo e interrumpe la prescripción') &&
    normSuspension.rule.includes('45 días naturales');

  recordResult({
    suite: "PRUEBA 3 — Precisión Jurídica Laboral",
    test: "3.3 Suspensión e interrupción de la prescripción (Arts. 518, 521 frac. III y 684-D LFT)",
    method: "Cotejo de artículos y regla de suspensión/interrupción y plazo máximo",
    status: hasSuspensionArticles ? "PASS" : "FAIL",
    evidence: normSuspension ? `${normSuspension.articles}: "${normSuspension.rule}"` : "No encontrado"
  });

  // 3.4 Vía judicial directa exenta de constancia de no conciliación (Art. 685-Ter LFT)
  const pathways = discoverLegalPathways({ primary_matter: 'laboral', detected_areas: [], confidence: 1, user_objective: '', current_situation: '', is_provisional: true }, '');
  const directPathway = pathways.find(p => p.id === 'via_laboral_demanda_directa_exenta');
  const hasDirectPathway = !!directPathway && directPathway.description.includes('685-Ter');

  recordResult({
    suite: "PRUEBA 3 — Precisión Jurídica Laboral",
    test: "3.4 Disponibilidad de vía directa sin constancia para supuestos exceptuados (Art. 685-Ter LFT)",
    method: "discoverLegalPathways('laboral')",
    status: hasDirectPathway ? "PASS" : "FAIL",
    evidence: directPathway ? `Vía identificada: "${directPathway.name}" (${directPathway.id}). Timeline: ${directPathway.estimated_timeline}. Exención legal: ${directPathway.pros[0]}` : "No identificada"
  });

  // 3.5 Distinción abstracta de competencia local vs federal (Art. 123 CPEUM frac. XXXI y Art. 527 LFT)
  const localPathway = pathways.find(p => p.id === 'via_laboral_conciliacion_prejudicial');
  const specifiesLocalJurisdiction = localPathway && localPathway.competent_authority.includes('Centro de Conciliación Laboral de la Entidad Federativa') &&
    localPathway.competent_authority.includes('art. 527 LFT');

  recordResult({
    suite: "PRUEBA 3 — Precisión Jurídica Laboral",
    test: "3.5 Competencia de fuero local vs federal generalizada (Art. 123 CPEUM / 527 LFT)",
    method: "Inspección de autoridad competente asignada en discoverLegalPathways",
    status: specifiesLocalJurisdiction ? "PASS" : "FAIL",
    evidence: localPathway ? `Autoridad asignada: "${localPathway.competent_authority}"` : "No encontrado"
  });

  // 3.6 Despido como hipótesis de reclamación provisional con presunción legal jure tantum (Art. 47 penúltimo párrafo LFT)
  const judicialPathway = pathways.find(p => p.id === 'via_laboral_juicio_ordinario');
  const treatsAsHypothesis = judicialPathway && judicialPathway.pros.some(pro =>
    pro.includes('Presunción legal de despido injustificado') && pro.includes('art. 47 LFT')
  );

  recordResult({
    suite: "PRUEBA 3 — Precisión Jurídica Laboral",
    test: "3.6 Despido como hipótesis procesal provisional sujeta a presunción legal (Art. 47 LFT)",
    method: "Inspección de vía procesal contenciosa",
    status: treatsAsHypothesis ? "PASS" : "FAIL",
    evidence: judicialPathway ? `Criterio asentado: "${judicialPathway.pros[1]}"` : "No encontrado"
  });

  // 3.7 Reconstrucción de hechos mínimos antes de fijar vía procesal definitiva
  const reqMap = buildRequirementsMap(
    { primary_matter: 'laboral', detected_areas: [], confidence: 1, user_objective: '', current_situation: '', is_provisional: true },
    pathways,
    [],
    'Hola, me despidieron verbalmente de mi trabajo'
  );

  const hasSeparationDateReq = reqMap.some(r => r.id === 'req_labor_separation_date' && r.importance === 'CRITICA');
  const hasEmployerIdentityReq = reqMap.some(r => r.id === 'req_labor_employer_identity' && r.importance === 'CRITICA');
  const hasDismissalModeReq = reqMap.some(r => r.id === 'req_labor_dismissal_mode' && r.importance === 'CRITICA');
  const hasSalarySeniorityReq = reqMap.some(r => r.id === 'req_labor_salary_seniority' && r.importance === 'ALTA');
  const doesNotAskAddressPrematurely = !reqMap.some(r => r.id === 'req_promovente_address' && r.importance === 'CRITICA');

  const factsMinimumComplete = hasSeparationDateReq && hasEmployerIdentityReq && hasDismissalModeReq && hasSalarySeniorityReq && doesNotAskAddressPrematurely;

  recordResult({
    suite: "PRUEBA 3 — Precisión Jurídica Laboral",
    test: "3.7 Reconstrucción de hechos mínimos indispensables antes de emitir recomendación procesal",
    method: "buildRequirementsMap con prompt inicial de despido",
    status: factsMinimumComplete ? "PASS" : "FAIL",
    evidence: `Requisitos indispensables levantados: Fecha separación (CRITICA=${hasSeparationDateReq}), Patrón (CRITICA=${hasEmployerIdentityReq}), Modo despido (CRITICA=${hasDismissalModeReq}), Salario/Antigüedad (ALTA=${hasSalarySeniorityReq}), Domicilio NO crítico preliminarmente (${doesNotAskAddressPrematurely})`
  });

  console.log("================================================================================");
  console.log(`RESUMEN DE AUDITORÍA: ${auditResults.filter(r => r.status === 'PASS').length} / ${auditResults.length} PRUEBAS EN PASS`);
  console.log("================================================================================");
}

runRealBackendAudit().catch(err => {
  console.error("FATAL AUDIT ERROR:", err);
  process.exit(1);
});
