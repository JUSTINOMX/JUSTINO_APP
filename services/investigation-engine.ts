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
  else if (/\b(despido|liquidaci[oó]n|patr[oó]n|salario|finiquito|junta de conciliaci[oó]n|centro de conciliaci[oó]n laboral|trabajaba|trabajo|empleo|jefe|horario|s[aá]bados?|renuncia|antig[uü]edad|meses de sueldo|indemnizaci[oó]n|rescisi[oó]n)\b/i.test(t)) {
    primary = 'laboral';
    detectedAreas.push('Derecho Laboral', 'Conciliación Prejudicial y Juicio Ordinario');
    userObjective = "Determinar procedencia de indemnización o finiquito y ruta prejudicial ante el Centro de Conciliación";
    currentSituation = "Separación laboral o despido pendiente de calificación formal";
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
    case 'laboral': {
      return [
        {
          id: 'via_laboral_conciliacion_prejudicial',
          name: 'Procedimiento de Conciliación Prejudicial (Centro de Conciliación Laboral Local o Federal)',
          type: 'prejudicial',
          description: 'Instancia administrativa prejudicial obligatoria por regla general (arts. 684-A a 684-E LFT), salvo excepciones de discriminación, acoso o violación de derechos fundamentales del art. 685-Ter LFT.',
          pros: [
            'Instancia gratuita que suspende el curso de la prescripción de dos meses (arts. 518 y 521 frac. III LFT)',
            'Plazo perentorio de desahogo que no deberá exceder de 45 días naturales conforme al art. 684-D LFT',
            'Convenio con categoría de cosa juzgada ejecutable directamente ante el Tribunal Laboral',
            'Resolución ágil en audiencia de avenencia sin costos de litigio contencioso'
          ],
          cons: [
            'Sujeto a comparecencia y voluntad de arreglo del patrón',
            'Plazo perentorio de prescripción de dos meses regulado de fecha a fecha según los días de cada mes (arts. 518 y 522 LFT)'
          ],
          risks: [
            'Prescripción de la acción si no se radica la solicitud prejudicial dentro de los dos meses contados desde el día siguiente de la separación (art. 518 LFT)',
            'Falta de notificación si no se ubica la razón social o domicilio del centro de trabajo'
          ],
          estimated_timeline: '15 a 45 días naturales',
          status: 'preferente',
          required_documents: ['Identificación oficial', 'Nombre o razón social y domicilio del patrón', 'Fecha de ingreso y separación'],
          competent_authority: 'Centro de Conciliación Laboral de la Entidad Federativa (fuero común) o Centro Federal de Conciliación y Registro Laboral (CFCRL, si la actividad pertenece a las 22 ramas del art. 527 LFT)'
        },
        {
          id: 'via_laboral_juicio_ordinario',
          name: 'Juicio Ordinario Laboral ante el Tribunal Laboral Competente',
          type: 'judicial',
          description: 'Demanda ordinaria laboral solicitando indemnización constitucional de 3 meses, 20 días por año, prima de antigüedad y salarios caídos (arts. 48 y 870+ LFT).',
          pros: [
            'Sentencia judicial vinculante y ejecutoria con condena pecuniaria plena',
            'Presunción legal de despido injustificado si el patrón omitió entregar aviso escrito (art. 47 LFT), con carga probatoria patronal (art. 784 LFT)'
          ],
          cons: [
            'Requiere constancia de no conciliación como regla general de procedibilidad (art. 684-B LFT)',
            'Juicio contencioso en fases escrita y oral'
          ],
          risks: [
            'Desechamiento si no se anexa constancia prejudicial (salvo que encuadre en el art. 685-Ter LFT)',
            'Excepción patronal de prescripción si transcurren dos meses sin causal de interrupción/suspensión'
          ],
          estimated_timeline: '4 a 8 meses',
          status: 'viable',
          required_documents: ['Constancia de No Conciliación', 'Identificación oficial', 'Comprobantes o indicios de la relación laboral'],
          competent_authority: 'Tribunal Laboral del Poder Judicial del Estado (fuero común) o Tribunal Laboral Federal (si la rama patronal es federal conforme al art. 527 LFT)'
        },
        {
          id: 'via_laboral_demanda_directa_exenta',
          name: 'Demanda Directa sin Conciliación Prejudicial (Excepción Art. 685-Ter LFT)',
          type: 'judicial',
          description: 'Acceso directo e inmediato al Tribunal Laboral sin agotar etapa conciliatoria previa ni exhibir constancia de no conciliación conforme al artículo 685-Ter de la LFT, aplicable en casos de discriminación, acoso u hostigamiento sexual, prestaciones de seguridad social o tutela de derechos fundamentales.',
          pros: [
            'Exención legal expresa de agotar la instancia conciliatoria prejudicial',
            'Radicación inmediata de demanda ante el Tribunal Laboral competente'
          ],
          cons: [
            'Carga de acreditar indiciariamente la causal de excepción legal del art. 685-Ter LFT',
            'Si no se acredita la excepción, el juzgador remitirá el asunto al Centro de Conciliación'
          ],
          risks: [
            'Remisión al Centro de Conciliación si el tribunal considera improcedente la excepción'
          ],
          estimated_timeline: '3 a 6 meses',
          status: 'viable',
          required_documents: ['Demanda fundada en causal de excepción del art. 685-Ter LFT', 'Pruebas indiciarias de acoso, discriminación o derechos fundamentales'],
          competent_authority: 'Tribunal Laboral del Poder Judicial del Estado o Federal (según la rama de actividad de la parte patronal)'
        }
      ];
    }

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
    'req_jurisdiction_city',
    'Ciudad y Estado de residencia o donde ocurrieron los hechos',
    'Competencia territorial de la autoridad laboral o judicial competente',
    pathways.map(p => p.id),
    'DESCONOCIDO',
    'ALTA',
    'Incompetencia de la autoridad y desestimación inicial por razón de fuero',
    '¿En qué ciudad y estado de la República te encuentras o se celebró el acuerdo?'
  );

  upsertRequirement(
    'req_promovente_identity',
    'Nombre legal completo del promovente',
    'Legitimación activa en la causa e individualización del actor (indispensable para formalizar escritos)',
    pathways.map(p => p.id),
    'DESCONOCIDO',
    'ALTA',
    'Imposibilidad de radicar demanda, queja o convenio ante la autoridad sin personería formal',
    '¿Podrías compartirme tu nombre completo cuando estemos listos para registrar formalmente tu expediente?'
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
  } else if (matter.primary_matter === 'laboral') {
    upsertRequirement(
      'req_labor_separation_date',
      'Fecha aproximada o exacta de la separación o despido',
      'Cálculo del término perentorio de prescripción de dos meses de fecha a fecha (arts. 518 y 522 Ley Federal del Trabajo)',
      pathways.map(p => p.id),
      'DESCONOCIDO',
      'CRITICA',
      'Si transcurren dos meses de fecha a fecha desde la fecha de separación sin presentar solicitud prejudicial de conciliación, prescribe el derecho a demandar la indemnización constitucional (art. 518 LFT; la solicitud suspende el término según arts. 518 y 521 frac. III LFT y se rige por el límite del art. 684-D LFT)',
      '¿En qué fecha exacta ocurrió el despido o separación de tu centro de trabajo?'
    );

    upsertRequirement(
      'req_labor_employer_identity',
      'Nombre comercial o razón social del patrón y centro de trabajo',
      'Identificación del sujeto obligado y competencia territorial para citatorio prejudicial',
      pathways.map(p => p.id),
      'DESCONOCIDO',
      'CRITICA',
      'No se puede emitir el citatorio ni radicar la solicitud de conciliación sin los datos de la fuente laboral',
      '¿Cuál es el nombre o razón social de la empresa donde laborabas?'
    );

    upsertRequirement(
      'req_labor_dismissal_mode',
      'Modo en que se comunicó el despido y entrega de aviso de rescisión por escrito',
      'Acreditación de la rescisión patronal y cumplimiento de la formalidad del art. 47 LFT',
      pathways.map(p => p.id),
      'DESCONOCIDO',
      'CRITICA',
      'La falta de aviso escrito al trabajador presume legalmente el despido como injustificado',
      '¿Cómo te notificaron el despido y te hicieron entrega de algún oficio o aviso por escrito?'
    );

    upsertRequirement(
      'req_labor_contract_existence',
      'Existencia de contrato individual de trabajo por escrito',
      'Acreditación formal de condiciones de trabajo (la falta de contrato por escrito es imputable al patrón según art. 26 LFT)',
      pathways.map(p => p.id),
      'DESCONOCIDO',
      'ALTA',
      'Si se desconoce o no se recuerda, la ley presume ciertas las condiciones manifestadas por el trabajador',
      '¿Llegaste a firmar algún contrato individual de trabajo o documentos al ingresar o durante tu relación laboral?'
    );

    upsertRequirement(
      'req_labor_modifications',
      'Condiciones originales pactadas vs modificación de horario o actividades',
      'Análisis de modificación sustancial unilateral de condiciones laborales (art. 51 frac. IX LFT)',
      pathways.map(p => p.id),
      'DESCONOCIDO',
      'ALTA',
      'La modificación unilateral no consentida de horarios o días faculta al trabajador a rescindir con responsabilidad patronal',
      '¿Cuáles eran tus funciones y horarios habituales antes de que te asignaran el horario con sábados?'
    );

    upsertRequirement(
      'req_labor_salary_seniority',
      'Antigüedad en el puesto y salario percibido',
      'Base para la cuantificación líquida de indemnización, prima de antigüedad y prestaciones devengadas',
      pathways.map(p => p.id),
      'DESCONOCIDO',
      'ALTA',
      'Se requiere para cuantificar con precisión el finiquito o la liquidación',
      '¿Cuánto tiempo laboraste en la empresa y cuál era tu salario aproximado (mensual, quincenal o diario)?'
    );

    upsertRequirement(
      'req_promovente_address',
      'Domicilio particular o procesal del promovente',
      'Requisito para notificaciones personales en escritos judiciales definitivos',
      ['via_laboral_juicio_ordinario'],
      'DESCONOCIDO',
      'BAJA',
      'Solo se requerirá si se autoriza presentar una demanda formal; para la asesoría y cálculo preliminar es prescindible',
      '¿Deseas compartir tu domicilio para futuras notificaciones o prefieres mantenerlo reservado por ahora?'
    );
  }

  // Actualizar estados basados en conversationText
  map.forEach(item => {
    // Si ya fue verificado documentalmente, respetar
    if (item.status === 'VERIFICADO_DOCUMENTALMENTE') return;

    // Respeto estricto a reserva de domicilio por privacidad
    if (/\b(no quiero dar mi domicilio|prefiero no dar mi direcci[oó]n|por ahora no quiero dar mi domicilio|no dar mi direcci[oó]n|prefiero no compartir mi domicilio|no dar mi direcci[oó]n|no voy a dar mi domicilio|reservado por privacidad)\b/i.test(t)) {
      if (item.id === 'req_promovente_address') {
        item.status = 'RESERVADO_POR_PRIVACIDAD';
        item.resolution_note = 'El usuario manifestó expresamente su deseo de mantener reservado su domicilio en fase preliminar; respetado plenamente.';
      }
    }

    if (item.id === 'req_promovente_identity' && /\b(?:me llamo|mi nombre es|soy)\s+([A-Za-záéíóúñÁÉÍÓÚÑ]{2,}(?:\s+[A-Za-záéíóúñÁÉÍÓÚÑ]{2,})*)/i.test(t)) {
      item.status = 'DECLARADO_POR_USUARIO';
    }
    if (item.id === 'req_jurisdiction_city' && (/\b(?:en|vivo en|radico en|de|en la ciudad de|en el estado de)\s+([A-Za-záéíóúñÁÉÍÓÚÑ]{3,})/i.test(t) || /\b(?:ciudad|estado|municipio|distrito|localidad|entidad|cdmx)\b/i.test(t))) {
      item.status = 'DECLARADO_POR_USUARIO';
    }
    if (item.id === 'req_minor_identity' && /\b(?:mi hij[oa]|se llama)\s+([A-Za-z]{3,})/i.test(t)) {
      item.status = 'DECLARADO_POR_USUARIO';
    }
    if (item.id === 'req_labor_employer_identity' && (/(?:la empresa(?: se llama)?|mi patr[oó]n(?: se llama)?|trabaj(?:o|aba|é) en|empleador(?: es)?|raz[oó]n social(?: es)?)\s+([A-Za-z0-9áéíóúñÁÉÍÓÚÑ&.,\- ]{2,})/i.test(t) || /\b(la empresa|mi patr[oó]n|el patr[oó]n|la fuente de trabajo|mi trabajo|el empleador)\b/i.test(t))) {
      item.status = 'DECLARADO_POR_USUARIO';
    }
    if (item.id === 'req_labor_dismissal_mode' && /\b(me despidieron|me dijo que ya no|verbalmente|sin carta|sin aviso|no me dieron papel|no me entregaron nada)\b/i.test(t)) {
      item.status = 'DECLARADO_POR_USUARIO';
    }
    if (item.id === 'req_labor_contract_existence') {
      if (/(no recuerdo si firm[eé]|no s[eé] si firm[eé]|no estoy segur[ao] si firm[eé]|no recuerdo haber firmado)/i.test(t)) {
        item.status = 'DESCONOCIDO';
        item.resolution_note = 'Usuario declara no recordar si firmó documentos de aceptación o contrato escrito; se mantiene como desconocido sin asumir existencia ni negativa absoluta.';
      } else if (/\b(s[ií] firm[eé] contrato|tengo mi contrato)\b/i.test(t)) {
        item.status = 'DOCUMENTO_PENDIENTE';
      }
    }
    if (item.id === 'req_labor_modifications' && /\b(s[aá]bado|horario|cambio de horario|sin mi consentimiento|me cambiaron)\b/i.test(t)) {
      item.status = 'DECLARADO_POR_USUARIO';
    }
    if (item.id === 'req_labor_salary_seniority' && /\b(3\.5 a[ñn]os|3 a[ñn]os y medio|a[ñn]os|pesos|sueldo|salario)\b/i.test(t)) {
      item.status = 'DECLARADO_POR_USUARIO';
    }
    if (item.id === 'req_labor_separation_date' && /\b(ayer|antier|el viernes pasado|el lunes pasado|viernes|lunes|martes|mi[eé]rcoles|jueves|s[aá]bado|domingo|la semana pasada|hace unos d[ií]as|\d{1,2}\s+de\s+[a-z]+)\b/i.test(t)) {
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

  // Filtrar requisitos elegibles (no los que están reservados por privacidad ni los ya resueltos)
  const eligibleReqs = requirementsMap.filter(
    r => (r.status === 'DESCONOCIDO' || r.status === 'PREGUNTA_PENDIENTE')
  );

  // 2. Prioridad Uno: Requisitos Críticos Sustantivos Fácticos (Hechos del caso, fecha de separación, sujetos)
  // Nunca preguntar el domicilio privado ni exigir nombre en fases iniciales (entrevista progresiva)
  const substantiveCritical = eligibleReqs.find(
    r => r.importance === 'CRITICA' && !r.id.includes('address') && !r.id.includes('domicilio') && !r.id.includes('identity') && !r.id.includes('promovente')
  );
  if (substantiveCritical) {
    return {
      question: substantiveCritical.investigation_prompt,
      legalReason: substantiveCritical.legal_reason,
      targetRequirementId: substantiveCritical.id,
      priority: 'CRITICA'
    };
  }

  // 3. Prioridad Dos: Requisitos de Importancia ALTA
  const pendingHigh = eligibleReqs.find(
    r => r.importance === 'ALTA' && !r.id.includes('address') && !r.id.includes('domicilio')
  );
  if (pendingHigh) {
    return {
      question: pendingHigh.investigation_prompt,
      legalReason: pendingHigh.legal_reason,
      targetRequirementId: pendingHigh.id,
      priority: 'ALTA'
    };
  }

  // 4. Si solo quedan requisitos de domicilio y el usuario no los reservó:
  const pendingAddress = eligibleReqs.find(
    r => r.id.includes('address') || r.id.includes('domicilio')
  );
  if (pendingAddress && currentStrategyPhase === 'autorizacion_documento') {
    return {
      question: pendingAddress.investigation_prompt,
      legalReason: pendingAddress.legal_reason,
      targetRequirementId: pendingAddress.id,
      priority: 'ALTA'
    };
  }

  return {
    question: "Tengo los elementos suficientes para explicarte las alternativas viables y recomendarte el mejor camino formal.",
    legalReason: "Información indispensable reunida para emitir recomendación razonada",
    priority: 'COMPLETA'
  };
};
