import fs from 'fs';
import path from 'path';
import {
  KnowledgeClassA_ExternalNorm,
  KnowledgeClassB_InvestigationPattern,
  KnowledgeClassC_OperationalPattern,
  KnowledgeClassD_CaseParticular
} from '../types';

/**
 * BASE DE CONOCIMIENTO JURÍDICO ACUMULATIVA (SECCIÓN 12)
 * Separa 4 clases de conocimiento, protege la privacidad con anonimización estricta y aísla los expedientes.
 */

const LOCAL_STORAGE_DIR = path.resolve(process.cwd(), 'data');
const KNOWLEDGE_FILE = path.join(LOCAL_STORAGE_DIR, 'accumulative_knowledge.json');

export interface KnowledgeStoreData {
  classA_norms: KnowledgeClassA_ExternalNorm[];
  classB_investigationPatterns: KnowledgeClassB_InvestigationPattern[];
  classC_operationalPatterns: KnowledgeClassC_OperationalPattern[];
  last_updated: string;
}

// Inicialización de patrones fundacionales validados
const DEFAULT_KNOWLEDGE_STORE: KnowledgeStoreData = {
  classA_norms: [
    {
      id: 'norm_alimentos_proporcionalidad',
      jurisdiction: 'Nacional / México',
      norm_name: 'Código Civil / Código Nacional de Procedimientos Civiles y Familiares',
      article: 'Arts. 311 y correlativos',
      official_source: 'Diario Oficial de la Federación / Periódico Oficial Estatal',
      validity_status: 'vigente',
      consultation_date: '2026-10-27',
      version: '2026.1'
    },
    {
      id: 'norm_busqueda_domicilio',
      jurisdiction: 'Nacional / Procesal',
      norm_name: 'Código Nacional de Procedimientos Civiles y Familiares',
      article: 'Oficios de localización judicial',
      official_source: 'Diario Oficial de la Federación',
      validity_status: 'vigente',
      consultation_date: '2026-10-27',
      version: '2026.1'
    }
  ],
  classB_investigationPatterns: [
    {
      id: 'pat_familiar_alimentos_ausente',
      matter: 'familiar',
      pattern_name: 'Pensión alimenticia con deudor de domicilio no corroborado',
      typical_requirements: [
        'req_promovente_identity',
        'req_minor_identity',
        'req_birth_cert_status',
        'req_counterparty_address',
        'req_expenses_budget'
      ],
      common_contradictions: [
        'Discrepancia de apellidos entre promovente/deudor y menor',
        'Cálculo de aportaciones semanales vs mensuales',
        'Mención de acta sin cotejo físico'
      ],
      strategy_divergence_triggers: [
        'Si no existe domicilio certero -> Desviar a diligencias prejudiciales de búsqueda',
        'Si deudor aparece asentado y tiene empleo formal -> Juicio oral con medida provisional inmediata',
        'Si ambas partes tienen disposición -> Convenio extrajudicial en CEJA'
      ],
      supporting_evidence_types: ['Acta de nacimiento', 'Comprobantes de gastos del menor'],
      status: 'validado'
    },
    {
      id: 'pat_arrendamiento_incumplimiento',
      matter: 'arrendamiento',
      pattern_name: 'Falta de pago de rentas en inmueble urbano',
      typical_requirements: [
        'req_lease_contract',
        'req_unpaid_rents_amount',
        'req_jurisdiction_city'
      ],
      common_contradictions: [
        'Fecha de inicio de mora',
        'Pagos parciales no documentados'
      ],
      strategy_divergence_triggers: [
        'Si hay contrato escrito y 2 meses de mora -> Desahucio judicial inmediato',
        'Si acuerdo fue verbal -> Medios preparatorios a juicio'
      ],
      supporting_evidence_types: ['Contrato original', 'Recibos no pagados', 'Constancia de propiedad'],
      status: 'validado'
    }
  ],
  classC_operationalPatterns: [
    {
      id: 'op_demanda_alimentos_check',
      document_type: 'Demanda de Alimentos',
      checklist_items: [
        'Proemio con domicilio procesal en la ciudad competente',
        'Capítulo de hechos sin términos absolutos no demostrados',
        'Ofrecimiento de documental pública',
        'Petitorio de pensión provisional proporcional (sin porcentajes fijos automáticos)'
      ],
      essential_clauses: ['PROTESTO LO NECESARIO', 'CAPÍTULO DE DERECHO', 'PETITORIOS'],
      forensic_validations: [
        'Prohibición de corchetes de relleno',
        'Prohibición de 100% si no fue acreditado',
        'Fecha en año actual'
      ],
      known_regression_risks: [
        'Inserción de leyes de CDMX en casos de Chihuahua u otros estados',
        'Asunción prematura de paternidad sin cotejo de acta'
      ],
      status: 'validado'
    }
  ],
  last_updated: new Date().toISOString()
};

