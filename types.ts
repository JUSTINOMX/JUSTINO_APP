
export interface User {
  id: string; // Supabase UUID
  email: string;
  name?: string;
  preferredName?: string;
  username?: string;
}

export interface Attachment {
  name: string;
  type: string; // MIME type
  content: string; // Base64 or extracted text
  isTextExtracted?: boolean; // True for Word/Excel/Txt, False for PDF/Images
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isThinking?: boolean;
  attachment?: Attachment;
  sources?: GroundingSource[];
}

export type AppView = 'landing' | 'onboarding' | 'dashboard' | 'admin-login' | 'admin-dashboard';
export type DashboardTab = 'chat' | 'vault' | 'timeline' | 'history' | 'legal';
export type CaseStatus = 'analyzing' | 'in_process' | 'ready' | 'closed';

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  status: 'completed' | 'current' | 'pending';
}

export interface VaultFile {
  id: string;
  name: string;
  type: string;
  date: string;
  content?: string;
  url?: string;
  origin: 'generated' | 'uploaded';
  version?: number;
  isLatest?: boolean;
  status?: 'current' | 'superseded' | 'archived';
  supersedesDocumentId?: string;
}

export interface CaseStructuredState {
  identity: {
    full_name: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    colonia?: string | null;
  };
  jurisdiction: {
    country: string;
    state: string | null;
    city: string | null;
    judicial_district: string | null;
    authority: string | null;
    source: string | null;
    confirmed: boolean;
  };
  participants: Array<{
    name: string;
    role: string;
    relationship?: string;
    address?: string | null;
    employment?: string | null;
    income?: string | null;
    status?: string;
    known_information?: string;
  }>;
  facts: {
    confirmed: string[];
    alleged_unverified: string[];
    hypothesis_inference: string[];
    unknown: string[];
    contradictions: string[];
    legal_conclusions_provisional: string[];
    // Backwards-compatibility alias
    alleged?: string[];
  };
  evidence: Array<{
    id?: string;
    title?: string;
    name?: string;
    type?: string;
    status: 'mentioned_unverified' | 'inspected' | 'unavailable' | string;
    notes?: string;
  }>;
  expenses: {
    general_claim?: string | null;
    is_exact_100_percent: boolean;
    monthly_budget_breakdown: Record<string, number> | null;
    breakdown_status: 'pending_breakdown' | 'itemized' | 'estimated';
    notes?: string;
  };
  paternity_filiation: {
    status: 'confirmed_formal' | 'alleged_unverified' | 'unknown' | 'disputed';
    birth_certificate_inspected: boolean;
    father_appears_on_certificate: boolean | null;
    dna_test_needed: boolean;
    notes?: string;
  };
  counterparty_details: {
    name: string | null;
    address: string | null;
    address_status: 'confirmed' | 'unknown' | 'approximate';
    employment: string | null;
    employment_status: 'confirmed' | 'unknown';
    income: string | null;
    income_status: 'confirmed' | 'unknown';
    willingness_to_negotiate: 'willing' | 'refusing' | 'unknown';
  };
  readiness: {
    is_ready_for_legal_draft: boolean;
    missing_indispensable_requirements: string[];
    information_sufficiency_score: number;
    current_phase: 'interview_preliminary' | 'readiness_check' | 'authorized_draft' | 'closed';
  };
  corrections_history: Array<{
    field: string;
    previous_value: any;
    new_value: any;
    timestamp: string;
    reason?: string;
  }>;
  dates: Array<{
    description?: string;
    label?: string;
    date?: string;
    value?: string;
    status?: string;
    is_confirmed?: boolean;
  }>;
  amounts: Array<{
    concept: string;
    amount: number | string | null;
    currency?: string;
    status?: string;
  }>;
  strategy: {
    current: string | null;
    reason: string | null;
    alternatives: string[];
    pending_questions: string[];
  };
  actions: string[];
  decisions: string[];
  document_state: {
    current_documents: string[];
    pending_documents: string[];
  };
  // MOTOR DE INVESTIGACIÓN JURÍDICA PROGRESIVA Y CONOCIMIENTO ACUMULATIVO
  matter_classification?: CaseMatterClassification;
  legal_pathways?: LegalPathway[];
  requirements_map?: RequirementItem[];
  contradictions_detected?: CaseContradiction[];
  legal_research_log?: LegalResearchRecord[];
  active_inquiry?: {
    next_question?: string;
    legal_reason?: string;
    priority?: string;
    target_requirement_id?: string;
  };
  // MÓDULO: MEMORIA VIVA Y EXPEDIENTE MAESTRO PERSISTENTE
  facts_registry?: MasterFactItem[];
  master_markdown?: MasterMarkdownState;
  master_markdown_version?: number;
}

// ESTADOS DE VERIFICACIÓN DE HECHOS (MÓDULO MEMORIA VIVA - SECCIÓN 4)
export type FactVerificationStatus =
  | 'DECLARADO_POR_USUARIO'
  | 'DECLARADO_POR_TERCERO'
  | 'EXTRAIDO_DE_DOCUMENTO'
  | 'VERIFICADO_DOCUMENTALMENTE'
  | 'VERIFICADO_CON_FUENTE_EXTERNA'
  | 'INFERIDO_PROVISIONAL'
  | 'DESCONOCIDO'
  | 'CONTRADICTORIO'
  | 'CORREGIDO_CON_HISTORIAL';

