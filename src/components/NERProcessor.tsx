
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Entity, extractClinicalEntities } from "@/utils/clinicalPatterns";
import NERProcessingState from "./NERProcessingState";
import EntityResults from "./EntityResults";

interface NERProcessorProps {
  text: string;
  onEntitiesExtracted: (entities: Entity[]) => void;
}

const NERProcessor = ({ text, onEntitiesExtracted }: NERProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [processingStep, setProcessingStep] = useState('');

  // Simulação do processamento NER com BioBERTpt
  const processNER = async () => {
    setIsProcessing(true);
    setProgress(0);
    setProcessingStep('Carregando modelo BioBERTpt...');

    // Simular carregamento do modelo
    await new Promise(resolve => setTimeout(resolve, 1000));
    setProgress(20);
    setProcessingStep('Tokenizando texto clínico...');

    await new Promise(resolve => setTimeout(resolve, 800));
    setProgress(40);
    setProcessingStep('Executando inferência NER...');

    await new Promise(resolve => setTimeout(resolve, 1200));
    setProgress(70);
    setProcessingStep('Pós-processando entidades...');

    // Extrair entidades do texto real
    const extractedEntities = extractClinicalEntities(text);

    await new Promise(resolve => setTimeout(resolve, 500));
    setProgress(100);
    setProcessingStep('Extração concluída!');

    setEntities(extractedEntities);
    setIsProcessing(false);

    toast({
      title: "NER Concluído",
      description: `${extractedEntities.length} entidades clínicas extraídas com sucesso!`,
    });

    onEntitiesExtracted(extractedEntities);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Extração de Entidades Clínicas (NER)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isProcessing && entities.length === 0 ? (
            <NERProcessingState
              isProcessing={isProcessing}
              progress={progress}
              processingStep={processingStep}
              onProcessStart={processNER}
            />
          ) : isProcessing ? (
            <NERProcessingState
              isProcessing={isProcessing}
              progress={progress}
              processingStep={processingStep}
              onProcessStart={processNER}
            />
          ) : (
            <EntityResults entities={entities} text={text} />
          )}
        </CardContent>
      </Card>

      {entities.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={() => onEntitiesExtracted(entities)}
            className="flex items-center gap-2"
            size="lg"
          >
            Mapear para SNOMED CT
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default NERProcessor;
