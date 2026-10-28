import {
  CaseMatterClassification,
  LegalPathway,
  RequirementItem,
  RequirementStatus,
  CaseContradiction
} from '../types';

/**
 * MOTOR DE INVESTIGACIÓN JURÍDICA PROGRESIVA (SECCIONES 3 Y 4)
 * Descubrimiento dinámico de caso, identificación de vías alternativas,
 * mapa de requisitos de 11 estados y entrevista orgánica de 1 pregunta por turno.
 */

// --- FASE A: COMPRENSIÓN INICIAL ---
export const classifyMatter = (
  text: string,
  existingClassification?: CaseMatterClassification
): CaseMatterClassification => {
  const t = text.toLowerCase();

  let primary: CaseMatterClassification['primary_matter'] = 'civil_general';
  const detectedAreas: string[] = [];
  let userObjective = "Resolver situación legal";
  let currentSituation = "En diagnóstico inicial";

  // Familiar
  if (/\b(alimentos|pensi[oó]n|hijo|menor|patria potestad|guarda y custodia|divorcio|paternidad|acta de nacimiento|expareja|alejandro)\b/i.test(t)) {
    primary = 'familiar';
    detectedAreas.push('Derecho Familiar', 'Alimentos y Custodia');
    userObjective = "Fijar pensión alimenticia y proteger derechos del menor";
    currentSituation = "Cese de aportaciones del progenitor obligado";
  }
  // Arrendamiento / Inquilinato
  else if (/\b(renta|arrendamiento|inquilino|arrendador|desalojo|desahucio|contrato de renta|no me paga la renta|entregar el inmueble)\b/i.test(t)) {
    primary = 'arrendamiento';
    detectedAreas.push('Derecho Inmobiliario', 'Arrendamiento Inmobiliario');
    userObjective = "Recuperar inmueble y/o cobrar rentas vencidas";
    currentSituation = "Incumplimiento de contrato de arrendamiento o falta de pago";
  }
  // Penal
  else if (/\b(denuncia|querella|ministerio p[uú]blico|delito|amenazas|fraude|abuso de confianza|golpes|agresi[oó]n|violencia)\b/i.test(t)) {
    primary = 'penal';
    detectedAreas.push('Derecho Penal', 'Investigación Ministerial');
    userObjective = "Iniciar investigación penal y solicitar medidas de protección";
    currentSituation = "Hechos posiblemente constitutivos de delito";
  }
  // Mercantil / Deudas
  else if (/\b(pagar[eé]|cheque|factura|deuda mercantil|pr[eé]stamo|intereses|cobro judicial|t[ií]tulo de cr[eé]dito)\b/i.test(t)) {
    primary = 'mercantil';
    detectedAreas.push('Derecho Mercantil', 'Cobranza Judicial');
    userObjective = "Cobro de título de crédito o adeudo comercial";
    currentSituation = "Título vencido sin liquidación voluntaria";
  }
  // Laboral
  else if (/\b(despido|liquidaci[oó]n|patr[oó]n|salario|finiquito|junta de conciliaci[oó]n|centro de conciliaci[oó]n laboral)\b/i.test(t)) {
    primary = 'laboral';
    detectedAreas.push('Derecho Laboral', 'Conciliación y Juicio');
    userObjective = "Reclamar indemnización constitucional o finiquito laboral";
    currentSituation = "Terminación laboral o despido injustificado";
  }

  return {
    primary_matter: primary,
    detected_areas: detectedAreas,
    confidence: primary === 'civil_general' ? 0.6 : 0.88,
    user_objective: userObjective,
    current_situation: currentSituation,
    is_provisional: true
  };
};

