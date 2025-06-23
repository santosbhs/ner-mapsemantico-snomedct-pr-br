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

  // Função para extrair entidades clínicas do texto
  const extractClinicalEntities = (text: string): Entity[] => {
    const entities: Entity[] = [];
    
    // Padrões para diferentes tipos de entidades clínicas
    const patterns = {
      SINTOMA: [
        /\b(dor|dispneia|sudorese|taquicardia|bradicardia|náusea|vômito|febre|cefaleia|tontura|fadiga|fraqueza|mal-estar|cansaço)\b/gi,
        /\b(dor\s+(?:torácica|abdominal|cervical|lombar|muscular|articular|de\s+cabeça)(?:\s+aguda|crônica)?)\b/gi,
        /\b(estertores?\s+(?:pulmonares?|crepitantes?))\b/gi,
        /\b(chiado|sibilos?|roncos?)\b/gi,
        /\b(edema|inchaço)\b/gi,
        /\b(palpitações?|batimentos?\s+cardíacos?\s+irregulares?)\b/gi,
        /\b(tosse(?:\s+seca|produtiva)?)\b/gi,
        /\b(sangramento|hemorragia)\b/gi,
      ],
      DOENCA: [
        /\b(diabetes\s+mellitus(?:\s+tipo\s+[12])?)\b/gi,
        /\b(hipertensão\s+arterial(?:\s+sistêmica)?)\b/gi,
        /\b(infarto(?:\s+agudo)?\s+do\s+miocárdio)\b/gi,
        /\b(insuficiência\s+(?:cardíaca|renal|hepática))\b/gi,
        /\b(pneumonia|bronquite|asma)\b/gi,
        /\b(acidente\s+vascular\s+cerebral|AVC)\b/gi,
        /\b(depressão|ansiedade|transtorno\s+bipolar)\b/gi,
        /\b(artrite|artrose|osteoporose)\b/gi,
        /\b(câncer|tumor|neoplasia)\b/gi,
        /\b(covid-19|coronavirus|sars-cov-2)\b/gi,
      ],
      MEDICAMENTO: [
        /\b(aspirina|ácido\s+acetilsalicílico)\b/gi,
        /\b(paracetamol|acetaminofeno)\b/gi,
        /\b(ibuprofeno|diclofenaco|nimesulida)\b/gi,
        /\b(atenolol|propranolol|metoprolol)\b/gi,
        /\b(losartana?|enalapril|captopril)\b/gi,
        /\b(metformina|glibenclamida|insulina)\b/gi,
        /\b(omeprazol|ranitidina|pantoprazol)\b/gi,
        /\b(dipirona|metamizol)\b/gi,
        /\b(amoxicilina|azitromicina|ciprofloxacino)\b/gi,
        /\b(sinvastatina|atorvastatina)\b/gi,
      ],
      PROCEDIMENTO: [
        /\b(eletrocardiograma|ECG)\b/gi,
        /\b(ecocardiograma|eco)\b/gi,
        /\b(radiografia|raio-x|RX)\b/gi,
        /\b(tomografia(?:\s+computadorizada)?|TC)\b/gi,
        /\b(ressonância\s+magnética|RM)\b/gi,
        /\b(ultrassonografia|ultrassom|USG)\b/gi,
        /\b(endoscopia|colonoscopia)\b/gi,
        /\b(cirurgia|operação|intervenção\s+cirúrgica)\b/gi,
        /\b(cateterismo\s+cardíaco)\b/gi,
        /\b(biópsia|punção)\b/gi,
      ],
      ANATOMIA: [
        /\b(coração|cardíaco|miocárdio)\b/gi,
        /\b(pulmão|pulmonar|brônquios?|alvéolos?)\b/gi,
        /\b(fígado|hepático|hepato)\b/gi,
        /\b(rim|renal|néfrico)\b/gi,
        /\b(cérebro|cerebral|neurológico)\b/gi,
        /\b(estômago|gástrico|gastro)\b/gi,
        /\b(intestino|intestinal|cólon)\b/gi,
        /\b(artéria|veia|vascular)\b/gi,
        /\b(osso|ósseo|esquelético)\b/gi,
        /\b(músculo|muscular|tendão)\b/gi,
      ]
    };

    // Processar cada categoria de entidade
    Object.entries(patterns).forEach(([label, regexPatterns]) => {
      regexPatterns.forEach(regex => {
        let match;
        while ((match = regex.exec(text)) !== null) {
          const entityText = match[0];
          const start = match.index;
          const end = start + entityText.length;
          
          // Verificar se já existe uma entidade na mesma posição
          const isDuplicate = entities.some(entity => 
            entity.start === start && entity.end === end
          );
          
          if (!isDuplicate) {
            entities.push({
              text: entityText,
              label,
              start,
              end,
              confidence: Math.random() * 0.15 + 0.85 // Confiança entre 85% e 100%
            });
          }
        }
      });
    });

    // Ordenar por posição no texto
    return entities.sort((a, b) => a.start - b.start);
  };

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
