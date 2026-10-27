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

11. SEPARACI\xD3N ESTRICTA ENTRE HECHOS Y SUPUESTOS (TAXONOM\xCDA DE 6 NIVELES):
    Todo dato del expediente debe distinguirse con rigor forense en:
    a) Confirmado expl\xEDcitamente por el usuario (hecho incontrovertible).
    b) Declarado por el usuario, pendiente de verificaci\xF3n documental (alegaci\xF3n subjetiva).
    c) Inferencia o hip\xF3tesis.
    d) Dato desconocido / incertidumbre manifiesta.
    e) Contradicci\xF3n pendiente de aclaraci\xF3n.
    f) Conclusi\xF3n jur\xEDdica sujeta a verificaci\xF3n.
    REGLAS ESPEC\xCDFICAS OBLIGATORIAS:
    - Si el usuario declara que la contraparte dej\xF3 de contribuir "alrededor de junio de 2026", reg\xEDstralo como fecha alegada/declarada, NO como hecho formalmente admitido por la contraparte.
    - Si el usuario dice que ha tenido que cubrir "pr\xE1cticamente todos los gastos", TIENES ESTRICTAMENTE PROHIBIDO convertirlo en "el 100% de los gastos".
    - Si el usuario menciona tener un documento (ej. "tengo el acta de nacimiento"), NO asumas que el documento ya fue cotejado ni que acredita la filiaci\xF3n de la contraparte hasta que sea inspeccionado. Reg\xEDstralo como prueba mencionada no verificada.
    - Si el usuario desconoce el domicilio, empleo o ingreso actual de la contraparte, asienta con total transparencia que son DESCONOCIDOS. NUNCA inventes domicilios, empleos ficticios ni supongas montos salariales.
    - Si no existe un presupuesto mensual desglosado, reg\xEDstralo como presupuesto pendiente. NUNCA asumas montos arbitrarios.
    - Si el usuario desconoce si la contraparte negociar\xEDa, reg\xEDstralo como desconocido; NO presuma negativa rotunda.

12. ENTREVISTA ANTES DE RECOMENDAR O REDACTAR (EVALUACI\xD3N DE SUFICIENCIA):
    - ANTES de sugerir una estrategia judicial definitiva o redactar un escrito formal, debes evaluar la suficiencia de informaci\xF3n.
    - Conduce una entrevista estructurada y progresiva: pregunta 1 o m\xE1ximo 2 datos esenciales por turno.
    - EXPLICA SIEMPRE la raz\xF3n jur\xEDdica de por qu\xE9 solicitas cada dato (ej. "Para cuantificar una pensi\xF3n proporcional ante el juez conforme al C\xF3digo Civil, es indispensable desglosar los rubros b\xE1sicos de alimentaci\xF3n, colegiatura y salud...").
    - NUNCA afirmes que "ya tenemos todo lo necesario" s\xF3lo por conocer la problem\xE1tica general.
    - Si falta informaci\xF3n indispensable, mant\xE9n el caso en "diagn\xF3stico preliminar" y orienta de forma clara sin emitir escritos definitivos prematuros.

13. PUERTA DE AUTORIZACI\xD3N PARA DOCUMENTOS LEGALES:
    Antes de crear o proponer cualquier documento jur\xEDdico:
    1. Explica el prop\xF3sito del documento.
    2. Identifica con total claridad qu\xE9 datos est\xE1n confirmados, cu\xE1les pendientes y qu\xE9 anexos existen f\xEDsicamente.
    3. Verifica que la informaci\xF3n es suficiente para la acci\xF3n jur\xEDdica pretendida.
    4. Informa qu\xE9 limitaciones impiden considerarlo un escrito definitivo.
    5. Solicita la autorizaci\xF3n expresa del usuario cuando corresponda.
    - Si faltan datos cr\xEDticos (domicilio del demandado, cotejo de filiaci\xF3n, desglose de necesidades), NO emitas el tag [DOCUMENTO_OFICIAL: ...] definitivo; emite preguntas y explicaciones sobre la preparaci\xF3n previa o diligencias prejudiciales de b\xFAsqueda.

14. ACTUALIZACI\xD3N CON VISTA PREVIA Y CONSENTIMIENTO:
    Cuando el usuario solicite actualizar un dato del expediente o pida ver qu\xE9 informaci\xF3n quedar\xEDa guardada:
    1. Presenta una vista previa transparente:
       - Datos que se MANTIENEN.
       - Datos que se CORRIGEN (valor anterior vs valor propuesto).
       - Datos que quedan PENDIENTES.
    2. Espera la autorizaci\xF3n expl\xEDcita antes de asentar el dato como formalmente confirmado.
    3. Confirma el resultado \xFAnicamente tras la verificaci\xF3n de la operaci\xF3n real.

15. FUNDAMENTACI\xD3N JUR\xCDDICA Y PRINCIPIO DE PROPORCIONALIDAD (PROHIBICI\xD3N DE PORCENTAJES FIJOS):
    - En materia de alimentos bajo la ley mexicana (C\xF3digos Civiles locales y C\xF3digo Nacional de Procedimientos Civiles y Familiares), la pensi\xF3n alimenticia se rige por el PRINCIPIO DE PROPORCIONALIDAD: a la posibilidad de quien debe darlos y a la necesidad de quien debe recibirlos.
    - TIENES ESTRICTAMENTE PROHIBIDO afirmar que la ley otorga un porcentaje fijo o autom\xE1tico (como afirmar falsamente "la ley fija el 30% al 40% obligatorio").
    - NUNCA garantices medidas cautelares autom\xE1ticas ni decisiones judiciales.
    - Si se desconoce el domicilio del demandado, explica con precisi\xF3n la v\xEDa procesal real: solicitar al juez oficios de localizaci\xF3n y b\xFAsqueda dirigidos a instituciones p\xFAblicas (INE, IMSS, SAT) o notificaci\xF3n por edictos.
