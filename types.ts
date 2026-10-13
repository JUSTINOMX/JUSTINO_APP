
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
    known_information?: string;
  }>;
  facts: {
    confirmed: string[];
    alleged: string[];
    unknown: string[];
    contradictions: string[];
  };
  dates: Array<{
    description: string;
    date: string;
    is_confirmed?: boolean;
  }>;
  amounts: Array<{
    concept: string;
    amount: number | string;
    currency: string;
  }>;
  evidence: Array<{
    title: string;
    type?: string;
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