export interface MasterFactItem {
  id: string; // e.g. fact_001
  statement: string;
  category: 'identity' | 'relationship' | 'chronology' | 'expenses_amounts' | 'domicile' | 'paternity' | 'procedure' | 'general';
  source: {
    type: 'user_declaration' | 'third_party' | 'document' | 'external_source' | 'model_inference';
    reference: string;
    timestamp: string;
  };
  verification_status: FactVerificationStatus;
  notes?: string;
  superseded_by?: string;
  correction_history?: Array<{
    previous_statement: string;
    timestamp: string;
    reason: string;
    source: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface MasterMemoryUpdateLogEntry {
  version: number;
  timestamp: string;
  change_type:
    | 'initial_creation'
    | 'fact_added'
    | 'fact_corrected'
    | 'contradiction_detected'
    | 'contradiction_resolved'
    | 'document_updated'
    | 'strategy_shifted'
    | 'no_op_conserved';
  summary: string;
  affected_fields: string[];
}

export interface MasterMarkdownState {
  case_id: string;
  user_id: string;
  version: number;
  markdown_content: string;
  content_hash: string;
  last_updated_at: string;
  update_log: MasterMemoryUpdateLogEntry[];
}

// 11 ESTADOS PERMITIDOS DEL MAPA DINÁMICO DE REQUISITOS (FASE C)
export type RequirementStatus =
  | 'DESCONOCIDO'
  | 'PREGUNTA_PENDIENTE'
  | 'DECLARADO_POR_USUARIO'
  | 'DOCUMENTO_PENDIENTE'
  | 'DOCUMENTO_RECIBIDO_NO_REVISADO'
  | 'VERIFICADO_DOCUMENTALMENTE'
  | 'VERIFICADO_CON_FUENTE_EXTERNA'
  | 'CONTRADICTORIO'
  | 'NO_APLICA_JUSTIFICADO'
  | 'NO_VERIFICABLE'
  | 'RESUELTO_CON_LIMITACIONES';

export type RequirementImportance = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';

export interface RequirementItem {
  id: string;
  description: string;
  legal_reason: string;
  pathway_ids: string[];
  status: RequirementStatus;
  source: string;
  importance: RequirementImportance;
  consequence_if_unresolved: string;
  investigation_prompt: string;
  dependencies: string[];
  resolution_note?: string;
  updated_at?: string;
}

export interface LegalPathway {
  id: string;
  name: string;
  type: 'judicial' | 'extrajudicial' | 'prejudicial';
  description: string;
  pros: string[];
  cons: string[];
  risks: string[];
  estimated_timeline: string;
  status: 'viable' | 'preferente' | 'descartada' | 'en_evaluacion';
  required_documents: string[];
  competent_authority: string;
  requisites_summary?: string;
}

export type ContradictionSeverity = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';
export type ContradictionCategory =
  | 'identity_relations'
  | 'dates_chronology'
  | 'facts_versions'
  | 'quantities_math'
  | 'locations_jurisdiction'
  | 'documentary';

export interface CaseContradiction {
  id: string;
  category: ContradictionCategory;
  description: string;
  versions: Array<{
    text: string;
    source: string;
    timestamp?: string;
  }>;
  severity: ContradictionSeverity;
  status: 'DETECTADA' | 'EN_ACLARACION' | 'RESUELTA_JUSTIFICADA' | 'NO_RESUELTA_LIMITANTE';
  question_to_clarify: string;
  resolution?: string;
  affects_pathways: string[];
  detected_at?: string;
}

export interface LegalResearchRecord {
  id: string;
  question_investigated: string;
  source_name: string;
  url?: string;
  authority: string;
  consultation_date: string;
  publication_date?: string;
  jurisdiction: string;
  norm_citation: string;
  conclusion: string;
  limitations_pending: string[];
  validity_confirmed: boolean;
}

export interface CaseMatterClassification {
  primary_matter: 'familiar' | 'arrendamiento' | 'penal' | 'laboral' | 'mercantil' | 'civil_general' | 'administrativo';
  detected_areas: string[];
  confidence: number;
  user_objective: string;
  current_situation: string;
  is_provisional: boolean;
}

export interface DocumentCandidateMatrix {
  doc_type: string;
  objective: string;
  recipient_authority: string;
  standing_and_capacity: string;
  essential_facts_required: string[];
  identities_relationships_to_prove: string[];
  dates_and_amounts: string[];
  legal_grounds: string[];
  petitions: string[];
  available_evidence: string[];
  required_annexes: string[];
  formal_requirements: string[];
  missing_data: string[];
  risks_if_incomplete: string[];
  is_ready_for_drafting: boolean;
}

// 4 CLASES DE LA BASE DE CONOCIMIENTO ACUMULATIVA (SECCIÓN 12)
export interface KnowledgeClassA_ExternalNorm {
  id: string;
  jurisdiction: string;
  norm_name: string;
  article: string;
  official_source: string;
  url?: string;
  validity_status: 'vigente' | 'derogado' | 'reforma_pendiente' | 'por_verificar';
  consultation_date: string;
  version: string;
}

export interface KnowledgeClassB_InvestigationPattern {
  id: string;
  matter: string;
  pattern_name: string;
  typical_requirements: string[];
  common_contradictions: string[];
  strategy_divergence_triggers: string[];
  supporting_evidence_types: string[];
  status: 'propuesto' | 'probado' | 'validado' | 'obsoleto' | 'pendiente_revision';
}

export interface KnowledgeClassC_OperationalPattern {
  id: string;
  document_type: string;
  checklist_items: string[];
  essential_clauses: string[];
  forensic_validations: string[];
  known_regression_risks: string[];
  status: 'propuesto' | 'probado' | 'validado' | 'obsoleto' | 'pendiente_revision';
}

export interface KnowledgeClassD_CaseParticular {
  case_id: string;
  user_id: string; // AISLADO ESTRICTAMENTE AL EXPEDIENTE Y PROPIETARIO
  facts: string[];
  documents: string[];
  isolated_at: string;
}

export interface CaseSummary {
  antecedents: string[];
  recommendedActions: string[];
  lastUpdated: Date;
}