`;
var deepseekAuthFailed = false;
var moonshotAuthFailed = false;
var lastDeepseekKey = "";
var lastMoonshotKey = "";
var getSystemDateTimeContext = (stateName) => {
  const now = /* @__PURE__ */ new Date();
  const isChihuahua = stateName && /chihuahua/i.test(stateName);
  const timeZone = isChihuahua ? "America/Chihuahua" : "America/Mexico_City";
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone
  };
  const dateFormatted = now.toLocaleDateString("es-MX", options);
  const timeFormatted = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone });
  const year = now.getFullYear();
  return {
    dateFormatted,
    timeFormatted,
    year,
    timeZone
  };
};
var evaluateInformationSufficiency = (state, matterType = "alimentos") => {
  const missing = [];
  let score = 0;
  if (state.identity?.full_name && state.identity.full_name !== "Usuario") {
    score += 15;
  } else {
    missing.push("Nombre completo de la promovente");
  }
  if (state.identity?.address && state.identity.address.length > 10) {
    score += 15;
  } else {
    missing.push("Domicilio procesal completo de la promovente para o\xEDr y recibir notificaciones");
  }
  const hasMinor = state.participants?.some((p) => p.role === "hijo_menor");
  if (hasMinor) {
    score += 15;
  } else {
    missing.push("Nombre completo del menor beneficiario");
  }
  if (state.paternity_filiation?.birth_certificate_inspected) {
    score += 15;
  } else {
    missing.push("Cotejo e inspecci\xF3n del acta de nacimiento (verificar si el demandado aparece asentado como padre)");
  }
  const hasCounterpartyName = Boolean(state.counterparty_details?.name || state.participants?.some((p) => p.role === "contraparte"));
  if (hasCounterpartyName) {
    score += 10;
  } else {
    missing.push("Nombre completo del demandado");
  }
  if (state.counterparty_details?.address_status === "confirmed" && state.counterparty_details?.address) {
    score += 15;
  } else {
    missing.push("Domicilio certero del demandado para emplazamiento (o solicitud de oficios de b\xFAsqueda judicial al INE/IMSS/SAT)");
  }
  if (state.expenses?.breakdown_status === "itemized" && state.expenses?.monthly_budget_breakdown) {
    score += 15;
  } else {
    missing.push("Presupuesto mensual desglosado de las necesidades del menor (alimentaci\xF3n, educaci\xF3n, salud, vivienda)");
  }
  const isReady = missing.length === 0 && score >= 85;
  return {
    is_ready_for_legal_draft: isReady,
    missing_indispensable_requirements: missing,
    information_sufficiency_score: score,
    current_phase: isReady ? "authorized_draft" : score >= 40 ? "interview_preliminary" : "provisional_diagnosis"
  };
};
var extractCandidateFacts = (userMessages, existingState) => {
  const state = existingState || {
    identity: { full_name: null, address: null, city: null, state: null, postal_code: null, colonia: null },
    jurisdiction: { country: "M\xE9xico", state: null, city: null, judicial_district: null, authority: null, source: null, confirmed: false },
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
      breakdown_status: "pending_breakdown"
    },
    paternity_filiation: {
      status: "alleged_unverified",
      birth_certificate_inspected: false,
      father_appears_on_certificate: null,
      dna_test_needed: false
    },
    counterparty_details: {
      name: null,
      address: null,
      address_status: "unknown",
      employment: null,
      employment_status: "unknown",
      income: null,
      income_status: "unknown",
      willingness_to_negotiate: "unknown"
    },
    readiness: {
      is_ready_for_legal_draft: false,
      missing_indispensable_requirements: [],
      information_sufficiency_score: 0,
      current_phase: "interview_preliminary"
    },
    corrections_history: [],
    dates: [],
    amounts: [],
    strategy: { current: null, reason: null, alternatives: [], pending_questions: [] },
    actions: [],
    decisions: [],
    document_state: { current_documents: [], pending_documents: [] }
  };
  if (!state.facts) state.facts = { confirmed: [], alleged_unverified: [], hypothesis_inference: [], unknown: [], contradictions: [], legal_conclusions_provisional: [], alleged: [] };
  if (!state.facts.confirmed) state.facts.confirmed = [];
  if (!state.facts.alleged_unverified) state.facts.alleged_unverified = state.facts.alleged || [];
  if (!state.facts.hypothesis_inference) state.facts.hypothesis_inference = [];
  if (!state.facts.unknown) state.facts.unknown = [];
  if (!state.facts.contradictions) state.facts.contradictions = [];
  if (!state.facts.legal_conclusions_provisional) state.facts.legal_conclusions_provisional = [];
  if (!state.evidence) state.evidence = [];
  if (!state.expenses) state.expenses = { general_claim: null, is_exact_100_percent: false, monthly_budget_breakdown: null, breakdown_status: "pending_breakdown" };
  if (!state.paternity_filiation) state.paternity_filiation = { status: "alleged_unverified", birth_certificate_inspected: false, father_appears_on_certificate: null, dna_test_needed: false };
  if (!state.counterparty_details) state.counterparty_details = { name: null, address: null, address_status: "unknown", employment: null, employment_status: "unknown", income: null, income_status: "unknown", willingness_to_negotiate: "unknown" };
  if (!state.corrections_history) state.corrections_history = [];
  const onlyUserTexts = userMessages.filter((m) => m.role === "user").map((m) => String(m.content || ""));
  onlyUserTexts.forEach((text) => {
    const chihMatch = text.match(/\b(chihuahua|cd\.?\s*ju[aá]rez|ju[aá]rez|delicias|cuauht[eé]moc|parral)\b/i);
    if (chihMatch) {
      const city = chihMatch[0].toLowerCase().includes("ju") ? "Ciudad Ju\xE1rez" : "Chihuahua";
      if (!state.jurisdiction.state) {
        state.jurisdiction.state = "Chihuahua";
        state.jurisdiction.city = city;
        state.jurisdiction.confirmed = true;
      } else if (state.jurisdiction.city && state.jurisdiction.city.toLowerCase() !== city.toLowerCase()) {
        const contraMsg = `Usuario indic\xF3 inicialmente ${state.jurisdiction.city} y posteriormente mencion\xF3 ${city}`;
        if (!state.facts.contradictions.includes(contraMsg)) {
          state.facts.contradictions.push(contraMsg);
        }
      }
    }
    const addrFullMatch = text.match(/(?:(?:calle|av\.|avenida|privada|fracc\.|colonia|col\.|c\.?p\.?)\s+[^\n]{6,120}|(?:(?:[A-ZÁÉÍÓÚÑa-z]+\s+)+\d{1,5}(?:[,\s]+(?:colonia|col\.|fracc\.)\s+[A-ZÁÉÍÓÚÑa-z0-9\s]+)?(?:[,\s]+(?:c\.?p\.?|código postal)\s*\d{4,5})?))/i);
    if (addrFullMatch && !state.identity.address) {
      const capturedAddr = addrFullMatch[0].trim().replace(/\s+/g, " ");
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
    const nameMatch = text.match(/\b(?:me llamo|mi nombre es|soy)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]{3,}(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]{3,}){1,3})\b/i);
    if (nameMatch && !state.identity.full_name) {
      state.identity.full_name = nameMatch[1].trim();
      const confirmedName = `Nombre de la promovente: ${nameMatch[1].trim()}`;
      if (!state.facts.confirmed.includes(confirmedName)) {
        state.facts.confirmed.push(confirmedName);
      }
    }
    const counterMatch = text.match(/\b(mi (?:ex)?espos[oa]|mi (?:ex)?pareja|el pap[aá]|la mam[aá]|demandad[oa]|agresor(?:a)?)\s+(?:se llama\s+)?([A-ZÁÉÍÓÚÑa-záéíóúñ]{3,}(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]{3,}){0,3})\b/i);
    if (counterMatch) {
      const pName = counterMatch[2].trim();
      state.counterparty_details.name = pName;
      if (!state.participants.some((p) => p.name.toLowerCase() === pName.toLowerCase())) {
        state.participants.push({
          name: pName,
          role: "contraparte",
          relationship: counterMatch[1].trim()
        });
      }
    }
    const childMatch = text.match(/\b(mi (?:hij[oa]|menor)|mis hij[oa]s)\s+(?:se llama[n]?\s+)?([A-ZÁÉÍÓÚÑa-záéíóúñ]{3,}(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]{3,}){0,3})\b/i);
    if (childMatch) {
      const cName = childMatch[2].trim();
      if (!state.participants.some((p) => p.name.toLowerCase() === cName.toLowerCase())) {
        state.participants.push({
          name: cName,
          role: "hijo_menor",
          relationship: childMatch[1].trim()
        });
      }
    }
    const almostAllExpensesMatch = text.match(/\b(pr[aá]cticamente todos los gastos|casi todos los gastos|la mayor[ií]a de los gastos)\b/i);
    if (almostAllExpensesMatch) {
      state.expenses.is_exact_100_percent = false;
      state.expenses.general_claim = "Pr\xE1cticamente todos los gastos";
      state.expenses.breakdown_status = "pending_breakdown";
      const allegedExpense = "Promovente declara cubrir pr\xE1cticamente todos los gastos del menor (no acreditado en su totalidad ni desglosado a\xFAn)";
      if (!state.facts.alleged_unverified.includes(allegedExpense)) {
        state.facts.alleged_unverified.push(allegedExpense);
      }
      state.facts.confirmed = state.facts.confirmed.filter((f) => !f.includes("100%"));
    }
    const june2026Match = text.match(/\b(alrededor de junio de 2026|junio de 2026|mediados de 2026)\b/i);
    if (june2026Match) {
      const allegedDateFact = "Fecha declarada por la promovente de cese de contribuciones: alrededor de junio de 2026 (alegaci\xF3n subjetiva pendiente de acreditaci\xF3n)";
      if (!state.facts.alleged_unverified.includes(allegedDateFact)) {
        state.facts.alleged_unverified.push(allegedDateFact);
      }
      if (!state.dates.some((d) => d.value?.includes("junio de 2026"))) {
        state.dates.push({
          label: "Cese de aportaciones",
          value: "Alrededor de junio de 2026",
          status: "alleged_unverified",
          is_confirmed: false
        });
      }
    }
    const birthCertMatch = text.match(/\b(tengo el acta|tengo su acta|cuento con el acta|acta de nacimiento)\b/i);
    if (birthCertMatch) {
      const existingEvidence = state.evidence.find((e) => e.name?.toLowerCase().includes("acta de nacimiento"));
      if (!existingEvidence) {
        state.evidence.push({
          name: "Acta de nacimiento",
          type: "documental_publica",
          status: "mentioned_unverified",
          notes: "Mencionada por la promovente; pendiente de cotejo para verificar si el padre aparece formalmente asentado."
        });
      }
      state.paternity_filiation.birth_certificate_inspected = false;
      const unverifiedCertFact = "Acta de nacimiento mencionada por la promovente: pendiente de inspecci\xF3n formal para verificar asentamiento del demandado";
      if (!state.facts.alleged_unverified.includes(unverifiedCertFact)) {
        state.facts.alleged_unverified.push(unverifiedCertFact);
      }
    }
    const unknownAddressMatch = text.match(/\b(no s[eé] d[oó]nde vive|desconozco su domicilio|no conozco su direcci[oó]n|no s[eé] su direcci[oó]n)\b/i);
    if (unknownAddressMatch) {
      state.counterparty_details.address = null;
      state.counterparty_details.address_status = "unknown";
      const unknownAddrFact = "Domicilio actual del demandado: desconocido (requiere solicitar oficios de b\xFAsqueda judicial al INE/SAT/IMSS o edictos)";
      if (!state.facts.unknown.includes(unknownAddrFact)) {
        state.facts.unknown.push(unknownAddrFact);
      }
    }
    const unknownJobMatch = text.match(/\b(no s[eé] si trabaja|desconozco su empleo|no s[eé] d[oó]nde trabaja|desconozco su trabajo)\b/i);
    if (unknownJobMatch) {
      state.counterparty_details.employment = null;
      state.counterparty_details.employment_status = "unknown";
      const unknownJobFact = "Empleo y lugar de trabajo actual del demandado: desconocidos";
      if (!state.facts.unknown.includes(unknownJobFact)) {
        state.facts.unknown.push(unknownJobFact);
      }
    }
    const unknownIncomeMatch = text.match(/\b(no s[eé] cu[aá]nto gana|desconozco sus ingresos|no s[eé] su sueldo)\b/i);
    if (unknownIncomeMatch) {
      state.counterparty_details.income = null;
      state.counterparty_details.income_status = "unknown";
      const unknownIncomeFact = "Ingreso y capacidad econ\xF3mica exacta del demandado: desconocidos (sujeto a informe patronal o presunci\xF3n legal)";
      if (!state.facts.unknown.includes(unknownIncomeFact)) {
        state.facts.unknown.push(unknownIncomeFact);
      }
    }
    const unknownNegotiateMatch = text.match(/\b(no s[eé] si (?:quiera|va a|aceptar[ií]a) negociar|desconozco si negociar[ií]a|no s[eé] c[oó]mo reaccionar[ií]a)\b/i);
    if (unknownNegotiateMatch) {
      state.counterparty_details.willingness_to_negotiate = "unknown";
      const unknownNegFact = "Disposici\xF3n del demandado a conciliar o negociar: desconocida (no se presume rechazo formal)";
      if (!state.facts.unknown.includes(unknownNegFact)) {
        state.facts.unknown.push(unknownNegFact);
      }
    }
    const paternityDoubtMatch = text.match(/\b(no s[eé]\b[^\.\n]*?\b(?:pap[aá]|padre)|dudas?\b[^\.\n]*?\bpaternidad|prueba de adn|no est[aá] reconocid[oa]|desconoce[^\.\n]*?paternidad|insegur[ao][^\.\n]*?paternidad)\b/i);
    if (paternityDoubtMatch) {
      state.paternity_filiation.status = "disputed";
      state.paternity_filiation.dna_test_needed = true;
      const doubtItem = "Incertidumbre expresa sobre la filiaci\xF3n/paternidad. Pendiente de resoluci\xF3n por v\xEDa pericial o reconocimiento legal.";
      if (!state.facts.unknown.includes(doubtItem)) {
        state.facts.unknown.push(doubtItem);
      }
    }
  });
  state.facts.alleged = state.facts.alleged_unverified;
  state.readiness = evaluateInformationSufficiency(state, "alimentos");
  return state;
};
async function generateResponse(userMessages, userName, caseContext) {
  const deepseekKey = (process.env.DEEPSEEK_API_KEY || "").trim();
  const moonshotKey = (process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY || process.env.KIMI_KEY || "").trim();
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (deepseekKey !== lastDeepseekKey) {
    deepseekAuthFailed = false;
    lastDeepseekKey = deepseekKey;
  }
  if (moonshotKey !== lastMoonshotKey) {
    moonshotAuthFailed = false;
    lastMoonshotKey = moonshotKey;
  }
  const stateName = caseContext?.jurisdiction?.state || caseContext?.structuredState?.jurisdiction?.state || null;
  const cityName = caseContext?.jurisdiction?.city || caseContext?.structuredState?.jurisdiction?.city || null;
  const authorityName = caseContext?.jurisdiction?.authority || caseContext?.structuredState?.jurisdiction?.authority || null;
  const systemDateTime = getSystemDateTimeContext(stateName);
  const clientDisplayName = caseContext?.identity?.full_name || caseContext?.structuredState?.identity?.full_name || userName || "Usuario";
  const clientAddress = caseContext?.identity?.address || caseContext?.structuredState?.identity?.address || null;
  const st = caseContext?.structuredState;
  const confirmedFacts = st?.facts?.confirmed || [];
  const allegedUnverified = st?.facts?.alleged_unverified || st?.facts?.alleged || [];
  const hypothesisInferences = st?.facts?.hypothesis_inference || [];
  const unknownFacts = st?.facts?.unknown || [];
  const contradictions = st?.facts?.contradictions || [];
  const legalConclusions = st?.facts?.legal_conclusions_provisional || [];
  const participants = st?.participants || [];
  const currentStrategy = st?.strategy?.current || null;
  const readiness = st?.readiness || evaluateInformationSufficiency(st || {}, "alimentos");
  const expenses = st?.expenses || { is_exact_100_percent: false, general_claim: null, monthly_budget_breakdown: null };
  const filiation = st?.paternity_filiation || { birth_certificate_inspected: false, status: "unknown" };
  const counterparty = st?.counterparty_details || { address_status: "unknown", employment_status: "unknown", income_status: "unknown" };
  const temporalBlock = `