// --- FASE B: IDENTIFICACIÓN DINÁMICA DE POSIBLES VÍAS ALTERNATIVAS ---
export const discoverLegalPathways = (
  matter: CaseMatterClassification,
  contextText: string
): LegalPathway[] => {
  const t = contextText.toLowerCase();
  const unknownAddress = /\b(no s[eé] d[oó]nde vive|desconozco su domicilio|no conozco su direcci[oó]n|no s[eé] su direcci[oó]n)\b/i.test(t);

  switch (matter.primary_matter) {
    case 'familiar': {
      return [
        {
          id: 'via_familiar_judicial',
          name: 'Juicio Oral Familiar de Alimentos con Pensión Provisional',
          type: 'judicial',
          description: 'Demanda formal ante Juzgado de lo Familiar solicitando fijación de pensión provisional inmediata y embargo de sueldo o bienes.',
          pros: [
            'Fijación judicial de pensión provisional desde el auto admisorio',
            'Descuento vía nómina con informe patronal directo',
            'Aseguramiento de necesidades alimentarias del menor de orden público'
          ],
          cons: [
            'Procedimiento contencioso que requiere emplazamiento formal',
            'Demora procesal si se desconoce el domicilio de la contraparte'
          ],
          risks: [
            'Imposibilidad de emplazar si no se solicitan oficios de localización oportunos',
            'Riesgo de insolvencia sobrevenida del demandado'
          ],
          estimated_timeline: 'Pensión provisional en 1-2 semanas; sentencia definitiva en 3-6 meses',
          status: unknownAddress ? 'viable' : 'preferente',
          required_documents: ['Acta de nacimiento del menor', 'Identificación oficial', 'Presupuesto mensual desglosado'],
          competent_authority: 'Juzgados Familiares del Distrito Judicial correspondiente'
        },
        {
          id: 'via_familiar_mediacion',
          name: 'Convenio de Alimentos ante Centro de Justicia Alternativa (CEJA)',
          type: 'extrajudicial',
          description: 'Procedimiento de mediación voluntaria ante facilitador público para pactar pensión, custodia y visitas con fuerza de cosa juzgada.',
          pros: [
            'Resolución rápida sin hostilidad procesal (1 a 3 sesiones)',
            'Elevación a cosa juzgada mediante sanción o ratificación judicial',
            'Cero costo y preservación de relaciones familiares'
          ],
          cons: [
            'Requiere voluntad expresa de ambas partes para acudir y firmar',
            'No es viable si el deudor se niega a comparecer o no es localizable'
          ],
          risks: [
            'Pérdida de tiempo procesal si la contraparte rehúye la cita mediadora'
          ],
          estimated_timeline: '1 a 2 semanas si existe disposición voluntaria',
          status: 'viable',
          required_documents: ['Actas de nacimiento', 'Identificaciones oficiales'],
          competent_authority: 'Centro Estatal de Justicia Alternativa o Mediación Pública'
        },
        {
          id: 'via_familiar_prejudicial_busqueda',
          name: 'Diligencias Prejudiciales de Localización de Domicilio y Capacidad Económica',
          type: 'prejudicial',
          description: 'Petición judicial previa para que el juzgado gire oficios al INE, SAT, IMSS y Registro Público a fin de ubicar al deudor.',
          pros: [
            'Evita nulidad de emplazamiento y gastos infructuosos',
            'Acredita oficialmente fuentes de ingresos formales ante el IMSS/SAT'
          ],
          cons: [
            'Fase previa que antecede al emplazamiento de fondo'
          ],
          risks: [
            'Respuesta de dependencias puede demorar de 30 a 60 días'
          ],
          estimated_timeline: '3 a 6 semanas para recepción de informes',
          status: unknownAddress ? 'preferente' : 'viable',
          required_documents: ['Acta de nacimiento del menor', 'Escrito de solicitud de oficios'],
          competent_authority: 'Juzgado Familiar en funciones prejudiciales'
        }
      ];
    }

    case 'arrendamiento': {
      return [
        {
          id: 'via_arrendamiento_extrajudicial',
          name: 'Requerimiento Extrajudicial Formal con Plazo Perentorio',
          type: 'extrajudicial',
          description: 'Notificación notarial o por correo certificado requiriendo el pago de rentas o entrega pacífica del bien en 10 días naturales.',
          pros: ['Menor costo', 'Constituye en mora fehaciente al inquilino', 'Facilita la conciliación'],
          cons: ['No tiene fuerza ejecutiva directa de desalojo inmediato'],
          risks: ['Que el inquilino gane tiempo para desocupar sin liquidar adeudos'],
          estimated_timeline: '1 a 2 semanas',
          status: 'viable',
          required_documents: ['Contrato de arrendamiento', 'Recibos pendientes'],
          competent_authority: 'Notario Público o Notificación Directa con Testigos'
        },
        {
          id: 'via_arrendamiento_desahucio',
          name: 'Juicio Especial de Arrendamiento Inmobiliario (Desahucio y Pago de Rentas)',
          type: 'judicial',
          description: 'Demanda judicial de desahucio con requerimiento de pago o entrega, embargo de bienes para garantizar rentas y lanzamiento con fuerza pública.',
          pros: ['Orden judicial vinculante de lanzamiento y embargo de bienes para cobro'],
          cons: ['Costo procesal y trámite judicial formal'],
          risks: ['Defensas procesales dilatorias del inquilino'],
          estimated_timeline: '2 a 5 meses',
          status: 'preferente',
          required_documents: ['Contrato original', 'Acreditación de propiedad o posesión', 'Liquidación de rentas'],
          competent_authority: 'Juzgado Civil o de Paz competente'
        }
      ];
    }

    case 'penal': {
      return [
        {
          id: 'via_penal_denuncia',
          name: 'Denuncia / Querella Formal con Solicitud de Medidas de Protección',
          type: 'judicial',
          description: 'Presentación formal de querella ante el Ministerio Público con solicitud inmediata de órdenes de restricción conforme al CNPP.',
          pros: ['Intervención de la autoridad persecutora y medidas de protección policial inmediatas'],
          cons: ['Sujeto a la carga procesal de la fiscalía investigadora'],
          risks: ['Desestimación si no se aportan indicios mínimos del hecho delictivo'],
          estimated_timeline: 'Medidas de protección en 24-48 horas; integración de carpeta 1 a 3 meses',
          status: 'preferente',
          required_documents: ['Identificación oficial', 'Documentos comprobatorios o constancias médicas'],
          competent_authority: 'Agencia del Ministerio Público / Fiscalía del Estado'
        },
        {
          id: 'via_penal_masc',
          name: 'Solución de Controversias en Materia Penal (MASC)',
          type: 'extrajudicial',
          description: 'Acuerdo reparatorio en sede ministerial para delitos no graves o patrimoniales sin violencia.',
          pros: ['Reparación del daño rápida y voluntaria sin juicio penal prolongado'],
          cons: ['Inaplicable para delitos con violencia familiar grave o violencia física'],
          risks: ['Incumplimiento posterior del acuerdo por el denunciado'],
          estimated_timeline: '2 a 4 semanas',
          status: 'viable',
          required_documents: ['Comprobante de daños económicos'],
          competent_authority: 'Unidad de Mediación de la Fiscalía'
        }
      ];
    }

    default: {
      return [
        {
          id: 'via_civil_conciliacion',
          name: 'Conciliación Prejudicial Extrajudicial',
          type: 'extrajudicial',
          description: 'Invitación a mesa de mediación o negociación para celebrar convenio transaccional.',
          pros: ['Solución concertada y rápida'],
          cons: ['Requiere voluntad del demandado'],
          risks: ['Demora si no comparece'],
          estimated_timeline: '1 a 3 semanas',
          status: 'viable',
          required_documents: ['Documentación base de la reclamación'],
          competent_authority: 'Centro de Mediación Local'
        },
        {
          id: 'via_civil_ordinaria',
          name: 'Juicio Civil Ordinario de Cumplimiento o Rescisión',
          type: 'judicial',
          description: 'Demanda ante juzgado civil formal para exigir el cumplimiento forzoso o rescisión con pago de daños y perjuicios.',
          pros: ['Sentencia judicial ejecutoria'],
          cons: ['Procedimiento judicial más largo'],
          risks: ['Gastos y dilación probatoria'],
          estimated_timeline: '4 a 8 meses',
          status: 'preferente',
          required_documents: ['Contrato o acto jurídico base de la acción'],
          competent_authority: 'Juzgados Civiles de Primera Instancia'
        }
      ];
    }
  }
};

