
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { initializeBioBERTpt, extractEntitiesWithBioBERTpt, type RealEntity } from "@/utils/realBioBERT";
import NERProcessingState from "./NERProcessingState";
import EntityResults from "./EntityResults";

interface NERProcessorProps {
  text: string;
  onEntitiesExtracted: (entities: RealEntity[]) => void;
}

const NERProcessor = ({ text, onEntitiesExtracted }: NERProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [entities, setEntities] = useState<RealEntity[]>([]);
  const [processingStep, setProcessingStep] = useState('');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const processRealNER = async () => {
    setIsProcessing(true);
    setProgress(0);
    setLoadingError(null);
    setProcessingStep('Inicializando BioBERTpt...');

    try {
      // Verificar se o texto não está vazio
      if (!text.trim()) {
        throw new Error('Texto vazio. Por favor, insira um texto clínico para análise.');
      }

      // Carregar modelo se ainda não foi carregado
      if (!isModelLoaded) {
        setProgress(10);
        setProcessingStep('Baixando modelo BioBERTpt (pode demorar na primeira execução)...');
        
        await initializeBioBERTpt();
        setIsModelLoaded(true);
        setProgress(30);
      }

      setProcessingStep('Tokenizando texto clínico...');
      setProgress(50);

      // Simular delay para mostrar progresso
      await new Promise(resolve => setTimeout(resolve, 500));

      setProcessingStep('Executando inferência NER com BioBERTpt...');
      setProgress(70);

      // Executar NER real
      const extractedEntities = await extractEntitiesWithBioBERTpt(text);

      setProgress(90);
      setProcessingStep('Pós-processando entidades...');

      await new Promise(resolve => setTimeout(resolve, 300));

      setProgress(100);
      setProcessingStep('Extração concluída!');

      setEntities(extractedEntities);
      setIsProcessing(false);

      if (extractedEntities.length === 0) {
        toast({
          title: "NER Concluído",
          description: "Nenhuma entidade clínica foi encontrada no texto. Tente com um texto mais específico.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "NER Concluído",
          description: `${extractedEntities.length} entidades clínicas extraídas com BioBERTpt!`,
        });
      }

      onEntitiesExtracted(extractedEntities);

    } catch (error) {
      console.error('Erro no processamento NER:', error);
      setLoadingError(error.message);
      setIsProcessing(false);
      
      toast({
        title: "Erro no NER",
        description: error.message || "Falha ao processar o texto com BioBERTpt",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Extração de Entidades com BioBERTpt Real
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {loadingError}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={() => {
                    setLoadingError(null);
                    setIsModelLoaded(false);
                  }}
                >
                  Tentar Novamente
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {!isProcessing && entities.length === 0 && !loadingError ? (
            <NERProcessingState
              isProcessing={isProcessing}
              progress={progress}
              processingStep={processingStep}
              onProcessStart={processRealNER}
              isRealModel={true}
            />
          ) : isProcessing ? (
            <NERProcessingState
              isProcessing={isProcessing}
              progress={progress}
              processingStep={processingStep}
              onProcessStart={processRealNER}
              isRealModel={true}
            />
          ) : entities.length > 0 ? (
            <EntityResults entities={entities} text={text} />
          ) : null}
        </CardContent>
      </Card>

      {entities.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={() => onEntitiesExtracted(entities)}
            className="flex items-center gap-2"
            size="lg"
          >
            Mapear para SNOMED CT Real
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default NERProcessor;
