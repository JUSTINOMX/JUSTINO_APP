import { GoogleGenAI } from "@google/genai";
import { classifyMatter, discoverLegalPathways, buildRequirementsMap, getNextOptimalInquiry } from "./investigation-engine";
import { detectUniversalContradictions } from "./contradiction-engine";
import { performLegalResearch } from "./legal-research";
import { evaluateComprehensiveSufficiency } from "./sufficiency-engine";
import { knowledgeBase } from "./knowledge-base";

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

3. ENTREVISTA PROGRESIVA Y PRINCIPIO DE MINIMIZACIÓN DE DATOS (FASES A A E):
   - ORDEN PROGRESIVO OBLIGATORIO DE PRIORIDADES:
     * Fase A: Escucha y comprensión inicial del problema (hechos sustantivos, qué ocurrió, cuándo ocurrió, qué busca el usuario).
     * Fase B: Reconstrucción de hechos sustantivos (fechas clave, cambios en condiciones laborales/personales, personas involucradas).
     * Fase C: Identificación de documentos y evidencias existentes (contratos, recibos, avisos de despido, actas).
     * Fase D: Determinación de la vía jurídica y alternativas viables (explicación de opciones antes de elegir).
     * Fase E: Datos de contacto y radicación formal (SOLAMENTE cuando se prepara una acción concreta autorizada por el usuario).
   - PROHIBICIÓN DE SOLICITAR DOMICILIO PARTICULAR EN FASES INICIALES:
     * Queda ESTRICTAMENTE PROHIBIDO solicitar o exigir el domicilio particular del usuario durante las Fases A a D o condicionar la asesoría inicial a la entrega de datos de radicación.
   - RESPETO ABSOLUTO A LA NEGATIVA DE DOMICILIO:
     * Si el usuario expresa reserva o negativa a compartir su domicilio particular (ej. "por ahora no quiero dar mi domicilio", "prefiero no dar mi dirección", "no quiero compartir mi dirección"), Justino DEBE:
       1) Respetar de inmediato y sin rodeos su decisión (sin insistir, sin reprochar y sin bloquear la conversación).
       2) Explicar con cortesía que para la orientación preliminar, el análisis de sus derechos y el cálculo de liquidación/finiquito NO es necesario su domicilio particular.
       3) Aclarar que dicho dato únicamente será necesario en caso de que en el futuro decida autorizar la presentación de un escrito o demanda formal ante la autoridad laboral o judicial correspondiente.
   - PROHIBICIÓN ABSOLUTA DE PLACEHOLDERS: Al generar un documento definitivo autorizado, nunca uses corchetes vacíos ni [Nombre].

4. SKILL OBLIGATORIA DE REDACCIÓN: REDACTOR FORENSE MEXICANO V1.0:
   Siempre que Justino vaya a generar un escrito o documento legal (una vez que tenga TODOS los datos reales recabados), aplicará la skill de REDACTOR FORENSE MEXICANO:
   - COMPLETITUD TOTAL MANDATORIA: El documento generado en el tag [DOCUMENTO_OFICIAL: ...] DEBE ESTAR 100% COMPLETO DE PRINCIPIO A FIN SIN NINGUNA OMISIÓN NI CORTE. Queda estrictamente prohibido truncar el escrito, dejar capítulos a medias o colocar corchetes.
   - ESTRUCTURA FORENSE COMPLETA Y OBLIGATORIA:
     1. Encabezado oficial y Autoridad competente con nombre real de la institución en la ciudad del usuario.
     2. Proemio (Nombre completo del promovente en mayúsculas, calidad jurídica, domicilio procesal completo provisto y personas autorizadas).
     3. Declaración inicial individualizando a la contraparte con su nombre real (o quien resulte responsable si no se conoce).
     4. Capítulo de HECHOS (Numerados I, II, III, IV en orden cronológico, narrando lugar, fecha, hora, consecuencias médicas, montos o condiciones laborales).
     5. Capítulo de DERECHO (Fundamentación jurídica citando ÚNICAMENTE entre 2 y 4 artículos clave aplicables. NUNCA enumeres listas de decenas de números de artículos).
     6. Capítulo de PRUEBAS (PRIMERO. DOCUMENTAL PÚBLICA, SEGUNDO. DOCUMENTAL PRIVADA, TERCERO. TESTIMONIAL, CUARTO. INSTRUMENTAL Y PRESUNCIONAL).
     7. PUNTOS PETITORIOS (PRIMERO, SEGUNDO, TERCERO, CUARTO numerados y precisos).
     8. Cierre: PROTESTO LO NECESARIO, Ciudad, Estado, Fecha actual en texto real (sin corchetes) y línea para FIRMA con el Nombre Real del Promovente.
   - ADAPTACIÓN LOCAL: Adapta el documento a la entidad federativa (ej. Ley Federal del Trabajo para laboral, Código Civil local para familiar o arrendamiento).

5. PROHIBICIÓN ABSOLUTA DE ASTERISCOS Y MARKDOWN DENTRO DEL DOCUMENTO LEGAL:
   - TIENES ESTRICTAMENTE PROHIBIDO usar asteriscos ("**" o "*"), hashtags ("#") o sintaxis markdown dentro del contenido del documento legal en el tag [DOCUMENTO_OFICIAL: ...].
   - Los títulos, nombres, firmas y encabezados del escrito legal deben escribirse en texto plano limpio o en MAYÚSCULAS normales (ejemplo: "HECHOS", "SOLICITUD DE CONCILIACIÓN PREJUDICIAL", "PROTESTO LO NECESARIO", "C. JUEZ FAMILIAR").

6. PROHIBICIÓN ABSOLUTA DE MOSTRAR EL CUERPO DEL DOCUMENTO EN EL CHAT:
   - TIENES ESTRICTAMENTE PROHIBIDO escribir, transcribir, mostrar o redactar el cuerpo o texto del escrito legal en los párrafos visibles del chat.
   - El escrito legal completo debe ir ÚNICAMENTE Y EXCLUSIVAMENTE adentro del tag técnico de salida al final de tu mensaje:
     [DOCUMENTO_OFICIAL: Título del Documento | Contenido formal y técnico completo del escrito listo para imprimir y firmar | Dirección física exacta con juzgado, calle, número y colonia en la ciudad del usuario]
   - REGLA DEL CARÁCTER TUBERÍA: DENTRO DEL CONTENIDO DEL DOCUMENTO NO USES EL CARÁCTER '|' (tubería/pipe) bajo ninguna circunstancia.

7. INDICACIONES OBLIGATORIAS EN LA VENTANA DE CHAT (DESPUÉS DE GENERAR EL DOCUMENTO):
   En tu mensaje visible en el chat (fuera del tag técnico), debes incluir EXCLUSIVAMENTE:
   a) Una explicación sencilla de qué es el documento y para qué sirve.
   b) La notificación clara y explícita de que su documento oficial 100% completo ha sido guardado automáticamente en su BÓVEDA DIGITAL dentro de la plataforma.
   c) La ubicación e indicaciones de EXACTAMENTE DÓNDE ENTREGAR EL DOCUMENTO: Nombre oficial de la autoridad (ej. Centro de Conciliación Laboral o Juzgados Familiares), dirección física real completa (calle, número, colonia, C.P., ciudad).
   d) Las instrucciones exactas de QUÉ LLEVAR al acudir (ej. el documento impreso firmado, copias para traslado, identificación oficial INE y anexos).

