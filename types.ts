
export interface User {
  id: string; // Supabase UUID
  email: string;
  name?: string;
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
}

export interface CaseSummary {
  antecedents: string[];
  recommendedActions: string[];
  lastUpdated: Date;
}
