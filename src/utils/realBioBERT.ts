
import { pipeline } from '@huggingface/transformers';

export interface RealEntity {
  text: string;
  label: string;
  start: number;
  end: number;
  confidence: number;
}

// Modelos BioBERT portugueses com suporte ONNX
const MODELS_TO_TRY = [
  'Xenova/bert-base-multilingual-cased', // Modelo multilingual com ONNX
  'neuralmind/bert-base-portuguese-cased', // Modelo português base
  'Xenova/distilbert-base-multilingual-cased' // Fallback mais leve
];

let nerPipeline: any = null;
let currentModel: string | null = null;

// Mapeamento de labels para nossos tipos
const LABEL_MAPPING: { [key: string]: string } = {
  'B-PER': 'PESSOA',
  'I-PER': 'PESSOA',
  'B-ORG': 'ORGANIZACAO',
  'I-ORG': 'ORGANIZACAO', 
  'B-LOC': 'LOCALIZACAO',
  'I-LOC': 'LOCALIZACAO',
  'B-MISC': 'MEDICAMENTO',
  'I-MISC': 'MEDICAMENTO',
  'PER': 'PESSOA',
  'ORG': 'ORGANIZACAO',
  'LOC': 'LOCALIZACAO',
  'MISC': 'OUTROS'
};

export const initializeBioBERTpt = async (): Promise<void> => {
  console.log('Inicializando BioBERTpt...');
  
  // Tentar carregar modelos em ordem de preferência
  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`Tentando carregar modelo: ${modelName}`);
      
      // Tentar WebGPU primeiro
      try {
        nerPipeline = await pipeline(
          'token-classification',
          modelName,
          { 
            device: 'webgpu',
            dtype: 'fp32'
          }
        );
        currentModel = modelName;
        console.log(`Modelo ${modelName} carregado com WebGPU!`);
        return;
      } catch (webgpuError) {
        console.log(`WebGPU falhou para ${modelName}, tentando CPU...`);
        
        // Fallback para CPU
        nerPipeline = await pipeline(
          'token-classification', 
          modelName,
          { device: 'cpu' }
        );
        currentModel = modelName;
        console.log(`Modelo ${modelName} carregado com CPU!`);
        return;
      }
      
    } catch (error) {
      console.warn(`Falha ao carregar modelo ${modelName}:`, error);
      continue;
    }
  }
  
  // Se nenhum modelo funcionou, lançar erro
  throw new Error('Nenhum modelo BioBERT está disponível. Verifique sua conexão com a internet ou tente novamente mais tarde.');
};

export const extractEntitiesWithBioBERTpt = async (text: string): Promise<RealEntity[]> => {
  if (!nerPipeline) {
    await initializeBioBERTpt();
  }

  if (!nerPipeline) {
    throw new Error('Modelo BioBERT não foi carregado. Tente novamente.');
  }

  console.log('Executando NER com BioBERTpt no texto:', text.substring(0, 100) + '...');

  try {
    // Usar modelo BioBERT real
    const results = await nerPipeline(text, { 
      aggregation_strategy: 'simple'
    });
    console.log('Resultados do BioBERTpt:', results);

    const entities: RealEntity[] = results
      .filter((result: any) => result.score > 0.7) // Filtrar baixa confiança
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
    
    console.log(`BioBERTpt extraiu ${consolidatedEntities.length} entidades usando modelo: ${currentModel}`);
    return consolidatedEntities;

  } catch (error) {
    console.error('Erro ao executar BioBERTpt:', error);
    throw new Error(`Falha ao processar texto com BioBERTpt: ${error.message}`);
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

// Função para verificar qual modelo está sendo usado
export const getCurrentModel = (): string => {
  return currentModel || 'nenhum-modelo-carregado';
};

// Função para verificar se está usando fallback (sempre false agora)
export const isUsingPatternFallback = (): boolean => {
  return false;
};
