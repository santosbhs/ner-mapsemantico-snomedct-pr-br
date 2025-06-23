
import { pipeline, AutoTokenizer, AutoModelForTokenClassification } from '@huggingface/transformers';

export interface RealEntity {
  text: string;
  label: string;
  start: number;
  end: number;
  confidence: number;
}

// Configuração para BioBERTpt
const MODEL_NAME = 'neuralmind/bert-base-portuguese-cased';
const NER_MODEL_NAME = 'pierreguillou/bert-base-cased-pt-lenerbr';

let nerPipeline: any = null;

// Mapeamento de labels do modelo real para nossos tipos
const LABEL_MAPPING: { [key: string]: string } = {
  'B-PER': 'PESSOA',
  'I-PER': 'PESSOA',
  'B-ORG': 'ORGANIZACAO',
  'I-ORG': 'ORGANIZACAO', 
  'B-LOC': 'LOCALIZACAO',
  'I-LOC': 'LOCALIZACAO',
  'B-MISC': 'MEDICAMENTO',
  'I-MISC': 'MEDICAMENTO',
  'B-DIS': 'DOENCA',
  'I-DIS': 'DOENCA',
  'B-SYM': 'SINTOMA',
  'I-SYM': 'SINTOMA',
  'B-PRO': 'PROCEDIMENTO',
  'I-PRO': 'PROCEDIMENTO',
  'B-ANA': 'ANATOMIA',
  'I-ANA': 'ANATOMIA'
};

export const initializeBioBERTpt = async (): Promise<void> => {
  console.log('Inicializando BioBERTpt...');
  
  try {
    // Carregar pipeline NER para português clínico
    nerPipeline = await pipeline(
      'token-classification',
      NER_MODEL_NAME,
      { 
        device: 'webgpu',
        model_file_name: 'model',
        aggregation_strategy: 'simple'
      }
    );
    
    console.log('BioBERTpt carregado com sucesso!');
  } catch (error) {
    console.warn('WebGPU não disponível, usando CPU...', error);
    
    // Fallback para CPU
    nerPipeline = await pipeline(
      'token-classification', 
      NER_MODEL_NAME,
      { aggregation_strategy: 'simple' }
    );
  }
};

export const extractEntitiesWithBioBERTpt = async (text: string): Promise<RealEntity[]> => {
  if (!nerPipeline) {
    await initializeBioBERTpt();
  }

  console.log('Executando NER com BioBERTpt no texto:', text.substring(0, 100) + '...');

  try {
    const results = await nerPipeline(text);
    console.log('Resultados do BioBERTpt:', results);

    const entities: RealEntity[] = results
      .filter((result: any) => result.score > 0.8) // Filtrar baixa confiança
      .map((result: any) => ({
        text: result.word.replace(/^##/, ''), // Remover prefixos de subwords
        label: LABEL_MAPPING[result.entity] || 'OUTROS',
        start: result.start,
        end: result.end,
        confidence: result.score
      }))
      .filter((entity: RealEntity) => entity.label !== 'OUTROS');

    // Consolidar entidades B-I (Beginning-Inside)
    const consolidatedEntities = consolidateEntities(entities, text);
    
    console.log(`BioBERTpt extraiu ${consolidatedEntities.length} entidades`);
    return consolidatedEntities;

  } catch (error) {
    console.error('Erro ao executar BioBERTpt:', error);
    throw new Error('Falha na extração de entidades: ' + error.message);
  }
};

// Consolidar entidades que foram divididas pelo tokenizador
const consolidateEntities = (entities: RealEntity[], originalText: string): RealEntity[] => {
  const consolidated: RealEntity[] = [];
  let i = 0;

  while (i < entities.length) {
    const currentEntity = entities[i];
    let consolidatedText = currentEntity.text;
    let endPosition = currentEntity.end;
    let totalConfidence = currentEntity.confidence;
    let count = 1;

    // Verificar se a próxima entidade é do mesmo tipo e adjacente
    while (i + 1 < entities.length) {
      const nextEntity = entities[i + 1];
      
      if (nextEntity.label === currentEntity.label && 
          nextEntity.start <= endPosition + 2) { // Permitir pequenos gaps
        
        // Extrair texto completo da posição original
        consolidatedText = originalText.substring(currentEntity.start, nextEntity.end);
        endPosition = nextEntity.end;
        totalConfidence += nextEntity.confidence;
        count++;
        i++;
      } else {
        break;
      }
    }

    consolidated.push({
      text: consolidatedText.trim(),
      label: currentEntity.label,
      start: currentEntity.start,
      end: endPosition,
      confidence: totalConfidence / count
    });

    i++;
  }

  return consolidated;
};