export class KnowledgeBaseService {
  private static instance: KnowledgeBaseService;
  private memoryCache: KnowledgeStoreData;

  private constructor() {
    this.memoryCache = this.loadFromDisk();
  }

  public static getInstance(): KnowledgeBaseService {
    if (!KnowledgeBaseService.instance) {
      KnowledgeBaseService.instance = new KnowledgeBaseService();
    }
    return KnowledgeBaseService.instance;
  }

  private loadFromDisk(): KnowledgeStoreData {
    try {
      if (fs.existsSync(KNOWLEDGE_FILE)) {
        const raw = fs.readFileSync(KNOWLEDGE_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Notice reading knowledge store file:", e);
    }
    return { ...DEFAULT_KNOWLEDGE_STORE };
  }

  private saveToDisk(): void {
    try {
      if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
        fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
      }
      fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(this.memoryCache, null, 2), 'utf-8');
    } catch (e) {
      console.warn("Notice saving knowledge store file:", e);
    }
  }

  // --- CLASE A: CONSULTA DE NORMAS EXTERNAS ---
  public getNorms(jurisdiction?: string): KnowledgeClassA_ExternalNorm[] {
    if (!jurisdiction) return this.memoryCache.classA_norms;
    return this.memoryCache.classA_norms.filter(n => 
      n.jurisdiction.toLowerCase().includes(jurisdiction.toLowerCase())
    );
  }

  // --- CLASE B: PATRONES DE INVESTIGACIÓN ---
  public getInvestigationPatterns(matter?: string): KnowledgeClassB_InvestigationPattern[] {
    if (!matter) return this.memoryCache.classB_investigationPatterns;
    return this.memoryCache.classB_investigationPatterns.filter(p => 
      p.matter.toLowerCase() === matter.toLowerCase() && p.status !== 'obsoleto'
    );
  }

  // --- CLASE C: PATRONES OPERATIVOS ---
  public getOperationalPatterns(documentType?: string): KnowledgeClassC_OperationalPattern[] {
    if (!documentType) return this.memoryCache.classC_operationalPatterns;
    return this.memoryCache.classC_operationalPatterns.filter(o => 
      o.document_type.toLowerCase().includes(documentType.toLowerCase()) && o.status !== 'obsoleto'
    );
  }

  // --- CLASE D: CONOCIMIENTO PARTICULAR DEL EXPEDIENTE (AISLADO ESTRICTAMENTE) ---
  public isolateCaseParticularKnowledge(
    caseId: string,
    userId: string,
    confirmedFacts: string[],
    documents: string[]
  ): KnowledgeClassD_CaseParticular {
    // Garantiza que los datos del usuario NUNCA se unan al catálogo global
    return {
      case_id: caseId,
      user_id: userId,
      facts: [...confirmedFacts],
      documents: [...documents],
      isolated_at: new Date().toISOString()
    };
  }

  // --- APRENDIZAJE SEGURO Y ANONIMIZADO DE NUEVOS PATRONES (NO PII) ---
  public registerLearningPattern(
    matter: string,
    patternName: string,
    typicalRequirements: string[],
    commonContradictions: string[],
    strategyTriggers: string[]
  ): KnowledgeClassB_InvestigationPattern {
    // Sanitización anti-PII estricta
    const sanitize = (text: string) => text
      .replace(/\b[A-Za-záéíóúñ]{3,}\s+[A-Za-záéíóúñ]{3,}(?:\s+[A-Za-záéíóúñ]{3,})*\b/g, '[INDIVIDUO]')
      .replace(/\b\d{5}\b/g, '[CP]')
      .replace(/\$\s*\d+(?:,\d{3})*(?:\.\d+)?/g, '[MONTO]');

    const newPattern: KnowledgeClassB_InvestigationPattern = {
      id: `pat_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      matter: matter.toLowerCase(),
      pattern_name: sanitize(patternName),
      typical_requirements: typicalRequirements.map(sanitize),
      common_contradictions: commonContradictions.map(sanitize),
      strategy_divergence_triggers: strategyTriggers.map(sanitize),
      supporting_evidence_types: ['Documento idóneo de acreditación'],
      status: 'propuesto'
    };

    this.memoryCache.classB_investigationPatterns.push(newPattern);
    this.memoryCache.last_updated = new Date().toISOString();
    this.saveToDisk();

    return newPattern;
  }
}

export const knowledgeBase = KnowledgeBaseService.getInstance();
