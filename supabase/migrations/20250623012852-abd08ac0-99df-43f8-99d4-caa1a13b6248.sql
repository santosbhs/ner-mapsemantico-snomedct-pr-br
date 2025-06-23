
-- Criar tabela para armazenar as narrativas clínicas anotadas
CREATE TABLE public.clinical_annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  title TEXT NOT NULL DEFAULT 'Anotação Clínica',
  original_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para armazenar as entidades extraídas (NER)
CREATE TABLE public.extracted_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  annotation_id UUID REFERENCES public.clinical_annotations(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  label TEXT NOT NULL,
  start_position INTEGER NOT NULL,
  end_position INTEGER NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para armazenar os mapeamentos SNOMED CT
CREATE TABLE public.snomed_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID REFERENCES public.extracted_entities(id) ON DELETE CASCADE NOT NULL,
  snomed_code TEXT NOT NULL,
  snomed_term TEXT NOT NULL,
  original_snomed_term TEXT NOT NULL,
  snomed_hierarchy TEXT[] NOT NULL DEFAULT '{}',
  snomed_synonyms TEXT[] NOT NULL DEFAULT '{}',
  similarity_score DECIMAL(3,2) NOT NULL,
  embedding_distance DECIMAL(6,4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.clinical_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snomed_mappings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clinical_annotations
CREATE POLICY "Users can view their own annotations" 
  ON public.clinical_annotations 
  FOR SELECT 
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can create annotations" 
  ON public.clinical_annotations 
  FOR INSERT 
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can update their own annotations" 
  ON public.clinical_annotations 
  FOR UPDATE 
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can delete their own annotations" 
  ON public.clinical_annotations 
  FOR DELETE 
  USING (user_id IS NULL OR auth.uid() = user_id);

-- Políticas RLS para extracted_entities (baseadas na annotation_id)
CREATE POLICY "Users can view entities from their annotations" 
  ON public.extracted_entities 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.clinical_annotations 
      WHERE id = annotation_id 
      AND (user_id IS NULL OR auth.uid() = user_id)
    )
  );

CREATE POLICY "Users can create entities for their annotations" 
  ON public.extracted_entities 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clinical_annotations 
      WHERE id = annotation_id 
      AND (user_id IS NULL OR auth.uid() = user_id)
    )
  );

CREATE POLICY "Users can update entities from their annotations" 
  ON public.extracted_entities 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.clinical_annotations 
      WHERE id = annotation_id 
      AND (user_id IS NULL OR auth.uid() = user_id)
    )
  );

CREATE POLICY "Users can delete entities from their annotations" 
  ON public.extracted_entities 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.clinical_annotations 
      WHERE id = annotation_id 
      AND (user_id IS NULL OR auth.uid() = user_id)
    )
  );

-- Políticas RLS para snomed_mappings (baseadas no entity_id)
CREATE POLICY "Users can view mappings from their entities" 
  ON public.snomed_mappings 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.extracted_entities e
      JOIN public.clinical_annotations a ON e.annotation_id = a.id
      WHERE e.id = entity_id 
      AND (a.user_id IS NULL OR auth.uid() = a.user_id)
    )
  );

CREATE POLICY "Users can create mappings for their entities" 
  ON public.snomed_mappings 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.extracted_entities e
      JOIN public.clinical_annotations a ON e.annotation_id = a.id
      WHERE e.id = entity_id 
      AND (a.user_id IS NULL OR auth.uid() = a.user_id)
    )
  );

CREATE POLICY "Users can update mappings from their entities" 
  ON public.snomed_mappings 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.extracted_entities e
      JOIN public.clinical_annotations a ON e.annotation_id = a.id
      WHERE e.id = entity_id 
      AND (a.user_id IS NULL OR auth.uid() = a.user_id)
    )
  );

CREATE POLICY "Users can delete mappings from their entities" 
  ON public.snomed_mappings 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.extracted_entities e
      JOIN public.clinical_annotations a ON e.annotation_id = a.id
      WHERE e.id = entity_id 
      AND (a.user_id IS NULL OR auth.uid() = a.user_id)
    )
  );

-- Índices para melhorar performance
CREATE INDEX idx_clinical_annotations_user_id ON public.clinical_annotations(user_id);
CREATE INDEX idx_extracted_entities_annotation_id ON public.extracted_entities(annotation_id);
CREATE INDEX idx_snomed_mappings_entity_id ON public.snomed_mappings(entity_id);