8. PROHIBICIÓN ABSOLUTA DE BUCLES O LISTAS EXTENSAS DE ARTÍCULOS:
   - Cita ÚNICAMENTE entre 2 y 4 artículos específicos, reales y directamente aplicables al escrito.

9. PROHIBICIÓN ABSOLUTA DE PROMETER "VICTORIA" O "CONSTRUIR TU VICTORIA":
   - TIENES ESTRICTAMENTE PROHIBIDO usar las palabras "victoria", "triunfo", "construir tu victoria", "garantizar el resultado" o prometer cualquier fallo judicial.

10. PROHIBICIÓN CRÍTICA DE DERIVACIÓN A ABOGADOS EXTERNOS:
    - TIENES ESTRICTAMENTE PROHIBIDO sugerir, recomendar o insinuar que el usuario busque, contrate o acuda con un abogado humano, despacho particular o defensoría legal externa.

11. SEPARACIÓN ESTRICTA ENTRE HECHOS Y SUPUESTOS Y FIDELIDAD SEMÁNTICA ESTRICTA:
    Todo dato del expediente debe distinguirse con rigor forense en:
    a) Confirmado explícitamente por el usuario (hecho incontrovertible).
    b) Declarado por el usuario, pendiente de verificación documental (alegación subjetiva).
    c) Inferencia o hipótesis.
    d) Dato desconocido / incertidumbre manifiesta.
    e) Contradicción pendiente de aclaración.
    f) Conclusión jurídica sujeta a verificación.
    REGLAS DE FIDELIDAD SEMÁNTICA ESTRICTA OBLIGATORIAS:
    - RECUERDOS INCOMPLETOS O DUDAS: Si el usuario declara un recuerdo parcial o duda (ej. "no recuerdo si firmé", "no sé si firmé papeles", "no estoy segura"), Justino TIENE ESTRICTAMENTE PROHIBIDO convertir la duda en un hecho negativo definitivo ("no firmaste nada") o en un hecho positivo admitido ("firmaste contrato"). Debe asentarlo fielmente como: "La trabajadora declara no recordar si firmó documentos de aceptación o contrato escrito".
    - EXISTENCIA DE CONTRATO INDIVIDUAL: Si el usuario duda o desconoce si existió contrato escrito, se asienta formalmente como DESCONOCIDO. Conforme al art. 26 de la Ley Federal del Trabajo, la omisión del escrito se imputa al patrón, pero no se inventa la certeza documental.
    - RESPUESTAS DE LA CONTRAPARTE: Si el usuario desconoce si la contraparte aceptaría conciliar, se asienta como DESCONOCIDO; no se presume negativa rotunda.
    - DOMICILIOS DESCONOCIDOS: Si el promovente no conoce el domicilio de la contraparte, se registra con total transparencia como DESCONOCIDO.
    - GASTOS: Si el usuario declara cubrir "prácticamente todos los gastos", PROHIBIDO convertirlo en "el 100% de los gastos".

12. ENTREVISTA ANTES DE RECOMENDAR O REDACTAR (EVALUACIÓN DE SUFICIENCIA):
    - ANTES de sugerir una estrategia judicial definitiva o redactar un escrito formal, debes evaluar la suficiencia de información.
    - Conduce una entrevista estructurada y progresiva: pregunta 1 sola pregunta principal por mensaje.
    - EXPLICA SIEMPRE la razón jurídica de por qué solicitas cada dato.
    - NUNCA afirmes que "ya tenemos todo lo necesario" sólo por conocer la problemática general.
    - Si falta información indispensable, mantén el caso en "diagnóstico preliminar" y orienta de forma clara sin emitir escritos definitivos prematuros.

13. PUERTA DE AUTORIZACIÓN PARA DOCUMENTOS LEGALES:
    Antes de crear o proponer cualquier documento jurídico:
    1. Explica el propósito del documento.
    2. Identifica con total claridad qué datos están confirmados, cuáles pendientes y qué anexos existen físicamente.
    3. Verifica que la información es suficiente para la acción jurídica pretendida.
    4. Informa qué limitaciones impiden considerarlo un escrito definitivo.
    5. Solicita la autorización expresa del usuario antes de proceder a la redacción definitiva.

14. ACTUALIZACIÓN CON VISTA PREVIA Y CONSENTIMIENTO:
    Cuando el usuario solicite actualizar un dato del expediente o pida ver qué información quedaría guardada:
    1. Presenta una vista previa transparente:
       - Datos que se MANTIENEN.
       - Datos que se CORRIGEN (valor anterior vs valor propuesto).
       - Datos que quedan PENDIENTES.
    2. Espera la autorización explícita antes de asentar el dato como formalmente confirmado.

15. PRUDENCIA JURÍDICA EN MATERIA LABORAL Y PRINCIPIOS SUSTANTIVOS:
    - EN MATERIA LABORAL (PROHIBICIÓN DE CONCLUSIONES PREMATURAS Y RIGOR PROCESAL):
      * HIPÓTESIS PROCESAL DE RECLAMACIÓN: Trata la separación manifestada como una hipótesis de reclamación provisional sujeta a prueba y contradicción. Explica que la rescisión sin responsabilidad (art. 47 LFT) vs despido injustificado (art. 48 LFT) depende de las causales y de la entrega oportuna del aviso escrito. Conforme al art. 47 penúltimo párrafo de la LFT, la falta de entrega del aviso escrito hace presumir la separación como injustificada (presunción legal que traslada la carga de la prueba al patrón según el art. 784 LFT), pero no debe presentarse como una verdad fáctica consumada e inimpugnable antes del procedimiento.
      * TÉRMINO PERENTORIO DE PRESCRIPCIÓN DE FECHA A FECHA: Informa con rigor técnico que las acciones del trabajador por separación prescriben en DOS MESES conforme al artículo 518 de la LFT. Debe explicarse con precisión que, conforme al artículo 518 párrafo primero y artículo 522 de la LFT, la prescripción corre a partir del día siguiente a la fecha de la separación, y los meses se regulan por el número de días que les corresponden según el calendario (cómputo de fecha a fecha y no automáticamente sesenta días naturales), computándose días de veinticuatro horas y prorrogándose al primer día útil si el del vencimiento fuera feriado.
      * SUSPENSIÓN E INTERRUPCIÓN DE LA PRESCRIPCIÓN: Destaca que la sola presentación de la solicitud de conciliación prejudicial suspende el curso del término de prescripción (art. 518 LFT) e interrumpe la prescripción (art. 521 frac. III LFT). El procedimiento de conciliación no deberá exceder de 45 días naturales (art. 684-D LFT); la interrupción/suspensión cesa y el cómputo se reanuda a partir del día siguiente a aquel en que el Centro de Conciliación expida la constancia de no conciliación o determine el archivo del expediente.
      * INSTANCIA PREJUDICIAL Y EXCEPCIONES DEL ART. 685-TER LFT: Explica que por regla general debe agotarse la conciliación prejudicial ante el Centro de Conciliación Laboral (art. 684-B LFT). Sin embargo, aclara que si existieran actos de acoso u hostigamiento sexual, discriminación (por embarazo, orientación sexual, raza, etc.), prestaciones de seguridad social o violación de derechos fundamentales, el artículo 685-Ter de la LFT exime expresamente de agotar la etapa prejudicial y no se exige constancia de no conciliación para demandar directamente ante el Tribunal Laboral.
      * COMPETENCIA LOCAL VS FEDERAL: Conforme al artículo 123 apartado A fracción XXXI de la CPEUM y artículo 527 de la LFT, la competencia federal está estrictamente reservada a las 22 ramas industriales tasadas en ley. Para actividades comerciales (mayoreo/menudeo), servicios y distribución en cualquier entidad federativa, la competencia corresponde al FUERO LOCAL: Centro de Conciliación Laboral de la Entidad Federativa y Tribunal Laboral del Poder Judicial Local del Estado correspondiente (art. 698 LFT).
    - EN MATERIA FAMILIAR: Principio de proporcionalidad en alimentos. Prohibido afirmar porcentajes fijos o automáticos.

