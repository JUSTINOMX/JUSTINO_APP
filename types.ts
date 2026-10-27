
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
}

export interface CaseSummary {
  antecedents: string[];
  recommendedActions: string[];
  lastUpdated: Date;
}
