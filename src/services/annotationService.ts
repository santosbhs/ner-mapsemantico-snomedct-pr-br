
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
  hl7Mappings?: Array<{
    entityIndex: number;
    hl7Code: string;
    hl7System: string;
    hl7Display: string;
    hl7CodeSystemName: string;
    hl7Version: string;
    resourceType: string;
    similarityScore: number;
  }>;
}

export const saveAnnotation = async (data: SaveAnnotationData) => {
  try {
    // Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // 1. Salvar a anotação principal
    const { data: annotation, error: annotationError } = await supabase
      .from('clinical_annotations')
      .insert({
        title: data.title || 'Anotação Clínica',
        original_text: data.originalText,
        user_id: user.id
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
    if (data.mappings && data.mappings.length > 0) {
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

      const { error: mappingsError } = await supabase
        .from('snomed_mappings')
        .insert(mappingsData);

      if (mappingsError) throw mappingsError;
    }

    // 4. Salvar os mapeamentos HL7 (se fornecidos)
    if (data.hl7Mappings && data.hl7Mappings.length > 0) {
      // Filtrar apenas mapeamentos válidos com entityIndex válido
      const validHL7Mappings = data.hl7Mappings.filter(mapping => 
        mapping.entityIndex >= 0 && 
        mapping.entityIndex < savedEntities.length &&
        mapping.hl7Code &&
        mapping.hl7System &&
        mapping.hl7Display
      );

      if (validHL7Mappings.length > 0) {
        const hl7MappingsData = validHL7Mappings.map(mapping => ({
          entity_id: savedEntities[mapping.entityIndex].id,
          hl7_code: mapping.hl7Code,
          hl7_system: mapping.hl7System,
          hl7_display: mapping.hl7Display,
          hl7_code_system_name: mapping.hl7CodeSystemName,
          hl7_version: mapping.hl7Version || '4.0.1',
          resource_type: mapping.resourceType,
          similarity_score: mapping.similarityScore
        }));

        const { error: hl7MappingsError } = await supabase
          .from('hl7_mappings')
          .insert(hl7MappingsData);

        if (hl7MappingsError) {
          console.error('Erro ao salvar mapeamentos HL7:', hl7MappingsError);
          // Não falhar completamente se os mapeamentos HL7 falharem
          // throw hl7MappingsError;
        }
      }
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
          snomed_mappings (*),
          hl7_mappings (*)
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
