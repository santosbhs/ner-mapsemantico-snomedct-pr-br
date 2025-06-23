
import { supabase } from "@/integrations/supabase/client";

export interface SaveAnnotationData {
  title?: string;
  originalText: string;
  entities: Array<{
    text: string;
    label: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  mappings: Array<{
    entityIndex: number;
    snomedCode: string;
    snomedTerm: string;
    originalSnomedTerm: string;
    snomedHierarchy: string[];
    snomedSynonyms: string[];
    similarityScore: number;
    embeddingDistance: number;
  }>;
}

export const saveAnnotation = async (data: SaveAnnotationData) => {
  try {
    // 1. Salvar a anotação principal
    const { data: annotation, error: annotationError } = await supabase
      .from('clinical_annotations')
      .insert({
        title: data.title || 'Anotação Clínica',
        original_text: data.originalText,
        user_id: null // Permitir salvamento anônimo por enquanto
      })
      .select()
      .single();

    if (annotationError) throw annotationError;

    // 2. Salvar as entidades extraídas
    const entitiesData = data.entities.map(entity => ({
      annotation_id: annotation.id,
      text: entity.text,
      label: entity.label,
      start_position: entity.start,
      end_position: entity.end,
      confidence: entity.confidence
    }));

    const { data: savedEntities, error: entitiesError } = await supabase
      .from('extracted_entities')
      .insert(entitiesData)
      .select();

    if (entitiesError) throw entitiesError;

    // 3. Salvar os mapeamentos SNOMED
    const mappingsData = data.mappings.map(mapping => ({
      entity_id: savedEntities[mapping.entityIndex].id,
      snomed_code: mapping.snomedCode,
      snomed_term: mapping.snomedTerm,
      original_snomed_term: mapping.originalSnomedTerm,
      snomed_hierarchy: mapping.snomedHierarchy,
      snomed_synonyms: mapping.snomedSynonyms,
      similarity_score: mapping.similarityScore,
      embedding_distance: mapping.embeddingDistance
    }));

    if (mappingsData.length > 0) {
      const { error: mappingsError } = await supabase
        .from('snomed_mappings')
        .insert(mappingsData);

      if (mappingsError) throw mappingsError;
    }

    return { success: true, annotationId: annotation.id };
  } catch (error) {
    console.error('Erro ao salvar anotação:', error);
    return { success: false, error: error.message };
  }
};

export const loadAnnotations = async () => {
  try {
    const { data: annotations, error } = await supabase
      .from('clinical_annotations')
      .select(`
        *,
        extracted_entities (
          *,
          snomed_mappings (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: annotations };
  } catch (error) {
    console.error('Erro ao carregar anotações:', error);
    return { success: false, error: error.message };
  }
};