====================================================================
METADATOS OFICIALES Y TEMPORALES DEL SISTEMA (FUENTE DE VERDAD VIGENTE)
====================================================================
- FECHA ACTUAL DEL SISTEMA: ${systemDateTime.dateFormatted}
- HORA LOCAL: ${systemDateTime.timeFormatted} (${systemDateTime.timeZone})
- A\xD1O EN CURSO: ${systemDateTime.year}
- ESTADO DEL EXPEDIENTE: ${(caseContext?.status || "active").toUpperCase()}

REGLA TEMPORAL CR\xCDTICA:
Estamos en el a\xF1o ${systemDateTime.year}. Toda fecha de firma, emisi\xF3n o formalizaci\xF3n de documentos legales DEBE ser la fecha actual de hoy (${systemDateTime.dateFormatted}).
Queda TERMINANTEMENTE PROHIBIDO usar fechas de entrenamiento como mayo de 2024 o a\xF1os anteriores para la emisi\xF3n de escritos.
`;
  const jurisdictionBlock = `
====================================================================
JURISDICCI\xD3N PROCESAL OBLIGATORIA (FUENTE DE VERDAD)
====================================================================
- PA\xCDS: M\xE9xico
- ENTIDAD FEDERATIVA (ESTADO): ${stateName || "Pendiente de confirmaci\xF3n"}
- CIUDAD / MUNICIPIO: ${cityName || "Pendiente de confirmaci\xF3n"}
- SEDE / AUTORIDAD COMPETENTE: ${authorityName || "Juzgados Familiares / Penales / Civiles de la localidad"}