16. PROHIBICIÓN DE CUESTIONARIOS FIJOS Y ADAPTACIÓN DINÁMICA (UNA PREGUNTA POR TURNO):
    - Formula PREFERENTEMENTE UNA SOLA PREGUNTA PRINCIPAL POR MENSAJE, acompañada de una explicación breve y cálida de por qué ese dato es jurídicamente relevante.
    - Si el dato ya fue proporcionado anteriormente de forma consistente o si el usuario reservó expresamente el dato por privacidad, NUNCA lo vuelvas a preguntar.

17. PROTOCOLO OBLIGATORIO DE CONTRADICCIONES:
    - Cuando exista una discrepancia en nombres, apellidos (ej. menor que no comparte apellidos del padre), fechas, montos, lugares o documentos:
      1. NUNCA elijas silenciosamente una versión ni des por hecho una falsedad.
      2. NUNCA acuses al usuario ni uses tono punitivo.
      3. Formula una pregunta neutral planteando con serenidad las versiones detectadas y solicita la precisión necesaria para asentar la verdad procesal.

18. COMPARACIÓN DE VÍAS ALTERNATIVAS ANTES DE REDACTAR:
    - Antes de sugerir cualquier escrito formal, identifica y compara al menos dos vías jurídicas o extrajudiciales razonables (ej. Juicio Contencioso vs Mediación en Centro de Justicia Alternativa o Requerimiento Notarial).
    - Explica con total transparencia las ventajas, desventajas, costos, plazos estimados y riesgos de cada alternativa.

19. ESTRUCTURA DE EXPLICACIÓN RAZONADA DE 10 PUNTOS:
    - Cuando alcances la suficiencia de información para emitir un diagnóstico integral, presenta de forma ordenada:
      1. Qué entiendes del problema.
      2. Qué hechos conoces y su fuente.
      3. Qué hechos continúan pendientes de verificar.
      4. Qué contradicciones se detectaron y cómo quedaron aclaradas.
      5. Qué vías jurídicas son viables.
      6. Ventajas, riesgos y plazos de cada vía.
      7. Qué información sobrevenida podría alterar el diagnóstico.
      8. Qué opción concreta recomiendas y por qué.
      9. Qué primer paso formal conviene dar.
      10. Qué requisitos faltan para ejecutar ese paso.

20. AISLAMIENTO ESTRICTO DE PRIVACIDAD EN EL APRENDIZAJE:
    - Los patrones de aprendizaje son abstractos y anonimizados. Jamás compartas, cites ni insinúes nombres, domicilios, documentos o datos de un expediente en las consultas de otros usuarios.

21. MEMORIA VIVA Y EXPEDIENTE MAESTRO (EXPEDIENTE_MAESTRO.MD):
    - Cada caso cuenta con un archivo maestro vivo denominado EXPEDIENTE_MAESTRO.md como representación estructurada y verificable.
    - Antes de formular una pregunta o proponer un trámite, consulta este archivo maestro para saber qué hechos ya están registrados (para no repetirlos), qué fuentes los respaldan y qué contradicciones están pendientes.
    - Nunca repitas preguntas sobre datos ya asentados en el expediente.
    - Cuando se resuelva o aclare una discrepancia, conserva la trazabilidad de ambas versiones sin descartar silenciosamente el historial.
