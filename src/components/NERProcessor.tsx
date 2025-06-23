
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Entity {
  text: string;
  label: string;
  start: number;
  end: number;
  confidence: number;
}

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

    // Simulação de extração de entidades clínicas
    const mockEntities: Entity[] = [
      { text: "dor torácica aguda", label: "SINTOMA", start: 35, end: 53, confidence: 0.95 },
      { text: "dispneia", label: "SINTOMA", start: 55, end: 63, confidence: 0.92 },
      { text: "sudorese", label: "SINTOMA", start: 66, end: 74, confidence: 0.88 },
      { text: "hipertensão arterial sistêmica", label: "DOENCA", start: 89, end: 119, confidence: 0.96 },
      { text: "diabetes mellitus tipo 2", label: "DOENCA", start: 122, end: 147, confidence: 0.98 },
      { text: "taquicardia", label: "SINTOMA", start: 165, end: 176, confidence: 0.91 },
      { text: "estertores pulmonares", label: "SINTOMA", start: 178, end: 199, confidence: 0.89 },
      { text: "infarto agudo do miocárdio", label: "DOENCA", start: 250, end: 276, confidence: 0.97 }
    ];

    await new Promise(resolve => setTimeout(resolve, 500));
    setProgress(100);
    setProcessingStep('Extração concluída!');

    setEntities(mockEntities);
    setIsProcessing(false);

    toast({
      title: "NER Concluído",
      description: `${mockEntities.length} entidades clínicas extraídas com sucesso!`,
    });
  };

  const getEntityColor = (label: string) => {
    const colors = {
      'SINTOMA': 'bg-red-100 text-red-800 border-red-200',
      'DOENCA': 'bg-orange-100 text-orange-800 border-orange-200',
      'MEDICAMENTO': 'bg-blue-100 text-blue-800 border-blue-200',
      'PROCEDIMENTO': 'bg-green-100 text-green-800 border-green-200',
      'ANATOMIA': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[label] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const renderTextWithEntities = () => {
    if (entities.length === 0) return text;

    let result = [];
    let lastEnd = 0;

    const sortedEntities = [...entities].sort((a, b) => a.start - b.start);

    sortedEntities.forEach((entity, index) => {
      // Adicionar texto antes da entidade
      if (entity.start > lastEnd) {
        result.push(text.slice(lastEnd, entity.start));
      }

      // Adicionar entidade destacada
      result.push(
        <span
          key={index}
          className={`inline-block px-2 py-1 rounded-md mx-1 ${getEntityColor(entity.label)} cursor-pointer hover:scale-105 transition-transform`}
          title={`${entity.label} (${(entity.confidence * 100).toFixed(1)}%)`}
        >
          {entity.text}
        </span>
      );

      lastEnd = entity.end;
    });

    // Adicionar texto restante
    if (lastEnd < text.length) {
      result.push(text.slice(lastEnd));
    }

    return result;
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
          {!isProcessing && entities.length === 0 && (
            <div className="text-center py-8">
              <div className="space-y-4">
                <div className="text-lg font-medium">Pronto para extrair entidades clínicas</div>
                <div className="text-sm text-muted-foreground max-w-md mx-auto">
                  Utilizando BioBERTpt (Portuguese Clinical BERT) para identificar:
                  sintomas, doenças, medicamentos, procedimentos e estruturas anatômicas.
                </div>
                <div className="flex justify-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-red-600 border-red-200">Sintomas</Badge>
                  <Badge variant="outline" className="text-orange-600 border-orange-200">Doenças</Badge>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">Medicamentos</Badge>
                  <Badge variant="outline" className="text-green-600 border-green-200">Procedimentos</Badge>
                  <Badge variant="outline" className="text-purple-600 border-purple-200">Anatomia</Badge>
                </div>
                <Button onClick={processNER} className="flex items-center gap-2" size="lg">
                  <Zap className="h-4 w-4" />
                  Executar BioBERTpt NER
                </Button>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">Processando com BioBERTpt</div>
                <div className="text-sm text-muted-foreground mb-4">{processingStep}</div>
                <Progress value={progress} className="w-full max-w-md mx-auto" />
                <div className="text-xs text-muted-foreground mt-2">{progress}%</div>
              </div>
            </div>
          )}

          {entities.length > 0 && (
            <div className="space-y-4">
              <div className="text-lg font-medium">
                ✅ {entities.length} entidades extraídas
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="text-sm font-medium mb-2">Texto com Anotações:</div>
                <div className="text-sm leading-relaxed">
                  {renderTextWithEntities()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entities.map((entity, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className={getEntityColor(entity.label)}>
                        {entity.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {(entity.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="font-medium text-sm">{entity.text}</div>
                    <div className="text-xs text-muted-foreground">
                      Posição: {entity.start}-{entity.end}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