REGLA DE JURISDICCI\xD3N:
${stateName ? `La jurisdicci\xF3n de este expediente es ${stateName}${cityName ? ` (${cityName})` : ""}. TIENES ESTRICTAMENTE PROHIBIDO cambiarla a la Ciudad de M\xE9xico o basarte en ordenamientos de la CDMX. Cita y aplica las leyes y juzgados de ${stateName}.` : `Si el usuario a\xFAn no ha indicado su ciudad o estado, preg\xFAntasela amablemente antes de redactar cualquier documento. PROHIBIDO asumir por defecto la Ciudad de M\xE9xico.`}
`;
  const identityBlock = `
====================================================================
IDENTIDAD Y PARTICIPANTES DEL CASO
====================================================================
- PROMOVENTE / USUARIO: ${clientDisplayName}
- DOMICILIO PROCESAL DEL PROMOVENTE: ${clientAddress || "Pendiente de recabar amablemente en el chat"}
- PARTICIPANTES Y ROLES REGISTRADOS:
${participants.length > 0 ? participants.map((p) => `  * ${p.name} (Rol: ${p.role}${p.relationship ? `, V\xEDnculo: ${p.relationship}` : ""})`).join("\n") : "  * A\xFAn no hay terceros individualizados en el expediente."}
`;
  const structuredMemoryBlock = `
====================================================================
MEMORIA ESTRUCTURADA DEL CASO (TAXONOM\xCDA FORENSE DE 6 NIVELES)
====================================================================
1. HECHOS CONFIRMADOS EXPL\xCDCITAMENTE (NO VOLVER A PREGUNTARLOS):
${confirmedFacts.length > 0 ? confirmedFacts.map((f) => `  * ${f}`).join("\n") : "  * Ning\xFAn hecho formal confirmado a\xFAn."}

2. HECHOS DECLARADOS PENDIENTES DE VERIFICACI\xD3N DOCUMENTAL:
${allegedUnverified.length > 0 ? allegedUnverified.map((a) => `  * ${a}`).join("\n") : "  * No hay alegaciones pendientes."}

3. INFERENCIAS O HIP\xD3TESIS:
${hypothesisInferences.length > 0 ? hypothesisInferences.map((h) => `  * ${h}`).join("\n") : "  * Sin inferencias asentadas."}

4. DATOS DESCONOCIDOS / INCERTIDUMBRES MANIFIESTAS:
${unknownFacts.length > 0 ? unknownFacts.map((u) => `  * ${u}`).join("\n") : "  * Ninguna incertidumbre manifiesta registrada."}

5. CONTRADICCIONES DETECTADAS (ACLARAR CON EL USUARIO ANTES DE REDACTAR):
${contradictions.length > 0 ? contradictions.map((c) => `  * ATENCI\xD3N: ${c}`).join("\n") : "  * Ninguna contradicci\xF3n detectada."}

6. CONCLUSIONES JUR\xCDDICAS PROVISIONALES:
${legalConclusions.length > 0 ? legalConclusions.map((l) => `  * ${l}`).join("\n") : "  * Sujeto a diagn\xF3stico preliminar."}

ESTADO DE GASTOS Y ALIMENTOS:
- Cobertura de gastos declarada: ${expenses.general_claim || "No especificada"}
- \xBFEs exactamente 100%?: ${expenses.is_exact_100_percent ? "S\xCD" : "NO (Queda prohibido afirmar que cubre el 100% exacto)"}
- Desglose presupuestal: ${expenses.monthly_budget_breakdown ? "Desglosado" : "PENDIENTE DE DESGLOSE MENSUAL"}

FILIACI\xD3N Y DOCUMENTOS:
- Acta de nacimiento inspeccionada: ${filiation.birth_certificate_inspected ? "S\xCD" : "NO (Solo mencionada, NO cotejada a\xFAn)"}
- Estado de filiaci\xF3n: ${filiation.status}

DATOS DE LA CONTRAPARTE:
- Domicilio: ${counterparty.address_status === "confirmed" ? counterparty.address : "DESCONOCIDO (Requiere oficios de b\xFAsqueda)"}
- Empleo: ${counterparty.employment_status === "confirmed" ? counterparty.employment : "DESCONOCIDO"}
- Ingreso: ${counterparty.income_status === "confirmed" ? counterparty.income : "DESCONOCIDO"}
- Voluntad de negociar: ${counterparty.willingness_to_negotiate}

EVALUACI\xD3N DE SUFICIENCIA (READINESS):
- \xBFListo para redactar demanda o documento definitivo?: ${readiness.is_ready_for_legal_draft ? "S\xCD" : "NO"}
- Requisitos indispensables pendientes:
${readiness.missing_indispensable_requirements.length > 0 ? readiness.missing_indispensable_requirements.map((r) => `  * ${r}`).join("\n") : "  * Ninguno. Informaci\xF3n completa."}
- Fase actual del expediente: ${readiness.current_phase.toUpperCase()}

REGLAS DE RAZONAMIENTO FORENSE VINCULANTES:
1. SI LA SUFICIENCIA ES "NO", TIENES ESTRICTAMENTE PROHIBIDO emitir el tag [DOCUMENTO_OFICIAL: ...] con una demanda definitiva o convenio final. En su lugar, explica con empat\xEDa y claridad qu\xE9 datos indispensables faltan y por qu\xE9 la ley los exige, formulando 1 o 2 preguntas por turno.
2. NUNCA afirmes que la promovente cubre el "100% de los gastos" si ella indic\xF3 que cubre "pr\xE1cticamente todos".
3. NUNCA asumas que Alejandro u otra contraparte aparece en el acta de nacimiento si el acta no ha sido revisada f\xEDsicamente.
4. NUNCA inventes domicilios, salarios o empleos para la contraparte. Si se desconoce su domicilio, explica que el juzgado debe girar oficios de localizaci\xF3n al INE/IMSS/SAT o recurrir a edictos.
6. REGLAS ADICIONALES DE PROTECCI\xD3N DE DATOS:
- Los hechos confirmados arriba son DATOS SEGUROS. Aunque hayan sido proporcionados al inicio de la conversaci\xF3n, NO los vuelvas a preguntar.
- NO confundas tus propias sugerencias o an\xE1lisis jur\xEDdicos con hechos confirmados del usuario.
- CERO PLACEHOLDERS: Si falta el nombre completo, el domicilio exacto o la ciudad, NO generes el escrito legal con corchetes de relleno. P\xEDdele amablemente al usuario el dato que falta en tu mensaje de chat.
- REGLA ESTRICTA DE FILIACI\xD3N: Si existe duda de paternidad manifestada por la usuaria, queda ESTRICTAMENTE PROHIBIDO asumir paternidad autom\xE1tica o redactar demandas atribuyendo obligaciones de alimentos sin plantear la acci\xF3n prejudicial/judicial de investigaci\xF3n o desconocimiento de paternidad o prueba pericial gen\xE9tica en ADN.
- REGLA DE JURISDICCI\xD3N ESTRICTA: La jurisdicci\xF3n procesal es ${stateName || "Chihuahua"}. Queda TERMINANTEMENTE PROHIBIDO citar juzgados, c\xF3digos o dependencias de la Ciudad de M\xE9xico cuando el caso pertenezca a otra entidad federativa.
`;
  const userPromptAddon = `