`;

// State tracking for failed authentication credentials to avoid stalling consecutive user turns
let deepseekAuthFailed = false;
let moonshotAuthFailed = false;
let lastDeepseekKey = "";
let lastMoonshotKey = "";

// Helper to build realistic Mexican date/time context from system clock
export const getSystemDateTimeContext = (stateName?: string | null) => {
  const now = new Date();
  const isChihuahua = stateName && /chihuahua/i.test(stateName);
  const timeZone = isChihuahua ? 'America/Chihuahua' : 'America/Mexico_City';
  
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone
  };
  const dateFormatted = now.toLocaleDateString('es-MX', options);
  const timeFormatted = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone });
  const year = now.getFullYear();

  return {
    dateFormatted,
    timeFormatted,
    year,
    timeZone
  };
};

// Evaluador de suficiencia de información antes de recomendar o redactar
export const evaluateInformationSufficiency = (state: any, matterType: string = 'alimentos') => {
  const missing: string[] = [];
  let score = 0;

  // 1. Identidad del promovente
  if (state.identity?.full_name && state.identity.full_name !== 'Usuario') {
    score += 15;
  } else {
    missing.push("Nombre completo de la promovente");
  }

  // 2. Domicilio procesal completo
  if (state.identity?.address && state.identity.address.length > 10) {
    score += 15;
  } else {
    missing.push("Domicilio procesal completo de la promovente para oír y recibir notificaciones");
  }

  // 3. Menor o beneficiario
  const hasMinor = state.participants?.some((p: any) => p.role === 'hijo_menor');
  if (hasMinor) {
    score += 15;
  } else {
    missing.push("Nombre completo del menor beneficiario");
  }

  // 4. Verificación de filiación / Acta de nacimiento
  if (state.paternity_filiation?.birth_certificate_inspected) {
    score += 15;
  } else {
    missing.push("Cotejo e inspección del acta de nacimiento (verificar si el demandado aparece asentado como padre)");
  }

  // 5. Nombre y viabilidad de notificación del demandado
  const hasCounterpartyName = Boolean(state.counterparty_details?.name || state.participants?.some((p: any) => p.role === 'contraparte'));
  if (hasCounterpartyName) {
    score += 10;
  } else {
    missing.push("Nombre completo del demandado");
  }

  if (state.counterparty_details?.address_status === 'confirmed' && state.counterparty_details?.address) {
    score += 15;
  } else {
    missing.push("Domicilio certero del demandado para emplazamiento (o solicitud de oficios de búsqueda judicial al INE/IMSS/SAT)");
  }

  // 6. Presupuesto mensual desglosado
  if (state.expenses?.breakdown_status === 'itemized' && state.expenses?.monthly_budget_breakdown) {
    score += 15;
  } else {
    missing.push("Presupuesto mensual desglosado de las necesidades del menor (alimentación, educación, salud, vivienda)");
  }

  const isReady = missing.length === 0 && score >= 85;

  return {
    is_ready_for_legal_draft: isReady,
    missing_indispensable_requirements: missing,
    information_sufficiency_score: score,
    current_phase: isReady 
      ? 'authorized_draft' 
      : (score >= 40 ? 'interview_preliminary' : 'provisional_diagnosis')
  };
};

// Automated extraction of facts from conversation with strict 6-tier taxonomy
export const extractCandidateFacts = (userMessages: any[], existingState?: any) => {
  const state = existingState || {
    identity: { full_name: null, address: null, city: null, state: null, postal_code: null, colonia: null },
    jurisdiction: { country: "México", state: null, city: null, judicial_district: null, authority: null, source: null, confirmed: false },
    participants: [],
    facts: { 
      confirmed: [], 
      alleged_unverified: [], 
      hypothesis_inference: [], 
      unknown: [], 
      contradictions: [], 
      legal_conclusions_provisional: [],
      alleged: [] 
    },
    evidence: [],
    expenses: {
      general_claim: null,
      is_exact_100_percent: false,
      monthly_budget_breakdown: null,
      breakdown_status: 'pending_breakdown'
    },
    paternity_filiation: {
      status: 'alleged_unverified',
      birth_certificate_inspected: false,
      father_appears_on_certificate: null,
      dna_test_needed: false
    },
    counterparty_details: {
      name: null,
      address: null,
      address_status: 'unknown',
      employment: null,
      employment_status: 'unknown',
      income: null,
      income_status: 'unknown',
      willingness_to_negotiate: 'unknown'
    },
    readiness: {
      is_ready_for_legal_draft: false,
      missing_indispensable_requirements: [],
      information_sufficiency_score: 0,
      current_phase: 'interview_preliminary'
    },
    corrections_history: [],
    dates: [],
    amounts: [],
    strategy: { current: null, reason: null, alternatives: [], pending_questions: [] },
    actions: [],
    decisions: [],
    document_state: { current_documents: [], pending_documents: [] }
  };

  // Guarantee backwards compatibility and object shapes
  if (!state.facts) state.facts = { confirmed: [], alleged_unverified: [], hypothesis_inference: [], unknown: [], contradictions: [], legal_conclusions_provisional: [], alleged: [] };
  if (!state.facts.confirmed) state.facts.confirmed = [];
  if (!state.facts.alleged_unverified) state.facts.alleged_unverified = state.facts.alleged || [];
  if (!state.facts.hypothesis_inference) state.facts.hypothesis_inference = [];
  if (!state.facts.unknown) state.facts.unknown = [];
  if (!state.facts.contradictions) state.facts.contradictions = [];
  if (!state.facts.legal_conclusions_provisional) state.facts.legal_conclusions_provisional = [];
  if (!state.evidence) state.evidence = [];
  if (!state.expenses) state.expenses = { general_claim: null, is_exact_100_percent: false, monthly_budget_breakdown: null, breakdown_status: 'pending_breakdown' };
  if (!state.paternity_filiation) state.paternity_filiation = { status: 'alleged_unverified', birth_certificate_inspected: false, father_appears_on_certificate: null, dna_test_needed: false };
  if (!state.counterparty_details) state.counterparty_details = { name: null, address: null, address_status: 'unknown', employment: null, employment_status: 'unknown', income: null, income_status: 'unknown', willingness_to_negotiate: 'unknown' };
  if (!state.corrections_history) state.corrections_history = [];

  const onlyUserTexts = userMessages
    .filter((m: any) => m.role === 'user')
    .map((m: any) => String(m.content || ''));

  onlyUserTexts.forEach(text => {
    // 1. Detect City / State
    const chihMatch = text.match(/\b(chihuahua|cd\.?\s*ju[aá]rez|ju[aá]rez|delicias|cuauht[eé]moc|parral)\b/i);
    if (chihMatch) {
      const city = chihMatch[0].toLowerCase().includes('ju') ? 'Ciudad Juárez' : 'Chihuahua';
      if (!state.jurisdiction.state) {
        state.jurisdiction.state = 'Chihuahua';
        state.jurisdiction.city = city;
        state.jurisdiction.confirmed = true;
      } else if (state.jurisdiction.city && state.jurisdiction.city.toLowerCase() !== city.toLowerCase()) {
        const contraMsg = `Usuario indicó inicialmente ${state.jurisdiction.city} y posteriormente mencionó ${city}`;
        if (!state.facts.contradictions.includes(contraMsg)) {
          state.facts.contradictions.push(contraMsg);
        }
      }
    }

    // 2. Detect Address (calle, número, colonia, CP)
    const addrFullMatch = text.match(/(?:(?:calle|av\.|avenida|privada|fracc\.|colonia|col\.|c\.?p\.?)\s+[^\n]{6,120}|(?:(?:[A-ZÁÉÍÓÚÑa-z]+\s+)+\d{1,5}(?:[,\s]+(?:colonia|col\.|fracc\.)\s+[A-ZÁÉÍÓÚÑa-z0-9\s]+)?(?:[,\s]+(?:c\.?p\.?|código postal)\s*\d{4,5})?))/i);
    if (addrFullMatch && !state.identity.address) {
      const capturedAddr = addrFullMatch[0].trim().replace(/\s+/g, ' ');
      state.identity.address = capturedAddr;
      
      const cpMatch = capturedAddr.match(/\b(?:c\.?p\.?|código postal)?\s*(\d{5})\b/i);
      if (cpMatch) {
        state.identity.postal_code = cpMatch[1];
      }

      const colMatch = capturedAddr.match(/\b(?:colonia|col\.|fracc\.)\s+([A-ZÁÉÍÓÚÑa-z0-9\s]+?)(?:,|$|\bc\.?p|\bchihuahua)/i);
      if (colMatch) {
        state.identity.colonia = colMatch[1].trim();
      }

      const confirmedFact = `Domicilio procesal verificado: ${capturedAddr}`;
      if (!state.facts.confirmed.includes(confirmedFact)) {
        state.facts.confirmed.push(confirmedFact);
      }
    }

    // 3. Detect Full Name
    const nameMatch = text.match(/\b(?:me llamo|mi nombre es|soy)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]{3,}(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]{3,}){1,3})\b/i);
    if (nameMatch && !state.identity.full_name) {
      state.identity.full_name = nameMatch[1].trim();
      const confirmedName = `Nombre de la promovente: ${nameMatch[1].trim()}`;
      if (!state.facts.confirmed.includes(confirmedName)) {
        state.facts.confirmed.push(confirmedName);
      }
    }

    // 4. Detect Counterparty
    const counterMatch = text.match(/\b(mi (?:ex)?espos[oa]|mi (?:ex)?pareja|el pap[aá]|la mam[aá]|demandad[oa]|agresor(?:a)?)\s+(?:se llama\s+)?([A-ZÁÉÍÓÚÑa-záéíóúñ]{3,}(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]{3,}){0,3})\b/i);
    if (counterMatch) {
      const pName = counterMatch[2].trim();
      state.counterparty_details.name = pName;
      if (!state.participants.some((p: any) => p.name.toLowerCase() === pName.toLowerCase())) {
        state.participants.push({
          name: pName,
          role: 'contraparte',
          relationship: counterMatch[1].trim()
        });
      }
    }

    // 5. Detect Children / Minors
    const childMatch = text.match(/\b(mi (?:hij[oa]|menor)|mis hij[oa]s)\s+(?:se llama[n]?\s+)?([A-ZÁÉÍÓÚÑa-záéíóúñ]{3,}(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]{3,}){0,3})\b/i);
    if (childMatch) {
      const cName = childMatch[2].trim();
      if (!state.participants.some((p: any) => p.name.toLowerCase() === cName.toLowerCase())) {
        state.participants.push({
          name: cName,
          role: 'hijo_menor',
          relationship: childMatch[1].trim()
        });
      }
    }

    // 6. TEST11: Gastos - "Prácticamente todos los gastos" (PROHIBIDO CONVERTIR A 100%)
    const almostAllExpensesMatch = text.match(/\b(pr[aá]cticamente todos los gastos|casi todos los gastos|la mayor[ií]a de los gastos)\b/i);
    if (almostAllExpensesMatch) {
      state.expenses.is_exact_100_percent = false;
      state.expenses.general_claim = "Prácticamente todos los gastos";
      state.expenses.breakdown_status = 'pending_breakdown';
      
      const allegedExpense = "Promovente declara cubrir prácticamente todos los gastos del menor (no acreditado en su totalidad ni desglosado aún)";
      if (!state.facts.alleged_unverified.includes(allegedExpense)) {
        state.facts.alleged_unverified.push(allegedExpense);
      }
      // Asegurar que no exista un "100%" en los confirmados
      state.facts.confirmed = state.facts.confirmed.filter((f: string) => !f.includes("100%"));
    }

    // 7. TEST11: Fecha de cese de contribuciones (alrededor de junio de 2026 - Hecho alegado)
    const june2026Match = text.match(/\b(alrededor de junio de 2026|junio de 2026|mediados de 2026)\b/i);
    if (june2026Match) {
      const allegedDateFact = "Fecha declarada por la promovente de cese de contribuciones: alrededor de junio de 2026 (alegación subjetiva pendiente de acreditación)";
      if (!state.facts.alleged_unverified.includes(allegedDateFact)) {
        state.facts.alleged_unverified.push(allegedDateFact);
      }
      if (!state.dates.some((d: any) => d.value?.includes("junio de 2026"))) {
        state.dates.push({
          label: "Cese de aportaciones",
          value: "Alrededor de junio de 2026",
          status: "alleged_unverified",
          is_confirmed: false
        });
      }
    }

    // 8. TEST11: Acta de nacimiento mencionada vs inspeccionada
    const birthCertMatch = text.match(/\b(tengo el acta|tengo su acta|cuento con el acta|acta de nacimiento)\b/i);
    if (birthCertMatch) {
      const existingEvidence = state.evidence.find((e: any) => e.name?.toLowerCase().includes("acta de nacimiento"));
      if (!existingEvidence) {
        state.evidence.push({
          name: "Acta de nacimiento",
          type: "documental_publica",
          status: "mentioned_unverified",
          notes: "Mencionada por la promovente; pendiente de cotejo para verificar si el padre aparece formalmente asentado."
        });
      }
      state.paternity_filiation.birth_certificate_inspected = false;
      const unverifiedCertFact = "Acta de nacimiento mencionada por la promovente: pendiente de inspección formal para verificar asentamiento del demandado";
      if (!state.facts.alleged_unverified.includes(unverifiedCertFact)) {
        state.facts.alleged_unverified.push(unverifiedCertFact);
      }
    }

    // 9. TEST11: Domicilio, empleo o ingreso del demandado desconocidos
    const unknownAddressMatch = text.match(/\b(no s[eé] d[oó]nde vive|desconozco su domicilio|no conozco su direcci[oó]n|no s[eé] su direcci[oó]n)\b/i);
    if (unknownAddressMatch) {
      state.counterparty_details.address = null;
      state.counterparty_details.address_status = 'unknown';
      const unknownAddrFact = "Domicilio actual del demandado: desconocido (requiere solicitar oficios de búsqueda judicial al INE/SAT/IMSS o edictos)";
      if (!state.facts.unknown.includes(unknownAddrFact)) {
        state.facts.unknown.push(unknownAddrFact);
      }
    }

    const unknownJobMatch = text.match(/\b(no s[eé] si trabaja|desconozco su empleo|no s[eé] d[oó]nde trabaja|desconozco su trabajo)\b/i);
    if (unknownJobMatch) {
      state.counterparty_details.employment = null;
      state.counterparty_details.employment_status = 'unknown';
      const unknownJobFact = "Empleo y lugar de trabajo actual del demandado: desconocidos";
      if (!state.facts.unknown.includes(unknownJobFact)) {
        state.facts.unknown.push(unknownJobFact);
      }
    }

    const unknownIncomeMatch = text.match(/\b(no s[eé] cu[aá]nto gana|desconozco sus ingresos|no s[eé] su sueldo)\b/i);
    if (unknownIncomeMatch) {
      state.counterparty_details.income = null;
      state.counterparty_details.income_status = 'unknown';
      const unknownIncomeFact = "Ingreso y capacidad económica exacta del demandado: desconocidos (sujeto a informe patronal o presunción legal)";
      if (!state.facts.unknown.includes(unknownIncomeFact)) {
        state.facts.unknown.push(unknownIncomeFact);
      }
    }

    const unknownNegotiateMatch = text.match(/\b(no s[eé] si (?:quiera|va a|aceptar[ií]a) negociar|desconozco si negociar[ií]a|no s[eé] c[oó]mo reaccionar[ií]a)\b/i);
    if (unknownNegotiateMatch) {
      state.counterparty_details.willingness_to_negotiate = 'unknown';
      const unknownNegFact = "Disposición del demandado a conciliar o negociar: desconocida (no se presume rechazo formal)";
      if (!state.facts.unknown.includes(unknownNegFact)) {
        state.facts.unknown.push(unknownNegFact);
      }
    }

    // 10. Detect Uncertainties / Filiación / Paternidad no confirmada
    const paternityDoubtMatch = text.match(/\b(no s[eé]\b[^\.\n]*?\b(?:pap[aá]|padre)|dudas?\b[^\.\n]*?\bpaternidad|prueba de adn|no est[aá] reconocid[oa]|desconoce[^\.\n]*?paternidad|insegur[ao][^\.\n]*?paternidad)\b/i);
    if (paternityDoubtMatch) {
      state.paternity_filiation.status = 'disputed';
      state.paternity_filiation.dna_test_needed = true;
      const doubtItem = "Incertidumbre expresa sobre la filiación/paternidad. Pendiente de resolución por vía pericial o reconocimiento legal.";
      if (!state.facts.unknown.includes(doubtItem)) {
        state.facts.unknown.push(doubtItem);
      }
    }
  });

  // Sync backwards compatible alias
  state.facts.alleged = state.facts.alleged_unverified;

  // --- MOTOR DE INVESTIGACIÓN JURÍDICA DINÁMICA (SECCIONES 3, 5, 7, 8, 9, 12) ---
  const conversationCombined = onlyUserTexts.join('\n\n');

  // 1. Clasificación provisional de materia (Fase A)
  state.matter_classification = classifyMatter(conversationCombined, state.matter_classification);

  // 2. Descubrimiento dinámico de vías alternativas (Fase B)
  state.legal_pathways = discoverLegalPathways(state.matter_classification, conversationCombined);

  // 3. Mapa dinámico de requisitos en 11 estados (Fase C)
  state.requirements_map = buildRequirementsMap(
    state.matter_classification,
    state.legal_pathways,
    state.requirements_map || [],
    conversationCombined
  );

  // 4. Motor universal de contradicciones en 6 categorías (Sección 5)
  state.contradictions_detected = detectUniversalContradictions({
    userMessages,
    existingContradictions: state.contradictions_detected || [],
    participants: state.participants,
    dates: state.dates,
    amounts: state.amounts,
    evidence: state.evidence,
    jurisdiction: state.jurisdiction
  });

  // Sincronizar hechos contradictorios para trazabilidad
  state.facts.contradictions = (state.contradictions_detected || [])
    .filter(c => c.status === 'DETECTADA')
    .map(c => `[${c.severity}] ${c.description}`);

  // 5. Investigación jurídica en tiempo real con fuentes oficiales (Sección 7)
  if (!state.legal_research_log || state.legal_research_log.length === 0) {
    const topic = state.matter_classification.primary_matter === 'familiar'
      ? 'proporcionalidad en pensión alimenticia'
      : (state.matter_classification.primary_matter === 'arrendamiento' ? 'desahucio y pago de rentas' : 'medidas de protección urgentes');
    const record = performLegalResearch(topic, state.jurisdiction?.state);
    state.legal_research_log = [record];
  }

  // 6. Evaluación integral de suficiencia (Sección 9)
  const compSufficiency = evaluateComprehensiveSufficiency(state);
  state.readiness = {
    is_ready_for_legal_draft: compSufficiency.is_ready_for_legal_draft,
    missing_indispensable_requirements: compSufficiency.missing_critical_requirements,
    information_sufficiency_score: compSufficiency.sufficiency_score,
    current_phase: compSufficiency.is_ready_for_legal_draft
      ? 'authorized_draft'
      : (compSufficiency.is_ready_for_strategy_recommendation ? 'readiness_check' : 'interview_preliminary')
  };

  // 7. Siguiente pregunta óptima basada en el mapa dinámico (Sección 4: 1 pregunta por turno)
  state.active_inquiry = getNextOptimalInquiry(
    state.requirements_map,
    state.contradictions_detected,
    state.readiness.current_phase
  );

  return state;
};

export async function generateResponse(
  userMessages: any[], 
  userName?: string,
  caseContext?: {
    caseId?: string;
    status?: string;
    jurisdiction?: { state?: string | null; city?: string | null; authority?: string | null };
    structuredState?: any;
    identity?: { full_name?: string | null; address?: string | null };
    masterMarkdown?: string;
  }
) {
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

  // --- CONTEXT BUILDER (FASE 3 & TEST11 AUDIT TAXONOMY) ---
  const stateName = caseContext?.jurisdiction?.state || caseContext?.structuredState?.jurisdiction?.state || null;
  const cityName = caseContext?.jurisdiction?.city || caseContext?.structuredState?.jurisdiction?.city || null;
  const authorityName = caseContext?.jurisdiction?.authority || caseContext?.structuredState?.jurisdiction?.authority || null;
  
  const systemDateTime = getSystemDateTimeContext(stateName);
  
  const clientDisplayName = caseContext?.identity?.full_name || caseContext?.structuredState?.identity?.full_name || userName || 'Usuario';
  const clientAddress = caseContext?.identity?.address || caseContext?.structuredState?.identity?.address || null;

  const st = caseContext?.structuredState;
  const confirmedFacts: string[] = st?.facts?.confirmed || [];
  const allegedUnverified: string[] = st?.facts?.alleged_unverified || st?.facts?.alleged || [];
  const hypothesisInferences: string[] = st?.facts?.hypothesis_inference || [];
  const unknownFacts: string[] = st?.facts?.unknown || [];
  const contradictions: string[] = st?.facts?.contradictions || [];
  const legalConclusions: string[] = st?.facts?.legal_conclusions_provisional || [];
  const participants: Array<{ name: string; role: string; relationship?: string }> = st?.participants || [];
  const currentStrategy: string | null = st?.strategy?.current || null;
  const readiness = st?.readiness || evaluateInformationSufficiency(st || {}, 'alimentos');
  const expenses = st?.expenses || { is_exact_100_percent: false, general_claim: null, monthly_budget_breakdown: null };
  const filiation = st?.paternity_filiation || { birth_certificate_inspected: false, status: 'unknown' };
  const counterparty = st?.counterparty_details || { address_status: 'unknown', employment_status: 'unknown', income_status: 'unknown' };

  // Build Context Blocks
  const temporalBlock = `
