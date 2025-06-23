
-- Criar tabela para armazenar os mapeamentos HL7 FHIR
CREATE TABLE public.hl7_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID REFERENCES public.extracted_entities(id) ON DELETE CASCADE NOT NULL,
  hl7_code TEXT NOT NULL,
  hl7_system TEXT NOT NULL, -- ex: 'http://loinc.org', 'http://hl7.org/fhir/sid/icd-10'
  hl7_display TEXT NOT NULL,
  hl7_code_system_name TEXT NOT NULL, -- ex: 'LOINC', 'ICD-10', 'RxNorm'
  hl7_version TEXT DEFAULT '4.0.1',
  resource_type TEXT NOT NULL, -- ex: 'Observation', 'Condition', 'Medication'
  similarity_score DECIMAL(3,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Validações
  CONSTRAINT check_hl7_similarity_range CHECK (similarity_score >= 0 AND similarity_score <= 1),
  CONSTRAINT check_hl7_code_length CHECK (char_length(hl7_code) <= 100),
  CONSTRAINT check_hl7_system_length CHECK (char_length(hl7_system) <= 200),
  CONSTRAINT check_hl7_display_length CHECK (char_length(hl7_display) <= 500)
);

-- Habilitar RLS para hl7_mappings
ALTER TABLE public.hl7_mappings ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para hl7_mappings (baseadas no entity_id)
CREATE POLICY "Authenticated users can view HL7 mappings from their entities" 
  ON public.hl7_mappings 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.extracted_entities e
      JOIN public.clinical_annotations a ON e.annotation_id = a.id
      WHERE e.id = entity_id 
      AND auth.uid() = a.user_id
    )
  );

CREATE POLICY "Authenticated users can create HL7 mappings for their entities" 
  ON public.hl7_mappings 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.extracted_entities e
      JOIN public.clinical_annotations a ON e.annotation_id = a.id
      WHERE e.id = entity_id 
      AND auth.uid() = a.user_id
    )
  );

CREATE POLICY "Authenticated users can update HL7 mappings from their entities" 
  ON public.hl7_mappings 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.extracted_entities e
      JOIN public.clinical_annotations a ON e.annotation_id = a.id
      WHERE e.id = entity_id 
      AND auth.uid() = a.user_id
    )
  );

CREATE POLICY "Authenticated users can delete HL7 mappings from their entities" 
  ON public.hl7_mappings 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.extracted_entities e
      JOIN public.clinical_annotations a ON e.annotation_id = a.id
      WHERE e.id = entity_id 
      AND auth.uid() = a.user_id
    )
  );

-- Índice para melhorar performance
CREATE INDEX idx_hl7_mappings_entity_id ON public.hl7_mappings(entity_id);