${temporalBlock}
${jurisdictionBlock}
${identityBlock}
${structuredMemoryBlock}

DATOS DEL CLIENTE:
El usuario se llama "${clientDisplayName}". Dir\xEDgete a \xE9l o ella por su nombre con calidez, respeto y empat\xEDa.`;
  const effectiveSystemPrompt = `${JUSTINO_SYSTEM_PROMPT}${userPromptAddon}`;
  const secureMessages = [
    { role: "system", content: effectiveSystemPrompt },
    ...userMessages.filter((m) => m.role === "user" || m.role === "assistant").slice(-16)
  ];
  const hasDeepSeek = Boolean(!deepseekAuthFailed && deepseekKey.length > 10 && !deepseekKey.includes("placeholder"));
  const hasMoonshot = Boolean(!moonshotAuthFailed && moonshotKey.length > 10 && !moonshotKey.includes("placeholder"));
  const hasGemini = Boolean(geminiKey.length > 5);
  const tryGemini = async () => {
    if (!hasGemini) return null;
    try {
      console.log("[AI Provider] Solicitando inferencia ultra-r\xE1pida a Gemini...");
      const genAI = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const chatMessages = secureMessages.filter((m) => m.role !== "system");
      const contents = [];
      for (const m of chatMessages) {
        const role = m.role === "user" ? "user" : "model";
        const text = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += `

