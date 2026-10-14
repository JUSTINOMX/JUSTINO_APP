-- ====================================================================
-- JUSTINO AI LEGAL // MIGRACIÓN POST QA TEST 1
-- FASES 1–5: CIERRE, MEMORIA ESTRUCTURADA, JURISDICCIÓN Y VERSIONADO
-- ====================================================================
-- Este script es seguro e idempotente. Puede ejecutarse en el Editor SQL
-- del panel de Supabase sin riesgo de pérdida de datos.

-- 1. Ampliar tabla 'legal_cases' con estado de cierre y memoria estructurada
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='legal_cases' AND column_name='closed_at') THEN
        ALTER TABLE public.legal_cases ADD COLUMN closed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='legal_cases' AND column_name='structured_state') THEN
        ALTER TABLE public.legal_cases ADD COLUMN structured_state JSONB DEFAULT '{
          "identity": {
            "full_name": null,
            "address": null,
            "city": null,
            "state": null,
            "postal_code": null
          },
          "jurisdiction": {
            "country": "México",
            "state": null,
            "city": null,
            "judicial_district": null,
            "authority": null,
            "confirmed": false
          },
          "participants": [],
          "facts": {
            "confirmed": [],
            "alleged": [],
            "unknown": [],
            "contradictions": []
          },
          "evidence": [],
          "dates": [],
          "amounts": [],
          "strategy": {
            "current": null,
            "reason": null,
            "alternatives": [],
            "pending_questions": []
          },
          "actions": [],
          "decisions": [],
          "document_state": {
            "current_documents": [],
            "pending_documents": []
          }
        }'::jsonb;
    END IF;
END $$;

-- 2. Ampliar tabla 'case_vault_documents' con trazabilidad y versionado forense
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='case_vault_documents' AND column_name='version') THEN
        ALTER TABLE public.case_vault_documents ADD COLUMN version INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='case_vault_documents' AND column_name='is_latest') THEN
        ALTER TABLE public.case_vault_documents ADD COLUMN is_latest BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='case_vault_documents' AND column_name='status') THEN
        ALTER TABLE public.case_vault_documents ADD COLUMN status TEXT DEFAULT 'current';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='case_vault_documents' AND column_name='origin') THEN
        ALTER TABLE public.case_vault_documents ADD COLUMN origin TEXT DEFAULT 'generated';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='case_vault_documents' AND column_name='path') THEN
        ALTER TABLE public.case_vault_documents ADD COLUMN path TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='case_vault_documents' AND column_name='url') THEN
        ALTER TABLE public.case_vault_documents ADD COLUMN url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='case_vault_documents' AND column_name='type') THEN
        ALTER TABLE public.case_vault_documents ADD COLUMN type TEXT DEFAULT 'application/pdf';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='case_vault_documents' AND column_name='supersedes_document_id') THEN
        ALTER TABLE public.case_vault_documents ADD COLUMN supersedes_document_id UUID REFERENCES public.case_vault_documents(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Actualizar documentos existentes para garantizar compatibilidad retroactiva
UPDATE public.case_vault_documents 
SET 
  version = COALESCE(version, 1),
  is_latest = COALESCE(is_latest, TRUE),
  status = COALESCE(status, 'current'),
  origin = COALESCE(origin, 'generated')
WHERE version IS NULL OR is_latest IS NULL OR status IS NULL;