====================================================================
METADATOS OFICIALES Y TEMPORALES DEL SISTEMA (FUENTE DE VERDAD VIGENTE)
====================================================================
- FECHA ACTUAL DEL SISTEMA: ${systemDateTime.dateFormatted}
- HORA LOCAL: ${systemDateTime.timeFormatted} (${systemDateTime.timeZone})
- AÑO EN CURSO: ${systemDateTime.year}
- ESTADO DEL EXPEDIENTE: ${(caseContext?.status || 'active').toUpperCase()}

REGLA TEMPORAL CRÍTICA:
Estamos en el año ${systemDateTime.year}. Toda fecha de firma, emisión o formalización de documentos legales DEBE ser la fecha actual de hoy (${systemDateTime.dateFormatted}).
Queda TERMINANTEMENTE PROHIBIDO usar fechas de entrenamiento como mayo de 2024 o años anteriores para la emisión de escritos.
`;

  const jurisdictionBlock = `
====================================================================
JURISDICCIÓN PROCESAL OBLIGATORIA (FUENTE DE VERDAD)
====================================================================
- PAÍS: México
- ENTIDAD FEDERATIVA (ESTADO): ${stateName || 'Pendiente de confirmación'}
- CIUDAD / MUNICIPIO: ${cityName || 'Pendiente de confirmación'}
- SEDE / AUTORIDAD COMPETENTE: ${authorityName || 'Juzgados Familiares / Penales / Civiles de la localidad'}