// --- FASE C: CONSTRUCCIÓN DEL MAPA DINÁMICO DE REQUISITOS (11 ESTADOS) ---
export const buildRequirementsMap = (
  matter: CaseMatterClassification,
  pathways: LegalPathway[],
  existingMap: RequirementItem[] = [],
  conversationText: string = ''
): RequirementItem[] => {
  const map: RequirementItem[] = existingMap.map(r => ({ ...r }));
  const t = conversationText.toLowerCase();

  const upsertRequirement = (
    id: string,
    description: string,
    legalReason: string,
    pathwayIds: string[],
    defaultStatus: RequirementStatus,
    importance: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA',
    consequence: string,
    prompt: string,
    dependencies: string[] = []
  ) => {
    const existing = map.find(r => r.id === id);
    if (!existing) {
      map.push({
        id,
        description,
        legal_reason: legalReason,
        pathway_ids: pathwayIds,
        status: defaultStatus,
        source: 'Detección dinámica de vías',
        importance,
        consequence_if_unresolved: consequence,
        investigation_prompt: prompt,
        dependencies,
        updated_at: new Date().toISOString()
      });
    }
  };

  // Requisitos Universales para Cualquier Materia
  upsertRequirement(
    'req_promovente_identity',
    'Nombre legal completo del promovente',
    'Legitimación activa en la causa e individualización del actor',
    pathways.map(p => p.id),
    'DESCONOCIDO',
    'CRITICA',
    'Imposibilidad de formular demanda, denuncia o convenio sin personería',
    '¿Cuál es tu nombre completo tal como aparece en tu identificación oficial?'
  );

  upsertRequirement(
    'req_jurisdiction_city',
    'Ciudad y Estado de residencia o donde ocurrieron los hechos',
    'Competencia territorial del juzgado o ministerio público competente',
    pathways.map(p => p.id),
    'DESCONOCIDO',
    'CRITICA',
    'Incompetencia de la autoridad y desestimación inicial por razón de fuero',
    '¿En qué ciudad y estado de la República te encuentras o se celebró el acuerdo?'
  );

  // Requisitos Específicos por Materia
  if (matter.primary_matter === 'familiar') {
    upsertRequirement(
      'req_minor_identity',
      'Nombre y edad del menor beneficiario de los alimentos',
      'Individualización del acreedor alimentario e interés superior de la niñez',
      ['via_familiar_judicial', 'via_familiar_mediacion'],
      'DESCONOCIDO',
      'CRITICA',
      'No se puede ejercer representación jurídica sin individualizar al menor',
      '¿Cuál es el nombre completo y la edad de tu hijo o hija?'
    );

    upsertRequirement(
      'req_birth_cert_status',
      'Inspección formal del acta de nacimiento (cotejo de filiación paterna)',
      'Acreditación formal del vínculo paterno-filial (art. 308+ Código Civil)',
      ['via_familiar_judicial', 'via_familiar_mediacion'],
      t.includes('acta') ? 'DOCUMENTO_RECIBIDO_NO_REVISADO' : 'DOCUMENTO_PENDIENTE',
      'CRITICA',
      'Si el padre no aparece asentado, se requiere juicio previo de reconocimiento de paternidad',
      '¿Cuentas con el acta de nacimiento de tu hijo donde aparezca formalmente el demandado como padre?',
      ['req_minor_identity']
    );

    upsertRequirement(
      'req_counterparty_address',
      'Domicilio certero de la contraparte para notificación o solicitud de oficios',
      'Garantía de audiencia procesal y emplazamiento a juicio (art. 14 Constitucional)',
      ['via_familiar_judicial'],
      t.includes('no sé dónde vive') ? 'NO_VERIFICABLE' : 'DESCONOCIDO',
      'ALTA',
      'Si se desconoce, debe solicitarse que el juzgado gire oficios de localización al INE/SAT/IMSS',
      '¿Conoces el domicilio particular o laboral de la contraparte donde pueda ser notificado?'
    );

    upsertRequirement(
      'req_expenses_budget',
      'Presupuesto mensual desglosado de necesidades del menor',
      'Principio de proporcionalidad alimentaria (necesidad vs capacidad)',
      ['via_familiar_judicial', 'via_familiar_mediacion'],
      'DECLARADO_POR_USUARIO',
      'ALTA',
      'El juez no puede cuantificar una pensión justa sin acreditación de los rubros básicos',
      '¿Podrías compartirme un estimado de los gastos mensuales indispensables del menor (comida, salud, educación, vivienda)?'
    );
  } else if (matter.primary_matter === 'arrendamiento') {
    upsertRequirement(
      'req_lease_contract',
      'Contrato de arrendamiento firmado por las partes',
      'Documento base de la acción arrendaticia',
      pathways.map(p => p.id),
      'DOCUMENTO_PENDIENTE',
      'CRITICA',
      'De no existir contrato escrito, se deben promover medios preparatorios a juicio o testimonial',
      '¿Cuentas con el contrato de arrendamiento firmado por escrito o el acuerdo fue verbal?'
    );

    upsertRequirement(
      'req_unpaid_rents_amount',
      'Liquidación exacta de rentas vencidas y fechas de mora',
      'Determinación líquida de la prestación pecuniaria reclamada',
      pathways.map(p => p.id),
      'DESCONOCIDO',
      'ALTA',
      'Inconsistencia en el monto exigido genera excepciones de pago u obscuridad de la demanda',
      '¿Cuántos meses exactos adeuda y a cuánto asciende la mensualidad pactada?'
    );
  } else if (matter.primary_matter === 'penal') {
    upsertRequirement(
      'req_crime_facts_chronology',
      'Narración circunstanciada de hechos (modo, tiempo y lugar)',
      'Tipo penal y tipicidad ministerial para formular imputación',
      pathways.map(p => p.id),
      'DESCONOCIDO',
      'CRITICA',
      'Imprecisión de fecha o lugar impide la clasificación del delito',
      '¿En qué fecha exacta y en qué lugar ocurrieron los hechos que deseas denunciar?'
    );
  }

  // Actualizar estados basados en conversationText
  map.forEach(item => {
    // Si ya fue verificado documentalmente, respetar
    if (item.status === 'VERIFICADO_DOCUMENTALMENTE') return;

    if (item.id === 'req_promovente_identity' && /\b(?:me llamo|mi nombre es|soy)\s+([A-Za-záéíóúñ]{3,}\s+[A-Za-záéíóúñ]{3,})/i.test(t)) {
      item.status = 'DECLARADO_POR_USUARIO';
    }
    if (item.id === 'req_jurisdiction_city' && /\b(chihuahua|ju[aá]rez|delicias|monterrey|cdmx|guadalajara)\b/i.test(t)) {
      item.status = 'DECLARADO_POR_USUARIO';
    }
    if (item.id === 'req_minor_identity' && /\b(?:mi hij[oa]|se llama)\s+([A-Za-z]{3,})/i.test(t)) {
      item.status = 'DECLARADO_POR_USUARIO';
    }
  });

  return map;
};

