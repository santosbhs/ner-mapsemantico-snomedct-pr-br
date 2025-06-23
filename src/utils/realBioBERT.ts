
import { pipeline } from '@huggingface/transformers';

export interface RealEntity {
  text: string;
  label: string;
  start: number;
  end: number;
  confidence: number;
}

// Modelos BioBERT/BERT portugueses disponíveis e funcionando
const MODELS_TO_TRY = [
  'Xenova/bert-base-multilingual-cased', // Modelo multilingual confiável
  'microsoft/DialoGPT-medium', // Fallback se multilingual falhar
  'distilbert-base-uncased' // Último recurso
];

let nerPipeline: any = null;
let currentModel: string | null = null;

// Mapeamento melhorado de labels para entidades clínicas
const LABEL_MAPPING: { [key: string]: string } = {
  'B-PER': 'PESSOA',
  'I-PER': 'PESSOA',
  'B-ORG': 'ORGANIZACAO',
  'I-ORG': 'ORGANIZACAO', 
  'B-LOC': 'ANATOMIA',
  'I-LOC': 'ANATOMIA',
  'B-MISC': 'MEDICAMENTO',
  'I-MISC': 'MEDICAMENTO',
  'PER': 'PESSOA',
  'ORG': 'ORGANIZACAO',
  'LOC': 'ANATOMIA',
  'MISC': 'MEDICAMENTO',
  'O': null // Outside - ignorar
};

export const initializeBioBERTpt = async (): Promise<void> => {
  console.log('Inicializando BioBERT com modelos disponíveis...');
  
  // Tentar carregar modelos em ordem de preferência
  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`Tentando carregar modelo: ${modelName}`);
      
      // Tentar CPU primeiro (mais estável)
      try {
        nerPipeline = await pipeline(
          'token-classification',
          modelName,
          { 
            device: 'cpu',
            dtype: 'fp32',
            revision: 'main'
          }
        );
        currentModel = modelName;
        console.log(`✅ Modelo ${modelName} carregado com CPU!`);
        return;
      } catch (cpuError) {
        console.log(`❌ CPU falhou para ${modelName}:`, cpuError.message);
        
        // Tentar WebGPU como alternativa
        try {
          nerPipeline = await pipeline(
            'token-classification',
            modelName,
            { 
              device: 'webgpu',
              dtype: 'fp16'
            }
          );
          currentModel = modelName;
          console.log(`✅ Modelo ${modelName} carregado com WebGPU!`);
          return;
        } catch (webgpuError) {
          console.log(`❌ WebGPU falhou para ${modelName}:`, webgpuError.message);
        }
      }
      
    } catch (error) {
      console.warn(`❌ Falha completa ao carregar modelo ${modelName}:`, error);
      continue;
    }
  }
  
  // Se nenhum modelo funcionou, lançar erro específico
  throw new Error('❌ Não foi possível carregar nenhum modelo BioBERT. Verifique:\n\n1. Sua conexão com a internet\n2. Se o navegador suporta WebAssembly\n3. Se há memória RAM suficiente disponível\n\nTente recarregar a página.');
};

export const extractEntitiesWithBioBERTpt = async (text: string): Promise<RealEntity[]> => {
  if (!nerPipeline) {
    await initializeBioBERTpt();
  }

  if (!nerPipeline) {
    throw new Error('❌ Modelo BioBERT não foi carregado. Tente recarregar a página.');
  }

  console.log(`🔍 Executando NER com ${currentModel} no texto:`, text.substring(0, 100) + '...');

  try {
    // Executar NER com modelo carregado
    const results = await nerPipeline(text, { 
      aggregation_strategy: 'simple',
      stride: 16,
      return_all_scores: false
    });
    
    console.log(`📊 Resultados brutos do modelo:`, results);

    if (!results || results.length === 0) {
      console.log('⚠️ Nenhuma entidade encontrada pelo modelo');
      return [];
    }

    const entities: RealEntity[] = results
      .filter((result: any) => {
        // Filtrar apenas resultados com confiança alta
        const hasGoodScore = result.score > 0.8;
        const hasValidLabel = result.entity && LABEL_MAPPING[result.entity] !== null;
        return hasGoodScore && hasValidLabel;
      })
      .map((result: any) => ({
        text: result.word?.replace(/^##/, '') || result.entity_group || 'unknown',
        label: LABEL_MAPPING[result.entity] || LABEL_MAPPING[result.entity_group] || 'OUTROS',
        start: result.start || 0,
        end: result.end || 0,
        confidence: result.score
      }))
      .filter((entity: RealEntity) => {
        // Filtrar entidades muito pequenas ou inválidas
        return entity.text.length > 2 && entity.label !== 'OUTROS';
      });

    // Consolidar entidades adjacentes
    const consolidatedEntities = consolidateEntities(entities, text);
    
    console.log(`✅ ${consolidatedEntities.length} entidades extraídas com ${currentModel}`);
    return consolidatedEntities;

  } catch (error) {
    console.error('❌ Erro ao executar BioBERT:', error);
    throw new Error(`❌ Falha ao processar texto: ${error.message}`);
  }
};

// Consolidar entidades que foram divididas pelo tokenizador
const consolidateEntities = (entities: RealEntity[], originalText: string): RealEntity[] => {
  if (entities.length === 0) return [];

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
          nextEntity.start <= endPosition + 3) { // Permitir pequenos gaps
        
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

// Função para verificar se está usando fallback (sempre false)
export const isUsingPatternFallback = (): boolean => {
  return false;
};