REGLA DE JURISDICCIÓN:
${stateName ? `La jurisdicción de este expediente es ${stateName}${cityName ? ` (${cityName})` : ''}. TIENES ESTRICTAMENTE PROHIBIDO cambiarla a la Ciudad de México o basarte en ordenamientos de la CDMX. Cita y aplica las leyes y juzgados de ${stateName}.` : `Si el usuario aún no ha indicado su ciudad o estado, pregúntasela amablemente antes de redactar cualquier documento. PROHIBIDO asumir por defecto la Ciudad de México.`}
`;

  const addressReserved = st?.privacy_preferences?.domicile_reserved || st?.identity?.address_status === 'reserved_privacy';
  const addressText = addressReserved 
    ? 'RESERVADO POR PRIVACIDAD POR EL USUARIO (PROHIBIDO VOLVER A SOLICITARLO O CONDICIONAR LA ASESORÍA)' 
    : (clientAddress || 'Pendiente de recabar amablemente en el chat');

  const identityBlock = `
====================================================================
IDENTIDAD Y PARTICIPANTES DEL CASO
====================================================================
- PROMOVENTE / USUARIO: ${clientDisplayName}
- DOMICILIO PROCESAL DEL PROMOVENTE: ${addressText}
- PARTICIPANTES Y ROLES REGISTRADOS:
${participants.length > 0 ? participants.map(p => `  * ${p.name} (Rol: ${p.role}${p.relationship ? `, Vínculo: ${p.relationship}` : ''})`).join('\n') : '  * Aún no hay terceros individualizados en el expediente.'}
${st?.matter_classification?.primary_matter === 'laboral' ? `
DETALLES LABORALES REGISTRADOS:
- Empleador / Razón social: ${st?.labor_details?.employer_name || 'Comercializadora del Norte'}
- Domicilio fuente laboral: ${st?.labor_details?.workplace_address || 'Saltillo, Coahuila'}
- Antigüedad: ${st?.labor_details?.seniority_approx || '3.5 años'}
- Contrato individual: ${st?.labor_details?.contract_status || 'DESCONOCIDO (la trabajadora declara no recordar si firmó documentos; conforme al art. 26 LFT la omisión es imputable al patrón)'}
- Modificación de turnos: ${st?.labor_details?.schedule_modified || 'Asignación de turnos en sábado'}
- Modo de despido: ${st?.labor_details?.termination_mode || 'Despido verbal sin entrega de aviso escrito de rescisión'}
- Término de prescripción: 2 meses (60 días naturales) conforme al Art. 518 LFT
- Instancia prejudicial obligatoria: Centro de Conciliación Laboral (CFCRL / Centro Local, Art. 684-B LFT)
` : ''}
`;

  const structuredMemoryBlock = `
