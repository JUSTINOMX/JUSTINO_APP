import {
  CaseStructuredState,
  RequirementItem,
  CaseContradiction,
  LegalPathway,
  DocumentCandidateMatrix
} from '../types';

/**
 * MOTOR DE EVALUACIÓN DE SUFICIENCIA Y RECOMENDACIÓN RAZONADA (SECCIONES 8, 9 Y 10)
 * Evalúa si existe conocimiento suficiente y genera la explicación de 10 puntos antes de redactar.
 */

export interface ComprehensiveSufficiencyResult {
  is_ready_for_strategy_recommendation: boolean;
  is_ready_for_legal_draft: boolean;
  sufficiency_score: number;
  missing_critical_requirements: string[];
  missing_secondary_requirements: string[];
  open_critical_contradictions: string[];
  recommended_pathway?: LegalPathway;
  reasoned_recommendation_text?: string;
  candidate_document_matrix?: DocumentCandidateMatrix;
}

export const evaluateComprehensiveSufficiency = (
  state: CaseStructuredState
): ComprehensiveSufficiencyResult => {
  const reqs = state.requirements_map || [];
  const contradictions = state.contradictions_detected || [];
  const pathways = state.legal_pathways || [];

  const missingCritical: string[] = [];
  const missingSecondary: string[] = [];
  const openContradictions: string[] = [];

  // 1. Revisar contradicciones abiertas
  contradictions.forEach(c => {
    if (c.status === 'DETECTADA' && (c.severity === 'CRITICA' || c.severity === 'ALTA')) {
      openContradictions.push(`[${c.severity}] ${c.description}`);
    }
  });

  // 2. Revisar requisitos del mapa dinámico
  let verifiedCount = 0;
  let totalImportantCount = 0;

  reqs.forEach(r => {
    const isResolved = r.status === 'VERIFICADO_DOCUMENTALMENTE' || 
                       r.status === 'VERIFICADO_CON_FUENTE_EXTERNA' || 
                       r.status === 'DECLARADO_POR_USUARIO' ||
                       r.status === 'NO_APLICA_JUSTIFICADO' ||
                       r.status === 'RESUELTO_CON_LIMITACIONES';

    if (r.importance === 'CRITICA') {
      totalImportantCount += 2;
      if (isResolved) {
        verifiedCount += 2;
      } else {
        missingCritical.push(r.description);
      }
    } else if (r.importance === 'ALTA') {
      totalImportantCount += 1;
      if (isResolved) {
        verifiedCount += 1;
      } else {
        missingSecondary.push(r.description);
      }
    }
  });

  const baseScore = totalImportantCount > 0 ? Math.round((verifiedCount / totalImportantCount) * 100) : 50;
  const penalization = openContradictions.length * 25;
  const sufficiencyScore = Math.max(0, baseScore - penalization);

  // Suficiencia para recomendar estrategia: Requiere al menos 60 puntos y ninguna contradicción crítica abierta
  const isReadyForStrategy = sufficiencyScore >= 60 && openContradictions.length === 0;

  // Suficiencia para redactar documento definitivo listo para firma: Requiere al menos 85 puntos, cero requisitos críticos pendientes
  const isReadyForDraft = isReadyForStrategy && missingCritical.length === 0 && sufficiencyScore >= 85;

  // Seleccionar vía preferente
  const recommendedPathway = pathways.find(p => p.status === 'preferente') || pathways[0];

  // Matriz de documento candidato
  let candidateDocMatrix: DocumentCandidateMatrix | undefined;
  if (recommendedPathway) {
    candidateDocMatrix = {
      doc_type: recommendedPathway.type === 'judicial' ? 'Demanda Inicial Formal' : 'Solicitud / Requerimiento Extrajudicial',
      objective: recommendedPathway.description,
      recipient_authority: recommendedPathway.competent_authority,
      standing_and_capacity: state.identity.full_name ? `Promovente: ${state.identity.full_name}` : 'Pendiente de acreditación',
      essential_facts_required: state.facts?.confirmed || [],
      identities_relationships_to_prove: (state.participants || []).map(p => `${p.name} (${p.role})`),
      dates_and_amounts: (state.dates || []).map(d => `${d.label || 'Fecha'}: ${d.value || d.date}`),
      legal_grounds: ['Código Civil aplicable', 'Código Nacional de Procedimientos Civiles y Familiares'],
      petitions: ['Fijación de medidas de protección o pensión provisional', 'Emplazamiento a juicio'],
      available_evidence: (state.evidence || []).filter(e => e.status === 'VERIFICADO_DOCUMENTALMENTE' || e.status === 'inspected').map(e => e.name || e.title || 'Documento'),
      required_annexes: recommendedPathway.required_documents,
      formal_requirements: ['Firma autógrafa', 'Copias de traslado para emplazamiento'],
      missing_data: [...missingCritical, ...missingSecondary],
      risks_if_incomplete: [
        'Desechamiento inicial o prevención judicial por obscuridad de demanda',
        'Imposibilidad de notificar válidamente a la contraparte'
      ],
      is_ready_for_drafting: isReadyForDraft
    };
  }

  // Generar explicación de 10 puntos si está listo para recomendar estrategia
  let reasonedRecommendationText = "";
  if (isReadyForStrategy && recommendedPathway) {
    reasonedRecommendationText = `
1. COMPRENSIÓN DEL PROBLEMA: Situación de ${state.matter_classification?.primary_matter || 'materia legal'} orientada a ${state.matter_classification?.user_objective || 'hacer valer derechos'}.
2. HECHOS CONOCIDOS: ${state.facts?.confirmed?.length ? state.facts.confirmed.join('; ') : 'Declaraciones iniciales asentadas'}.
3. HECHOS PENDIENTES DE VERIFICACIÓN: ${missingSecondary.length ? missingSecondary.join('; ') : 'Ninguno indispensable'}.
4. CONTRADICCIONES REVISADAS: ${openContradictions.length ? openContradictions.join('; ') : 'Sin discrepancias abiertas'}.
5. VÍAS VIABLES COMPARADAS: ${pathways.map(p => p.name).join(' vs ')}.
6. BALANCE DE VENTAJAS Y RIESGOS: La vía "${recommendedPathway.name}" ofrece ${recommendedPathway.pros.join(', ')}, considerando como limitación: ${recommendedPathway.cons.join(', ')}.
7. INFORMACIÓN QUE PODRÍA MODIFICAR LA ESTRATEGIA: Hallazgos documentales en actas o localización del deudor.
8. RECOMENDACIÓN CONCRETA: Proceder por "${recommendedPathway.name}" ante ${recommendedPathway.competent_authority}.
9. PRIMER PASO INMEDIATO: ${recommendedPathway.required_documents[0] || 'Integrar expediente preparatorio'}.
10. REQUISITOS FALTANTES PARA EJECUTARLO: ${missingCritical.length ? missingCritical.join(', ') : 'Expediente listo para autorización de redacción formal'}.
    `.trim();
  }

  return {
    is_ready_for_strategy_recommendation: isReadyForStrategy,
    is_ready_for_legal_draft: isReadyForDraft,
    sufficiency_score: sufficiencyScore,
    missing_critical_requirements: missingCritical,
    missing_secondary_requirements: missingSecondary,
    open_critical_contradictions: openContradictions,
    recommended_pathway: recommendedPathway,
    reasoned_recommendation_text: reasonedRecommendationText,
    candidate_document_matrix: candidateDocMatrix
  };
};