${text}`;
        } else {
          contents.push({
            role,
            parts: [{ text }]
          });
        }
      }
      if (contents.length === 0 || contents[0].role !== "user") {
        contents.unshift({ role: "user", parts: [{ text: "Hola Justino" }] });
      }
      const modelsToTry = [
        "gemini-3.1-flash-lite",
        "gemini-flash-latest"
      ];
      for (const modelName of modelsToTry) {
        try {
          const result = await genAI.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction: effectiveSystemPrompt,
              temperature: 0.25
            }
          });
          let text = result.text || "";
          if (!text && result.candidates?.[0]?.content?.parts) {
            text = result.candidates[0].content.parts.filter((p) => p.text).map((p) => p.text).join("\n");
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
        } catch (gErr) {
          console.warn(`[AI Provider] Gemini (${modelName}) intento fallido:`, gErr?.message || gErr);
        }
      }
    } catch (error) {
      console.warn("[AI Provider] Gemini general error:", error?.message || error);
    }
    return null;
  };
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
          console.warn(`[AI Provider] Clave de DeepSeek no v\xE1lida (HTTP ${response.status}). Pasando a respaldo...`);
        } else {
          console.warn(`[AI Provider] DeepSeek c\xF3digo HTTP ${response.status}: ${errText.substring(0, 100)}`);
        }
      }
    } catch (error) {
      console.warn(`[AI Provider] Timeout o error con DeepSeek (${error.message}). Continuando con respaldo...`);
    }
  }
  if (hasMoonshot) {
    try {
      console.log(`[AI Provider] [2/3] Solicitando inferencia a Kimi / Moonshot...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3e3);
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
        console.warn(`[AI Provider] Moonshot devolvi\xF3 status ${response.status}. Marcando inactivo.`);
      }
    } catch (error) {
      moonshotAuthFailed = true;
      console.warn(`[AI Provider] Timeout o fallo en Moonshot (${error.message}). Pasando a Gemini...`);
    }
  }
  if (hasGemini) {
    const geminiResult = await tryGemini();
    if (geminiResult) return geminiResult;
  }
  console.error("[AI Provider] Todos los motores de inferencia no estuvieron disponibles temporalmente.");
  return {
    choices: [{
      message: {
        content: "Comprendo perfectamente la situaci\xF3n legal que me planteas. Para darte la mejor estrategia paso a paso bajo el marco jur\xEDdico aplicable, \xBFpodr\xEDas indicarme en qu\xE9 estado de la Rep\xFAblica Mexicana te encuentras y si cuentas con alg\xFAn documento o comprobante previo relacionado con este asunto?"
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

// config.ts
var config = {
  // 1. STRIPE (Pagos)
  // IMPORTANTE: En tu Dashboard de Stripe (https://dashboard.stripe.com/payment-links)
  // 1. Edita tu link de pago.
  // 2. Ve a la pestaña "After payment" (Después del pago).
  // 3. Selecciona "Don't show confirmation page" (No mostrar página de confirmación).
  // 4. Selecciona "Redirect customers to your website" (Redirigir a tu sitio web).
  // 5. PEGA TU URL REAL DE TU SITIO AQUÍ (por ejemplo: https://tu-dominio.com/?success=true)
  //    (Nota: Si antes tenías https://justino-mx.vercel.app/?success=true, cámbialo por tu dominio actual en Stripe)
  stripePaymentLink: "https://buy.stripe.com/7sY14n64IaYV6id5Yb1Nu0d",
  // 2. SUPABASE
  supabaseUrl: "https://msigkydllxgirspdjegm.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zaWdreWRsbHhnaXJzcGRqZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTkyNzEsImV4cCI6MjA4MTQ3NTI3MX0.mq1lXAuc5hfgXb0Fg1m45X0fAolO0gic0IngIa_IAjQ"
};

// server.ts
import rateLimit from "express-rate-limit";
var app = express();
var PORT = 3e3;
app.set("trust proxy", 1);
app.use((req, res, next) => {
  if (!req.socket) {
    const forwarded = req.headers?.["x-forwarded-for"];
    const ip = (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : "") || "127.0.0.1";
    req.socket = { remoteAddress: ip };
  } else if (!req.socket.remoteAddress) {
    req.socket.remoteAddress = "127.0.0.1";
  }
  if (!req.connection) {
    req.connection = req.socket;
  }
  next();
});
var debugLog = (msg) => {
  console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${msg}`);
};
app.use(cors());
var getClientIp = (req) => {
  try {
    const forwarded = req.headers?.["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
      return forwarded.split(",")[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return String(forwarded[0]).split(",")[0].trim();
    }
    return req.headers?.["x-real-ip"] || req.socket?.remoteAddress || req.connection?.remoteAddress || "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
};
var standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 100,
  keyGenerator: (req) => getClientIp(req),
  validate: { trustProxy: false, xForwardedForHeader: false, default: false },
  message: { error: "Demasiadas peticiones. Intenta de nuevo en 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false
});
var aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 200,
  // 200 chat messages per 15 mins for smooth conversational flow
  keyGenerator: (req) => getClientIp(req),
  validate: { trustProxy: false, xForwardedForHeader: false, default: false },
  message: { error: "Has alcanzado el l\xEDmite de consultas de IA. Espera unos minutos." },
  standardHeaders: true,
  legacyHeaders: false
});
var paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  max: 10,
  // 10 payment attempts per hour
  keyGenerator: (req) => getClientIp(req),
  validate: { trustProxy: false, xForwardedForHeader: false, default: false },
  message: { error: "L\xEDmite de intentos de pago alcanzado. Intenta m\xE1s tarde." },
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api/", standardLimiter);
var authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const xUserId = req.headers["x-user-id"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token) {
      try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || config.supabaseAnonKey;
        const keyToUse = serviceRoleKey || supabaseAnonKey;
        if (supabaseUrl && keyToUse) {
          const { createClient: createClient2 } = await import("@supabase/supabase-js");
          const supabase = createClient2(supabaseUrl, keyToUse);
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (!error && user) {
            req.user = user;
            return next();
          }
        }
      } catch (err) {
        console.warn("Auth Middleware Token Validation:", err?.message || err);
      }
    }
  }
  if (xUserId) {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceRoleKey) {
        const { createClient: createClient2 } = await import("@supabase/supabase-js");
        const supabaseAdmin = createClient2(supabaseUrl, serviceRoleKey);
        let profileQuery = supabaseAdmin.from("profiles").select("id, email, username, display_name");
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(xUserId);
        if (isUuid) {
          profileQuery = profileQuery.eq("id", xUserId);
        } else {
          profileQuery = profileQuery.eq("username", xUserId);
        }
        const { data: profile } = await profileQuery.maybeSingle();
        if (profile) {
          req.user = {
            id: profile.id,
            email: profile.email,
            user_metadata: {
              username: profile.username,
              preferred_name: profile.display_name
            }
          };
          return next();
        }
      }
    } catch (fallbackErr) {
      console.warn("Auth Middleware Fallback Check Warning:", fallbackErr);
    }
  }
  return res.status(401).json({
    error: "No autorizado. Se requiere una sesi\xF3n v\xE1lida o token Bearer.",
    code: "UNAUTHORIZED"
  });
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
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || config.supabaseAnonKey;
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
          username: cleanUsername,
          has_active_access: true,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }, { onConflict: "id" });
        const { data: existingAdminCases } = await supabaseAdmin.from("legal_cases").select("id").eq("user_id", userId).limit(1);
        if (!existingAdminCases || existingAdminCases.length === 0) {
          await supabaseAdmin.from("legal_cases").insert([{
            user_id: userId,
            title: `Expediente de ${cleanPreferredName || cleanUsername}`,
            case_type: "general",
            status: "active",
            state_jurisdiction: "Nacional / Por definir",
            city_jurisdiction: "Por definir",
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }]);
        }
      } catch (dbErr) {
        console.warn("[AUTH REGISTER] Database sync warning:", dbErr);
      }
    } else if (supabaseUrl && anonKey) {
      try {
        const { createClient: createClient2 } = await import("@supabase/supabase-js");
        const clientSupabase = createClient2(supabaseUrl, anonKey);
        const { data: signUpData, error: signUpErr } = await clientSupabase.auth.signUp({
          email: authEmail,
          password: cleanPassword,
          options: {
            data: {
              username: cleanUsername,
              preferred_name: cleanPreferredName,
              payment_email: cleanEmail
            }
          }
        });
        if (signUpData?.user) {
          userId = signUpData.user.id;
        }
        try {
          await clientSupabase.from("profiles").upsert({
            id: userId,
            email: cleanEmail || authEmail,
            display_name: cleanPreferredName,
            username: cleanUsername,
            has_active_access: true,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }, { onConflict: "id" });
        } catch (_) {
        }
        try {
          const { data: existingClientCases } = await clientSupabase.from("legal_cases").select("id").eq("user_id", userId).limit(1);
          if (!existingClientCases || existingClientCases.length === 0) {
            await clientSupabase.from("legal_cases").insert([{
              user_id: userId,
              title: `Expediente de ${cleanPreferredName || cleanUsername}`,
              case_type: "general",
              status: "active",
              state_jurisdiction: "Nacional / Por definir",
              city_jurisdiction: "Por definir",
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            }]);
          }
        } catch (_) {
        }
      } catch (anonErr) {
        console.warn("[AUTH REGISTER] Anon fallback exception:", anonErr);
      }
    }
    let userSession = null;
    if (anonKey) {
      try {
        const { createClient: createClient2 } = await import("@supabase/supabase-js");
        const clientSupabase = createClient2(supabaseUrl, anonKey);
        const { data: signData } = await clientSupabase.auth.signInWithPassword({
          email: authEmail,
          password: cleanPassword
        });
        if (signData?.session) {
          userSession = signData.session;
        }
      } catch (signErr) {
        console.warn("[AUTH REGISTER] Auto sign-in warning:", signErr);
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
      session: userSession,
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
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || config.supabaseAnonKey;
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
          (u) => u.email?.toLowerCase() === authEmail.toLowerCase() || u.email?.toLowerCase() === rawIdentifier.toLowerCase() || u.user_metadata?.username?.toLowerCase() === cleanUsername || u.user_metadata?.payment_email?.toLowerCase() === rawIdentifier.toLowerCase() || u.user_metadata?.payment_email?.toLowerCase() === cleanUsername
        );
        if (found) {
          let userSession = null;
          if (anonKey && found.email) {
            const supabasePublic = createClient2(supabaseUrl, anonKey);
            const { data: signData, error: signErr } = await supabasePublic.auth.signInWithPassword({
              email: found.email,
              password: cleanPassword
            });
            if (!signErr && signData?.session) {
              userSession = signData.session;
            } else {
              try {
                await supabaseAdmin.auth.admin.updateUserById(found.id, { password: cleanPassword });
                const { data: retrySign } = await supabasePublic.auth.signInWithPassword({
                  email: found.email,
                  password: cleanPassword
                });
                if (retrySign?.session) {
                  userSession = retrySign.session;
                }
              } catch (_) {
              }
            }
          }
          const { data: profile } = await supabaseAdmin.from("profiles").select("display_name, email, has_active_access, full_name, username").eq("id", found.id).maybeSingle();
          const preferredName = profile?.display_name || profile?.full_name || found.user_metadata?.preferred_name || found.user_metadata?.username || cleanUsername;
          return {
            success: true,
            user: {
              id: found.id,
              email: found.email || authEmail,
              username: profile?.username || found.user_metadata?.username || cleanUsername,
              preferredName
            },
            session: userSession,
            authEmail: found.email
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
    const { messages, userName, caseId } = req.body;
    const authenticatedUser = req.user;
    if (!authenticatedUser?.id) {
      return res.status(401).json({ error: "Sesi\xF3n no autenticada o token inv\xE1lido." });
    }
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
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let currentCase = null;
    let supabaseAdmin = null;
    if (supabaseUrl && serviceRoleKey) {
      const { createClient: createClient2 } = await import("@supabase/supabase-js");
      supabaseAdmin = createClient2(supabaseUrl, serviceRoleKey);
      if (caseId) {
        const { data: specificCase, error: specError } = await supabaseAdmin.from("legal_cases").select("*").eq("id", caseId).single();
        if (specificCase) {
          if (specificCase.user_id !== authenticatedUser.id) {
            debugLog(`[SECURITY VIOLATION] Usuario ${authenticatedUser.id} intent\xF3 acceder al caso ${caseId} que pertenece a ${specificCase.user_id}`);
            return res.status(403).json({
              error: "Acceso denegado: no eres el propietario de este expediente.",
              code: "FORBIDDEN"
            });
          }
          currentCase = specificCase;
        } else {
          return res.status(404).json({
            error: "Expediente no encontrado.",
            code: "CASE_NOT_FOUND"
          });
        }
      } else {
        const { data: casesFound } = await supabaseAdmin.from("legal_cases").select("*").eq("user_id", authenticatedUser.id).order("updated_at", { ascending: false }).limit(1);
        if (casesFound && casesFound.length > 0) {
          currentCase = casesFound[0];
        }
      }
    }
    if (currentCase && currentCase.status === "closed") {
      debugLog(`[BLOQUEO DE CASO CERRADO] Expediente ${currentCase.id} est\xE1 CERRADO. Bloqueando llamada a LLM.`);
      return res.status(403).json({
        error: "Este expediente se encuentra formalmente CERRADO. No es posible generar nuevas consultas, estrategias o documentos sobre un asunto finalizado.",
        choices: [{
          message: {
            content: "\u{1F512} Este expediente est\xE1 formalmente cerrado. No es posible recibir nuevos mensajes ni generar documentos sobre un caso finalizado. Puedes consultar tu expediente o iniciar un nuevo tr\xE1mite legal seleccionando 'Nuevo Caso'."
          },
          finish_reason: "stop"
        }],
        caseStatus: "closed"
      });
    }
    const existingStructuredState = currentCase?.structured_state || {
      identity: { full_name: currentCase?.victim_name || userName || null, address: null, city: currentCase?.city_jurisdiction || null, state: currentCase?.state_jurisdiction || null, postal_code: null },
      jurisdiction: { country: "M\xE9xico", state: currentCase?.state_jurisdiction || null, city: currentCase?.city_jurisdiction || null, judicial_district: null, authority: null, source: null, confirmed: !!currentCase?.state_jurisdiction },
      participants: [],
      facts: { confirmed: [], alleged: [], unknown: [], contradictions: [] },
      dates: [],
      amounts: [],
      evidence: [],
      strategy: { current: null, reason: null, alternatives: [], pending_questions: [] },
      actions: [],
      decisions: [],
      document_state: { current_documents: [], pending_documents: [] }
    };
    const updatedStructuredState = extractCandidateFacts(userMessages, existingStructuredState);
    const caseContext = {
      caseId: currentCase?.id,
      status: currentCase?.status || "active",
      jurisdiction: {
        state: currentCase?.state_jurisdiction || updatedStructuredState.jurisdiction?.state,
        city: currentCase?.city_jurisdiction || updatedStructuredState.jurisdiction?.city
      },
      structuredState: updatedStructuredState,
      identity: {
        full_name: updatedStructuredState.identity?.full_name || userName,
        address: updatedStructuredState.identity?.address
      }
    };
    const data = await generateResponse(userMessages, userName, caseContext);
    debugLog(`AI response generated successfully for ${req.url}`);
    if (currentCase?.id && supabaseAdmin) {
      try {
        const updatePayload = {
          structured_state: updatedStructuredState,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        if (updatedStructuredState.jurisdiction?.state && (!currentCase.state_jurisdiction || currentCase.state_jurisdiction.includes("Por definir") || currentCase.state_jurisdiction.includes("Nacional"))) {
          updatePayload.state_jurisdiction = updatedStructuredState.jurisdiction.state;
          if (updatedStructuredState.jurisdiction.city) {
            updatePayload.city_jurisdiction = updatedStructuredState.jurisdiction.city;
          }
        }
        if (updatedStructuredState.identity?.full_name && (!currentCase.victim_name || currentCase.victim_name === "Usuario")) {
          updatePayload.victim_name = updatedStructuredState.identity.full_name;
        }
        await supabaseAdmin.from("legal_cases").update(updatePayload).eq("id", currentCase.id);
      } catch (saveErr) {
        console.warn("Aviso al guardar structured_state:", saveErr);
      }
    }
    res.json(data);
  } catch (error) {
    debugLog(`AI Proxy Error at ${req.url}: ${error.message}`);
    res.status(500).json({ error: error.message || "Internal AI Error" });
  }
};
app.post("/api/chat", authMiddleware, aiLimiter, chatHandler);
app.post("/api/v1/chat", authMiddleware, aiLimiter, chatHandler);
app.post("/api/v1/cases/new", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { title, caseType, stateJurisdiction, cityJurisdiction } = req.body;
    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase no est\xE1 configurado." });
    }
    const { createClient: createClient2 } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient2(supabaseUrl, serviceRoleKey);
    const initialStructuredState = {
      identity: { full_name: null, address: null, city: cityJurisdiction || null, state: stateJurisdiction || null, postal_code: null },
      jurisdiction: { country: "M\xE9xico", state: stateJurisdiction || null, city: cityJurisdiction || null, judicial_district: null, authority: null, confirmed: false },
      participants: [],
      facts: { confirmed: [], alleged: [], unknown: [], contradictions: [] },
      evidence: [],
      dates: [],
      amounts: [],
      strategy: { current: null, reason: null, alternatives: [], pending_questions: [] },
      actions: [],
      decisions: [],
      document_state: { current_documents: [], pending_documents: [] }
    };
    const newCasePayload = {
      user_id: userId,
      title: title || "Nuevo Expediente Legal",
      case_type: caseType || "general",
      status: "active",
      state_jurisdiction: stateJurisdiction || "Nacional / M\xE9xico",
      city_jurisdiction: cityJurisdiction || "Por definir",
      structured_state: initialStructuredState,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const { data: newCase, error: insertErr } = await supabaseAdmin.from("legal_cases").insert([newCasePayload]).select().single();
    if (insertErr) {
      const { data: fbCase, error: fbErr } = await supabaseAdmin.from("legal_cases").insert([{
        user_id: userId,
        title: title || "Nuevo Expediente Legal",
        case_type: caseType || "general",
        status: "active",
        state_jurisdiction: stateJurisdiction || "Nacional / M\xE9xico",
        city_jurisdiction: cityJurisdiction || "Por definir",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }]).select().single();
      if (fbErr) throw fbErr;
      return res.json({ success: true, case: fbCase });
    }
    console.log(`[NEW CASE] Nuevo caso creado con \xE9xito: ${newCase.id} para usuario ${userId}`);
    res.json({ success: true, case: newCase });
  } catch (err) {
    console.error("[NEW CASE ERROR]:", err);
    res.status(500).json({ error: err.message || "Error al crear nuevo expediente." });
  }
});
app.post("/api/v1/cases/close", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { caseId } = req.body;
    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase no est\xE1 configurado." });
    }
    const { createClient: createClient2 } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient2(supabaseUrl, serviceRoleKey);
    let query = supabaseAdmin.from("legal_cases").update({
      status: "closed",
      closed_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("user_id", userId);
    if (caseId) {
      query = query.eq("id", caseId);
    }
    const { error: updateError } = await query;
    if (updateError) {
      await supabaseAdmin.from("legal_cases").update({
        status: "closed",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("user_id", userId);
    }
    console.log(`[CASE CLOSURE] Caso cerrado formalmente en Supabase para user: ${userId}`);
    res.json({ success: true, status: "closed", closed_at: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (err) {
    console.error("[CASE CLOSURE ERROR]:", err);
    res.status(500).json({ error: err.message || "Error al cerrar caso en base de datos." });
  }
});
app.get("/api/v1/cases/status", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const caseId = req.query.caseId;
    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase no est\xE1 configurado." });
    }
    const { createClient: createClient2 } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient2(supabaseUrl, serviceRoleKey);
    let query = supabaseAdmin.from("legal_cases").select("*").eq("user_id", userId);
    if (caseId) {
      query = query.eq("id", caseId);
    }
    const { data: cases, error } = await query.order("updated_at", { ascending: false }).limit(1);
    if (error || !cases || cases.length === 0) {
      return res.json({ status: "active", isClosed: false });
    }
    const currentCase = cases[0];
    res.json({
      caseId: currentCase.id,
      status: currentCase.status || "active",
      isClosed: currentCase.status === "closed",
      closedAt: currentCase.closed_at || null,
      structuredState: currentCase.structured_state || null,
      jurisdiction: {
        state: currentCase.state_jurisdiction,
        city: currentCase.city_jurisdiction
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/v1/cases/preview-update", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { caseId, updates } = req.body;
    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase no est\xE1 configurado." });
    }
    const { createClient: createClient2 } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient2(supabaseUrl, serviceRoleKey);
    let query = supabaseAdmin.from("legal_cases").select("*").eq("user_id", userId);
    if (caseId) query = query.eq("id", caseId);
    const { data: cases, error } = await query.order("updated_at", { ascending: false }).limit(1);
    if (error || !cases || cases.length === 0) {
      return res.status(404).json({ error: "Expediente no encontrado para este usuario.", can_update: false });
    }
    const currentCase = cases[0];
    const currentState = currentCase.structured_state || {};
    const maintained = {};
    const corrected = [];
    if (updates && typeof updates === "object") {
      for (const [key, val] of Object.entries(updates)) {
        const prevVal = currentState[key];
        if (JSON.stringify(prevVal) !== JSON.stringify(val)) {
          corrected.push({
            field: key,
            previous_value: prevVal !== void 0 ? prevVal : null,
            proposed_value: val
          });
        }
      }
    }
    for (const [key, val] of Object.entries(currentState)) {
      if (!updates || !(key in updates)) {
        maintained[key] = val;
      }
    }
    const simulatedState = {
      ...currentState,
      ...updates || {}
    };
    const sufficiency = evaluateInformationSufficiency(simulatedState, currentCase.case_type || "alimentos");
    res.json({
      success: true,
      caseId: currentCase.id,
      can_update: true,
      preview: {
        maintained,
        corrected,
        pending: sufficiency.missing_indispensable_requirements,
        sufficiency
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error al generar vista previa." });
  }
});
app.post("/api/v1/cases/confirm-update", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { caseId, updates, userConfirmed } = req.body;
    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }
    if (!userConfirmed) {
      return res.status(400).json({
        error: "Se requiere autorizaci\xF3n expresa del usuario antes de aplicar cambios al expediente.",
        code: "USER_CONSENT_REQUIRED"
      });
    }
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase no est\xE1 configurado." });
    }
    const { createClient: createClient2 } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient2(supabaseUrl, serviceRoleKey);
    let query = supabaseAdmin.from("legal_cases").select("*").eq("user_id", userId);
    if (caseId) query = query.eq("id", caseId);
    const { data: cases, error } = await query.order("updated_at", { ascending: false }).limit(1);
    if (error || !cases || cases.length === 0) {
      return res.status(404).json({ error: "Expediente no encontrado para este usuario." });
    }
    const currentCase = cases[0];
    const currentState = currentCase.structured_state || {};
    const correctionsHistory = Array.isArray(currentState.corrections_history) ? [...currentState.corrections_history] : [];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (updates && typeof updates === "object") {
      for (const [key, val] of Object.entries(updates)) {
        const prevVal = currentState[key];
        if (JSON.stringify(prevVal) !== JSON.stringify(val)) {
          correctionsHistory.push({
            field: key,
            previous_value: prevVal !== void 0 ? prevVal : null,
            new_value: val,
            timestamp: now,
            reason: "Actualizaci\xF3n formal con consentimiento del usuario"
          });
        }
      }
    }
    const updatedState = {
      ...currentState,
      ...updates || {},
      corrections_history: correctionsHistory
    };
    updatedState.readiness = evaluateInformationSufficiency(updatedState, currentCase.case_type || "alimentos");
    const updatePayload = {
      structured_state: updatedState,
      updated_at: now
    };
    if (updatedState.identity?.full_name && (!currentCase.victim_name || currentCase.victim_name === "Usuario")) {
      updatePayload.victim_name = updatedState.identity.full_name;
    }
    if (updatedState.jurisdiction?.state && (!currentCase.state_jurisdiction || currentCase.state_jurisdiction.includes("Por definir"))) {
      updatePayload.state_jurisdiction = updatedState.jurisdiction.state;
      if (updatedState.jurisdiction.city) {
        updatePayload.city_jurisdiction = updatedState.jurisdiction.city;
      }
    }
    const { data: savedCase, error: updateErr } = await supabaseAdmin.from("legal_cases").update(updatePayload).eq("id", currentCase.id).select().single();
    if (updateErr) throw updateErr;
    res.json({
      success: true,
      caseId: currentCase.id,
      verified: true,
      structured_state: savedCase.structured_state,
      corrections_history: correctionsHistory
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error al actualizar expediente." });
  }
});
app.get("/api/v1/cases/readiness", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const caseId = req.query.caseId;
    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase no est\xE1 configurado." });
    }
    const { createClient: createClient2 } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient2(supabaseUrl, serviceRoleKey);
    let query = supabaseAdmin.from("legal_cases").select("*").eq("user_id", userId);
    if (caseId) query = query.eq("id", caseId);
    const { data: cases, error } = await query.order("updated_at", { ascending: false }).limit(1);
    if (error || !cases || cases.length === 0) {
      return res.status(404).json({ error: "Expediente no encontrado." });
    }
    const currentCase = cases[0];
    const structuredState = currentCase.structured_state || {};
    const readiness = evaluateInformationSufficiency(structuredState, currentCase.case_type || "alimentos");
    res.json({
      caseId: currentCase.id,
      readiness
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/v1/stripe/create-checkout", async (req, res) => {
  try {
    const { email, origin: clientOrigin } = req.body;
    if (!email) return res.status(400).json({ error: "El correo electr\xF3nico es requerido." });
    const cleanEmail = String(email).trim().toLowerCase();
    const STRIPE_PAYMENT_LINK = process.env.STRIPE_PAYMENT_LINK || config.stripePaymentLink || "https://buy.stripe.com/7sY14n64IaYV6id5Yb1Nu0d";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const proto = req.headers["x-forwarded-proto"] || "https";
    const origin = clientOrigin || req.headers.origin || `${proto}://${host}`;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey && !stripeKey.includes("placeholder") && !stripeKey.includes("sk_test_...")) {
      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(stripeKey.trim());
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          customer_email: cleanEmail,
          allow_promotion_codes: true,
          line_items: [
            {
              price_data: {
                currency: "mxn",
                product_data: {
                  name: "Expediente Legal Justino",
                  description: "Asesor\xEDa legal personalizada basada en leyes vigentes"
                },
                unit_amount: 48e3
                // $480.00 MXN
              },
              quantity: 1
            }
          ],
          mode: "payment",
          success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}&success=true`,
          cancel_url: `${origin}/`,
          metadata: {
            email: cleanEmail
          }
        });
        return res.json({ url: session.url, session_id: session.id, success: true });
      } catch (stripeErr) {
        console.warn("[STRIPE CHECKOUT] Session create fallback to payment link:", stripeErr);
      }
    }
    const paymentUrl = `${STRIPE_PAYMENT_LINK}?prefilled_email=${encodeURIComponent(cleanEmail)}`;
    res.json({ url: paymentUrl, success: true });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    res.status(500).json({ error: error.message || "Error al conectar con Stripe." });
  }
});
app.get("/api/v1/stripe/session-info", async (req, res) => {
  try {
    const sessionId = req.query.session_id;
    if (!sessionId) return res.status(400).json({ error: "Missing session_id" });
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey.includes("placeholder") || stripeKey.includes("sk_test_...")) {
      return res.json({ success: false, message: "No stripe key configured" });
    }
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey.trim());
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const email = session.customer_details?.email || session.customer_email || session.metadata?.email || null;
    const name = session.customer_details?.name || null;
    res.json({
      success: true,
      email,
      name,
      payment_status: session.payment_status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
var isServerless = !!process.env.VERCEL || !!process.env.NOW_REGION || !!process.env.AWS_LAMBDA_FUNCTION_NAME || Boolean(process.env.SERVERLESS);
if (!isServerless) {
  if (process.env.NODE_ENV !== "production") {
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
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://0.0.0.0:${PORT}`);
    });
  }
} else {
  debugLog("Initialized Express app in SERVERLESS mode");
}
var server_default = app;
export {
  server_default as default
};