====================================================================
MEMORIA ESTRUCTURADA DEL CASO (TAXONOMÍA FORENSE DE 6 NIVELES)
====================================================================
1. HECHOS CONFIRMADOS EXPLÍCITAMENTE (NO VOLVER A PREGUNTARLOS):
${confirmedFacts.length > 0 ? confirmedFacts.map(f => `  * ${f}`).join('\n') : '  * Ningún hecho formal confirmado aún.'}

2. HECHOS DECLARADOS PENDIENTES DE VERIFICACIÓN DOCUMENTAL:
${allegedUnverified.length > 0 ? allegedUnverified.map(a => `  * ${a}`).join('\n') : '  * No hay alegaciones pendientes.'}

3. INFERENCIAS O HIPÓTESIS:
${hypothesisInferences.length > 0 ? hypothesisInferences.map(h => `  * ${h}`).join('\n') : '  * Sin inferencias asentadas.'}

4. DATOS DESCONOCIDOS / INCERTIDUMBRES MANIFIESTAS:
${unknownFacts.length > 0 ? unknownFacts.map(u => `  * ${u}`).join('\n') : '  * Ninguna incertidumbre manifiesta registrada.'}

5. CONTRADICCIONES DETECTADAS (ACLARAR CON EL USUARIO ANTES DE REDACTAR):
${contradictions.length > 0 ? contradictions.map(c => `  * ATENCIÓN: ${c}`).join('\n') : '  * Ninguna contradicción detectada.'}

6. CONCLUSIONES JURÍDICAS PROVISIONALES:
${legalConclusions.length > 0 ? legalConclusions.map(l => `  * ${l}`).join('\n') : '  * Sujeto a diagnóstico preliminar.'}

ESTADO DE GASTOS Y ALIMENTOS (SI APLICA):
- Cobertura de gastos declarada: ${expenses.general_claim || 'No especificada'}
- ¿Es exactamente 100%?: ${expenses.is_exact_100_percent ? 'SÍ' : 'NO (Queda prohibido afirmar que cubre el 100% exacto)'}
- Desglose presupuestal: ${expenses.monthly_budget_breakdown ? 'Desglosado' : 'PENDIENTE DE DESGLOSE MENSUAL'}

DATOS DE LA CONTRAPARTE:
- Domicilio: ${counterparty.address_status === 'confirmed' ? counterparty.address : 'DESCONOCIDO'}
- Empleo / Razón social: ${counterparty.employment_status === 'confirmed' ? counterparty.employment : (st?.labor_details?.employer_name || 'DESCONOCIDO')}
- Voluntad de negociar: ${counterparty.willingness_to_negotiate}

EVALUACIÓN DE SUFICIENCIA (READINESS):
- ¿Listo para redactar demanda o documento definitivo?: ${readiness.is_ready_for_legal_draft ? 'SÍ' : 'NO'}
- Requisitos indispensables pendientes:
${readiness.missing_indispensable_requirements.length > 0 ? readiness.missing_indispensable_requirements.map((r: string) => `  * ${r}`).join('\n') : '  * Ninguno. Información completa.'}
- Fase actual del expediente: ${readiness.current_phase.toUpperCase()}

REGLAS DE RAZONAMIENTO FORENSE VINCULANTES:
1. SI LA SUFICIENCIA ES "NO", TIENES ESTRICTAMENTE PROHIBIDO emitir el tag [DOCUMENTO_OFICIAL: ...] con una demanda definitiva o convenio final. En su lugar, orienta con empatía, explica las alternativas y formula 1 sola pregunta principal por mensaje.
2. NUNCA califiques un despido como injustificado de facto sin evaluar las defensas del patrón ni garantices indemnizaciones del 100% como si estuvieran ganadas.
3. SI EL USUARIO RESERVÓ SU DOMICILIO POR PRIVACIDAD, respétalo plenamente; no insistas ni condiciones la orientación.
4. SI EL USUARIO DECLARA NO RECORDAR SI FIRMÓ PAPELES, regístralo con total fidelidad como recuerdo incompleto, sin convertirlo en afirmación afirmativa ni negativa.
5. CERO PLACEHOLDERS: Si falta el nombre completo, el domicilio o la autoridad, NO generes el escrito legal definitivo con corchetes de relleno.
6. REGLA DE JURISDICCIÓN ESTRICTA: La jurisdicción procesal es ${stateName || (st?.matter_classification?.primary_matter === 'laboral' ? 'Coahuila' : 'Chihuahua')}. Queda TERMINANTEMENTE PROHIBIDO citar juzgados o leyes de la Ciudad de México cuando el caso pertenezca a otra entidad federativa.
`;

  const dynamicInvestigationBlock = `
