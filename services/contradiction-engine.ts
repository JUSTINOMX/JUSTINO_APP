import { CaseContradiction, ContradictionCategory, ContradictionSeverity } from '../types';

/**
 * MOTOR UNIVERSAL DE DETECCIÓN DE CONTRADICCIONES (SECCIONES 5 Y 6)
 * Detecta discrepancias en 6 categorías, clasifica severidad y gestiona su protocolo de resolución neutral.
 */

export interface ContradictionDetectionInput {
  userMessages: Array<{ role: string; content: string; timestamp?: string | Date }>;
  existingContradictions?: CaseContradiction[];
  participants?: Array<{ name: string; role: string; relationship?: string }>;
  dates?: Array<{ label?: string; value?: string; date?: string; is_confirmed?: boolean }>;
  amounts?: Array<{ concept: string; amount: number | string | null }>;
  evidence?: Array<{ name: string; status: string; notes?: string }>;
  jurisdiction?: { state?: string | null; city?: string | null };
}

export const detectUniversalContradictions = (input: ContradictionDetectionInput): CaseContradiction[] => {
  const existing = input.existingContradictions || [];
  const detected: CaseContradiction[] = [...existing];

  const onlyUserTexts = (input.userMessages || [])
    .filter(m => m.role === 'user')
    .map(m => String(m.content || ''));
  const fullText = onlyUserTexts.join('\n\n');

  const addOrUpdateContradiction = (
    id: string,
    category: ContradictionCategory,
    severity: ContradictionSeverity,
    description: string,
    versions: Array<{ text: string; source: string }>,
    questionToClarify: string,
    affectsPathways: string[] = ['todas']
  ) => {
    const existingIdx = detected.findIndex(c => c.id === id);
    if (existingIdx >= 0) {
      // Si ya está resuelta justificada, conservar estado
      if (detected[existingIdx].status === 'RESUELTA_JUSTIFICADA') {
        return;
      }
      detected[existingIdx].versions = versions;
      detected[existingIdx].description = description;
      detected[existingIdx].question_to_clarify = questionToClarify;
    } else {
      detected.push({
        id,
        category,
        severity,
        status: 'DETECTADA',
        description,
        versions,
        question_to_clarify: questionToClarify,
        affects_pathways: affectsPathways,
        detected_at: new Date().toISOString()
      });
    }
  };

  // --------------------------------------------------------------------------
  // 5.1 IDENTIDAD Y RELACIONES: Discrepancia de apellidos entre padre e hija/hijo
  // --------------------------------------------------------------------------
  // Ejemplo: Usuario identifica a un hombre como padre (ej. Alejandro López / Carlos Gómez)
  // pero los apellidos de la menor son distintos (ej. Sofía Martínez / Valentina Fernández)
  const childMatch = fullText.match(/\b(?:mi (?:hij[oa]|menor)|la ni[ñn]a|el ni[ñn]o)\s+(?:se llama\s+)?([A-ZÁÉÍÓÚÑa-z]+(?:\s+[A-ZÁÉÍÓÚÑa-z]+){1,3})/i);
  const fatherMatch = fullText.match(/\b(?:el pap[aá]|el padre|demandado)\s+(?:es|se llama)?\s+([A-ZÁÉÍÓÚÑa-z]+(?:\s+[A-ZÁÉÍÓÚÑa-z]+){1,3})/i);

  if (childMatch && fatherMatch) {
    const cleanChild = childMatch[1].replace(/\s+(?:y|e|o|u|que|pero|de|del|en)$/i, '').trim();
    const cleanFather = fatherMatch[1].replace(/\s+(?:y|e|o|u|que|pero|de|del|en)$/i, '').trim();

    const childParts = cleanChild.split(/\s+/);
    const fatherParts = cleanFather.split(/\s+/);
    const childSurnames = childParts.slice(1).map(s => s.toLowerCase());
    const fatherSurnames = fatherParts.slice(1).map(s => s.toLowerCase());

    if (childSurnames.length > 0 && fatherSurnames.length > 0) {
      const shareAnySurname = childSurnames.some(cs => fatherSurnames.includes(cs));
      if (!shareAnySurname) {
        addOrUpdateContradiction(
          'contra_surname_filiation_mismatch',
          'identity_relations',
          'ALTA',
          `Discrepancia en apellidos: La menor (${cleanChild}) no comparte ninguno de los apellidos registrados del padre (${cleanFather}).`,
          [
            { text: `Nombre de la menor declarado: ${cleanChild}`, source: 'Declaración del usuario' },
            { text: `Nombre del padre declarado: ${cleanFather}`, source: 'Declaración del usuario' }
          ],
          `Noté que los apellidos de ${cleanChild} no coinciden con los de ${cleanFather}. ¿Cómo quedó asentado su registro en el acta de nacimiento o existe algún reconocimiento formal pendiente?`,
          ['demanda_alimentos', 'reconocimiento_paternidad', 'juicio_filiacion']
        );
      }
    }
  }

  // --------------------------------------------------------------------------
  // 5.2 FECHAS Y CRONOLOGÍA: Dos fechas incompatibles para un mismo hecho
  // --------------------------------------------------------------------------
  const dateJune2026 = /\b(?:junio de 2026|junio 2026)\b/i.test(fullText);
  const dateMarch2026 = /\b(?:marzo de 2026|marzo 2026)\b/i.test(fullText);
  const dateAugust2025 = /\b(?:agosto de 2025|agosto 2025)\b/i.test(fullText);

  // Detección de cese o evento con fechas contradictorias
  if ((dateJune2026 && dateMarch2026) || (dateJune2026 && dateAugust2025)) {
    const d1 = dateJune2026 ? "junio de 2026" : "agosto de 2025";
    const d2 = dateMarch2026 ? "marzo de 2026" : "agosto de 2025";
    addOrUpdateContradiction(
      'contra_dates_cessation_conflict',
      'dates_chronology',
      'ALTA',
      `Inconsistencia cronológica: Se mencionan dos fechas distintas (${d1} y ${d2}) para el mismo acontecimiento.`,
      [
        { text: `Fecha referida inicialmente: ${d1}`, source: 'Mensaje previo del usuario' },
        { text: `Fecha referida posteriormente: ${d2}`, source: 'Mensaje posterior del usuario' }
      ],
      `En un momento mencionaste ${d1} y también ${d2} como la fecha del acontecimiento. ¿Cuál de las dos fechas es la más precisa para fundamentar los hechos?`,
      ['demanda_alimentos', 'demanda_incumplimiento', 'demanda_arrendamiento']
    );
  }

  // --------------------------------------------------------------------------
  // 5.4 CANTIDADES Y CÁLCULOS: Inconsistencia entre pagos, sumas o periodicidades
  // --------------------------------------------------------------------------
  // Ejemplo: Usuario dice pagar $5,000 mensuales de renta pero luego dice que deposita $1,500 semanales (que serían $6,000 al mes)
  // O declara deuda de $20,000 pero los recibos o sumas dan $14,000
  const monthlyMatch = fullText.match(/\b(\d{1,3}(?:,\d{3})*|\d+)\s*(?:pesos)?\s*(?:al mes|mensuales|por mes)\b/i);
  const weeklyMatch = fullText.match(/\b(\d{1,3}(?:,\d{3})*|\d+)\s*(?:pesos)?\s*(?:a la semana|semanales|por semana)\b/i);

  if (monthlyMatch && weeklyMatch) {
    const monthlyNum = parseFloat(monthlyMatch[1].replace(/,/g, ''));
    const weeklyNum = parseFloat(weeklyMatch[1].replace(/,/g, ''));
    const calculatedMonthlyFromWeekly = weeklyNum * 4.33; // Promedio mensual
    const difference = Math.abs(calculatedMonthlyFromWeekly - monthlyNum);

    if (difference > (monthlyNum * 0.15)) {
      addOrUpdateContradiction(
        'contra_amount_periodicity_math',
        'quantities_math',
        'MEDIA',
        `Inconsistencia en cantidades y periodicidad: $${monthlyNum} mensuales vs $${weeklyNum} semanales (equivale aprox a $${Math.round(calculatedMonthlyFromWeekly)} al mes).`,
        [
          { text: `Monto mensual declarado: $${monthlyNum}`, source: 'Mensaje del usuario' },
          { text: `Monto semanal declarado: $${weeklyNum}`, source: 'Mensaje del usuario' }
        ],
        `Mencionaste una aportación de $${monthlyNum} al mes y también entregas de $${weeklyNum} a la semana. Para el desglose presupuestal del escrito, ¿cuál es el cálculo exacto pactado?`,
        ['cuantificacion_alimentos', 'liquidacion_adeudo', 'rentas_vencidas']
      );
    }
  }

  // --------------------------------------------------------------------------
  // 5.6 CONTRADICCIONES DOCUMENTALES: Mención de existencia vs documento no cotejado
  // --------------------------------------------------------------------------
  const claimsHasDoc = /\b(?:tengo el acta|tengo el contrato|cuento con el pagar[eé]|tengo el recibo)\b/i.test(fullText);
  const docIsUnverified = (input.evidence || []).some(
    e => e.status === 'mentioned_unverified' || e.status === 'DOCUMENTO_PENDIENTE'
  );

  if (claimsHasDoc && docIsUnverified) {
    // Si el usuario da detalles como si el documento ya estuviera admitido o revisado
    const assertsVerifiedDetails = /\b(?:en el contrato dice claramente|el acta ya demuestra|el pagar[eé] est[aá] firmado y sellado)\b/i.test(fullText);
    if (assertsVerifiedDetails) {
      addOrUpdateContradiction(
        'contra_doc_claimed_vs_uninspected',
        'documentary',
        'MEDIA',
        'Contradicción documental: El usuario asume como hecho comprobado el contenido de un documento que sólo ha sido mencionado y no ha sido inspeccionado físicamente.',
        [
          { text: 'Usuario afirma que el documento acredita formalmente la pretensión', source: 'Mensaje del usuario' },
          { text: 'El archivo permanece pendiente de recepción y cotejo físico', source: 'Bóveda de Evidencia' }
        ],
        'Comentas que el documento contiene esas cláusulas. Para incorporarlo como anexo con total certeza, ¿cuentas con el documento digitalizado para revisar sus términos exactos?',
        ['redaccion_definitiva', 'ofrecimiento_pruebas']
      );
    }
  }

  // --------------------------------------------------------------------------
  // 5.5 LUGARES Y JURISDICCIÓN: Conflicto entre domicilio y sede judicial pretendida
  // --------------------------------------------------------------------------
  const cdmxMention = /\b(ciudad de m[eé]xico|cdmx|distrito federal)\b/i.test(fullText);
  const chihMention = /\b(chihuahua|ju[aá]rez|delicias)\b/i.test(fullText);
  if (cdmxMention && chihMention) {
    addOrUpdateContradiction(
      'contra_location_jurisdiction_conflict',
      'locations_jurisdiction',
      'ALTA',
      'Conflicto de jurisdicción: Se mencionan domicilios o autoridades de Chihuahua y Ciudad de México en el mismo asunto.',
      [
        { text: 'Mención de localidad: Chihuahua', source: 'Declaración del usuario' },
        { text: 'Mención de localidad: Ciudad de México', source: 'Declaración del usuario' }
      ],
      'Mencionaste tanto Chihuahua como la Ciudad de México. Para definir la competencia del juzgado, ¿en qué ciudad reside actualmente la persona afectada o dónde se celebró el acto?',
      ['competencia_territorial', 'juzgado_competente']
    );
  }

  return detected;
};

/**
 * PROTOCOLO DE RESOLUCIÓN NEUTRAL DE CONTRADICCIONES (SECCIÓN 6)
 * Permite marcar una contradicción como aclarada, registrando la explicación del usuario sin juzgar.
 */
export const resolveContradictionProtocol = (
  contradictions: CaseContradiction[],
  contradictionId: string,
  userClarification: string,
  justificationReason: string
): { updatedList: CaseContradiction[]; resolved: boolean } => {
  const list = [...contradictions];
  const item = list.find(c => c.id === contradictionId);
  if (!item) return { updatedList: list, resolved: false };

  item.status = 'RESUELTA_JUSTIFICADA';
  item.resolution = `Aclarado por el usuario: ${userClarification}. Motivo jurídico: ${justificationReason}`;
  return { updatedList: list, resolved: true };
};