// --- FASE D: SELECCIÓN DE LA SIGUIENTE PREGUNTA ÓPTIMA (1 PREGUNTA POR TURNO) ---
export const getNextOptimalInquiry = (
  requirementsMap: RequirementItem[],
  contradictions: CaseContradiction[],
  currentStrategyPhase: string
): {
  question: string;
  legalReason: string;
  targetRequirementId?: string;
  priority: 'CONTRADICCION' | 'CRITICA' | 'ALTA' | 'COMPLETA';
} => {
  // 1. Prioridad Cero: Contradicciones Críticas o Altas Abiertas
  const openContradiction = contradictions.find(
    c => c.status === 'DETECTADA' && (c.severity === 'CRITICA' || c.severity === 'ALTA')
  );
  if (openContradiction) {
    return {
      question: openContradiction.question_to_clarify,
      legalReason: `Aclaración de inconsistencia: ${openContradiction.description}`,
      priority: 'CONTRADICCION'
    };
  }

  // 2. Prioridad Uno: Requisitos Críticos en estado DESCONOCIDO o PREGUNTA_PENDIENTE
  const pendingCritical = requirementsMap.find(
    r => r.importance === 'CRITICA' && (r.status === 'DESCONOCIDO' || r.status === 'PREGUNTA_PENDIENTE')
  );
  if (pendingCritical) {
    return {
      question: pendingCritical.investigation_prompt,
      legalReason: pendingCritical.legal_reason,
      targetRequirementId: pendingCritical.id,
      priority: 'CRITICA'
    };
  }

  // 3. Prioridad Dos: Requisitos de Importancia ALTA
  const pendingHigh = requirementsMap.find(
    r => r.importance === 'ALTA' && (r.status === 'DESCONOCIDO' || r.status === 'PREGUNTA_PENDIENTE')
  );
  if (pendingHigh) {
    return {
      question: pendingHigh.investigation_prompt,
      legalReason: pendingHigh.legal_reason,
      targetRequirementId: pendingHigh.id,
      priority: 'ALTA'
    };
  }

  return {
    question: "Tengo los elementos suficientes para explicarte las alternativas viables y recomendarte el mejor camino formal.",
    legalReason: "Información indispensable reunida para emitir recomendación razonada",
    priority: 'COMPLETA'
  };
};