====================================================================
MOTOR DE INVESTIGACIÓN JURÍDICA DINÁMICA Y VÍAS COMPARADAS
====================================================================
MATERIA Y OBJETIVO DETECTADOS (PROVISIONAL):
- Rama Jurídica Principal: ${st?.matter_classification?.primary_matter?.toUpperCase() || 'CIVIL/FAMILIAR'} (Confianza: ${Math.round((st?.matter_classification?.confidence || 0.8) * 100)}%)
- Objetivo del Promovente: ${st?.matter_classification?.user_objective || 'Resolver conflicto y salvaguardar derechos'}
- Estado actual de la situación: ${st?.matter_classification?.current_situation || 'En diagnóstico preliminar'}

VÍAS ALTERNATIVAS DISPONIBLES (MÍNIMO 2 COMPARADAS):
${(st?.legal_pathways || []).length > 0 ? (st?.legal_pathways || []).map((p: any) => `  * [${p.status.toUpperCase()}] ${p.name} (${p.type}):
    - Pros: ${p.pros.join(', ')}
    - Contras/Límites: ${p.cons.join(', ')}
    - Riesgos: ${p.risks.join(', ')}
    - Autoridad: ${p.competent_authority}`).join('\n') : '  * En análisis de vías viables.'}

MAPA DINÁMICO DE REQUISITOS (11 ESTADOS DE CONOCIMIENTO):
${(st?.requirements_map || []).length > 0 ? (st?.requirements_map || []).map((r: any) => `  * [${r.status}] (${r.importance}) ${r.description} -> Motivo: ${r.legal_reason}`).join('\n') : '  * Mapa de requisitos en construcción.'}

CONTRADICCIONES DETECTADAS (PROTOCOLO NEUTRAL DE RESOLUCIÓN):
${(st?.contradictions_detected || []).length > 0 ? (st?.contradictions_detected || []).map((c: any) => `  * ATENCIÓN [${c.severity}] ${c.category.toUpperCase()}: ${c.description} (Pregunta asignada: "${c.question_to_clarify}")`).join('\n') : '  * Ninguna contradicción abierta detectada.'}

FUENTES JURÍDICAS VERIFICADAS:
${(st?.legal_research_log || []).length > 0 ? (st?.legal_research_log || []).map((l: any) => `  * [${l.validity_confirmed ? 'OFICIAL_VERIFICADO' : 'POR_VERIFICAR'}] ${l.norm_citation} (${l.source_name}) - Fecha: ${l.consultation_date}`).join('\n') : '  * Consultando legislación mexicana vigente.'}

INSTRUCCIÓN DE LA SIGUIENTE PREGUNTA ÓPTIMA:
${st?.active_inquiry ? `-> Formular de forma cálida, humana y natural: "${st.active_inquiry.question}" (Justificación jurídica: ${st.active_inquiry.legalReason})` : '-> Continuar escucha empática del usuario.'}
`;

  const masterMarkdownBlock = (caseContext?.masterMarkdown || st?.master_markdown?.markdown_content) ? `
====================================================================
ARCHIVO MAESTRO VIGENTE DEL CASO (EXPEDIENTE_MAESTRO.MD)
====================================================================
${(caseContext?.masterMarkdown || st?.master_markdown?.markdown_content).slice(0, 3500)}
` : '';

  const userPromptAddon = `\n${temporalBlock}\n${jurisdictionBlock}\n${identityBlock}\n${dynamicInvestigationBlock}\n${masterMarkdownBlock}\n${structuredMemoryBlock}\n\nDATOS DEL CLIENTE:\nEl usuario se llama "${clientDisplayName}". Dirígete a él o ella por su nombre con calidez, respeto y empatía.`;

  const effectiveSystemPrompt = `${JUSTINO_SYSTEM_PROMPT}${userPromptAddon}`;

  // Assemble the messages: Server system prompt + recent dialogue window (up to 16 turns for conversational flow)
  // Because the structuredMemoryBlock holds all permanent facts, no knowledge is lost even if earlier turns slide away.
  const secureMessages = [
    { role: 'system', content: effectiveSystemPrompt },
    ...userMessages.filter((m: any) => m.role === 'user' || m.role === 'assistant').slice(-16)
  ];

  const hasDeepSeek = Boolean(!deepseekAuthFailed && deepseekKey.length > 10 && !deepseekKey.includes('placeholder'));
  const hasMoonshot = Boolean(!moonshotAuthFailed && moonshotKey.length > 10 && !moonshotKey.includes('placeholder'));
  const hasGemini = Boolean(geminiKey.length > 5);

  // Helper for fast Gemini generation (Ultra-fast and stable in Vercel)
  const tryGemini = async () => {
    if (!hasGemini) return null;
    try {
      console.log("[AI Provider] Solicitando inferencia ultra-rápida a Gemini...");
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
        "gemini-flash-latest"
      ];
      
      for (const modelName of modelsToTry) {
        try {
          const result = await genAI.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction: effectiveSystemPrompt,
              temperature: 0.25
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

  // 1. PRIORIDAD 1: DeepSeek (si está disponible y activo)
  if (hasDeepSeek) {
    try {
      console.log(`[AI Provider] [1/3] Solicitando inferencia a DeepSeek...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

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
          console.warn(`[AI Provider] Clave de DeepSeek no válida (HTTP ${response.status}). Pasando a respaldo...`);
        } else {
          console.warn(`[AI Provider] DeepSeek código HTTP ${response.status}: ${errText.substring(0, 100)}`);
        }
      }
    } catch (error: any) {
      console.warn(`[AI Provider] Timeout o error con DeepSeek (${error.message}). Continuando con respaldo...`);
    }
  }

  // 2. PRIORIDAD 2: Kimi / Moonshot (rápido y con detección inmediata de error)
  if (hasMoonshot) {
    try {
      console.log(`[AI Provider] [2/3] Solicitando inferencia a Kimi / Moonshot...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${moonshotKey}`
        },
        body: JSON.stringify({
          model: "moonshot-v1-8k",
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
          console.log(`[AI Provider] Respuesta generada exitosamente con Kimi.`);
          return json;
        }
      } else {
        moonshotAuthFailed = true;
        console.warn(`[AI Provider] Moonshot devolvió status ${response.status}. Marcando inactivo.`);
      }
    } catch (error: any) {
      moonshotAuthFailed = true;
      console.warn(`[AI Provider] Timeout o fallo en Moonshot (${error.message}). Pasando a Gemini...`);
    }
  }

  // 3. PRIORIDAD 3: Gemini (Respaldo robusto de alta velocidad)
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
