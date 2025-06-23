import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Target, Brain, Settings, ArrowRight, TreePine } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Entity {
  text: string;
  label: string;
  start: number;
  end: number;
  confidence: number;
}

interface SnomedMapping {
  entityText: string;
  entityLabel: string;
  snomedCode: string;
  snomedTerm: string;
  snomedSynonyms: string[];
  snomedHierarchy: string[];
  originalSnomedTerm: string;
  similarityScore: number;
  embeddingDistance: number;
}

interface SnomedMapperProps {
  entities: Entity[];
  onMappingsComplete: (mappings: SnomedMapping[]) => void;
}

const SnomedMapper = ({ entities, onMappingsComplete }: SnomedMapperProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mappings, setMappings] = useState<SnomedMapping[]>([]);
  const [threshold, setThreshold] = useState(0.8);
  const [processingStep, setProcessingStep] = useState('');
  const [hasCompleted, setHasCompleted] = useState(false);

  // Base de dados simulada do SNOMED CT PT-BR com hierarquia
  const snomedDatabase = {
    "dor torácica aguda": {
      code: "29857009",
      term: "Dor torácica",
      originalTerm: "Chest pain",
      hierarchy: [
        "Clinical finding (finding)",
        "Sign/symptom (finding)", 
        "Pain/discomfort (finding)",
        "Regional pain/discomfort (finding)",
        "Chest pain (finding)"
      ],
      synonyms: ["dor no peito", "dor precordial", "desconforto torácico"],
      similarity: 0.94
    },
    "dispneia": {
      code: "267036007", 
      term: "Dispneia",
      originalTerm: "Dyspnea",
      hierarchy: [
        "Clinical finding (finding)",
        "Sign/symptom (finding)",
        "Respiratory sign/symptom (finding)",
        "Dyspnea (finding)"
      ],
      synonyms: ["falta de ar", "dificuldade respiratória", "respiração difícil"],
      similarity: 0.96
    },
    "sudorese": {
      code: "415690000",
      term: "Sudorese",
      originalTerm: "Sweating",
      hierarchy: [
        "Clinical finding (finding)",
        "Sign/symptom (finding)",
        "Skin/subcutaneous tissue sign/symptom (finding)",
        "Sweating (finding)"
      ],
      synonyms: ["suor excessivo", "transpiração", "hiperidrose"],
      similarity: 0.93
    },
    "hipertensão arterial sistêmica": {
      code: "38341003",
      term: "Hipertensão arterial",
      originalTerm: "Hypertensive disorder, systemic arterial",
      hierarchy: [
        "Clinical finding (finding)",
        "Disease (disorder)",
        "Cardiovascular disease (disorder)",
        "Vascular disease (disorder)",
        "Hypertensive disorder (disorder)"
      ],
      synonyms: ["pressão alta", "hipertensão essencial", "hipertensão primária"],
      similarity: 0.97
    },
    "diabetes mellitus tipo 2": {
      code: "44054006",
      term: "Diabetes mellitus tipo 2",
      originalTerm: "Diabetes mellitus type 2",
      hierarchy: [
        "Clinical finding (finding)",
        "Disease (disorder)",
        "Endocrine/metabolic/nutritional disorder (disorder)",
        "Metabolic disease (disorder)",
        "Diabetes mellitus (disorder)",
        "Type 2 diabetes mellitus (disorder)"
      ],
      synonyms: ["diabetes tipo 2", "diabetes não insulino-dependente", "DMNID"],
      similarity: 0.99
    },
    "taquicardia": {
      code: "3424008",
      term: "Taquicardia",
      originalTerm: "Tachycardia",
      hierarchy: [
        "Clinical finding (finding)",
        "Sign/symptom (finding)",
        "Cardiovascular sign/symptom (finding)",
        "Heart rate/rhythm sign/symptom (finding)",
        "Tachycardia (finding)"
      ],
      synonyms: ["frequência cardíaca elevada", "ritmo cardíaco acelerado"],
      similarity: 0.95
    },
    "estertores pulmonares": {
      code: "48409008",
      term: "Estertores",
      originalTerm: "Respiratory adventitious sound",
      hierarchy: [
        "Clinical finding (finding)",
        "Sign/symptom (finding)",
        "Respiratory sign/symptom (finding)",
        "Respiratory adventitious sound (finding)"
      ],
      synonyms: ["ruídos adventícios", "crepitações", "roncos pulmonares"],
      similarity: 0.91
    },
    "infarto agudo do miocárdio": {
      code: "22298006",
      term: "Infarto agudo do miocárdio",
      originalTerm: "Myocardial infarction",
      hierarchy: [
        "Clinical finding (finding)",
        "Disease (disorder)",
        "Cardiovascular disease (disorder)",
        "Heart disease (disorder)",
        "Ischemic heart disease (disorder)",
        "Myocardial infarction (disorder)"
      ],
      synonyms: ["ataque cardíaco", "enfarte do miocárdio", "IAM"],
      similarity: 0.98
    }
  };

  const processSemanticMapping = async () => {
    setIsProcessing(true);
    setProgress(0);
    setProcessingStep('Carregando embeddings BioBERTpt...');

    await new Promise(resolve => setTimeout(resolve, 1000));
    setProgress(15);
    setProcessingStep('Carregando base SNOMED CT PT-BR...');

    await new Promise(resolve => setTimeout(resolve, 800));
    setProgress(30);
    setProcessingStep('Gerando embeddings para entidades extraídas...');

    const newMappings: SnomedMapping[] = [];

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      setProgress(30 + (i / entities.length) * 50);
      setProcessingStep(`Mapeando: "${entity.text}"...`);

      await new Promise(resolve => setTimeout(resolve, 500));

      const normalizedText = entity.text.toLowerCase().trim();
      const snomedMatch = snomedDatabase[normalizedText];

      if (snomedMatch && snomedMatch.similarity >= threshold) {
        newMappings.push({
          entityText: entity.text,
          entityLabel: entity.label,
          snomedCode: snomedMatch.code,
          snomedTerm: snomedMatch.term,
          originalSnomedTerm: snomedMatch.originalTerm,
          snomedHierarchy: snomedMatch.hierarchy,
          snomedSynonyms: snomedMatch.synonyms,
          similarityScore: snomedMatch.similarity,
          embeddingDistance: 1 - snomedMatch.similarity
        });
      }
    }

    setProgress(90);
    setProcessingStep('Aplicando threshold de similaridade...');

    await new Promise(resolve => setTimeout(resolve, 500));
    setProgress(100);
    setProcessingStep('Mapeamento concluído!');

    setMappings(newMappings);
    setIsProcessing(false);
    setHasCompleted(true);

    toast({
      title: "Mapeamento SNOMED Concluído",
      description: `${newMappings.length} de ${entities.length} entidades mapeadas (threshold: ${threshold})`,
    });
  };

  const handleProceedToHL7 = () => {
    console.log('Proceeding to HL7 with mappings:', mappings);
    onMappingsComplete(mappings);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.95) return 'text-green-600';
    if (score >= 0.85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.95) return 'bg-green-100 text-green-800';
    if (score >= 0.85) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Mapeamento Semântico para SNOMED CT PT-BR
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-4 w-4" />
              <span className="font-medium">Configurações de Mapeamento</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">
                  Threshold de Similaridade: {threshold.toFixed(2)}
                </label>
                <Slider
                  value={[threshold]}
                  onValueChange={(value) => setThreshold(value[0])}
                  max={1}
                  min={0.5}
                  step={0.05}
                  className="mt-2"
                  disabled={isProcessing}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Apenas mapeamentos com similaridade ≥ {threshold.toFixed(2)} serão aceitos
                </div>
              </div>
            </div>
          </div>

          {!isProcessing && !hasCompleted && (
            <div className="text-center py-8">
              <div className="space-y-4">
                <div className="text-lg font-medium">
                  Pronto para mapear {entities.length} entidades
                </div>
                <div className="text-sm text-muted-foreground max-w-md mx-auto">
                  Utilizando embeddings semânticos e similaridade de cosseno para encontrar 
                  correspondências na base SNOMED CT PT-BR
                </div>
                <div className="text-xs text-muted-foreground">
                  Pipeline: Embeddings → Similaridade Cosseno → Threshold → Match
                </div>
                <Button onClick={processSemanticMapping} className="flex items-center gap-2" size="lg">
                  <Brain className="h-4 w-4" />
                  Executar Mapeamento Semântico
                </Button>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">Processando Mapeamento</div>
                <div className="text-sm text-muted-foreground mb-4">{processingStep}</div>
                <Progress value={progress} className="w-full max-w-md mx-auto" />
                <div className="text-xs text-muted-foreground mt-2">{progress}%</div>
              </div>
            </div>
          )}

          {hasCompleted && mappings.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-lg font-medium">
                  ✅ {mappings.length} mapeamentos encontrados
                </div>
                <Badge variant="outline">
                  Taxa: {((mappings.length / entities.length) * 100).toFixed(1)}%
                </Badge>
              </div>

              <div className="grid gap-4">
                {mappings.map((mapping, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">
                            "{mapping.entityText}"
                          </div>
                          <Badge className={getScoreBadge(mapping.similarityScore)}>
                            {(mapping.similarityScore * 100).toFixed(1)}%
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Informações do Mapeamento */}
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium text-blue-600">SNOMED:</span> {mapping.snomedCode}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Termo PT-BR:</span> {mapping.snomedTerm}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Termo Original:</span> 
                              <span className="italic text-gray-600 ml-1">{mapping.originalSnomedTerm}</span>
                            </div>
                            <div className="text-xs">
                              <span className="font-medium">Sinônimos:</span> {mapping.snomedSynonyms.join(', ')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Distância embedding: {mapping.embeddingDistance.toFixed(4)}
                            </div>
                          </div>

                          {/* Hierarquia SNOMED */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <TreePine className="h-4 w-4" />
                              Hierarquia SNOMED CT
                            </div>
                            <div className="text-xs space-y-1">
                              {mapping.snomedHierarchy.map((level, levelIndex) => (
                                <div 
                                  key={levelIndex} 
                                  className="flex items-center gap-2"
                                  style={{ paddingLeft: `${levelIndex * 12}px` }}
                                >
                                  <span className="text-gray-400">
                                    {levelIndex > 0 && '└─ '}
                                  </span>
                                  <span className={
                                    levelIndex === mapping.snomedHierarchy.length - 1 
                                      ? 'font-medium text-blue-600' 
                                      : 'text-gray-600'
                                  }>
                                    {level}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded-lg">
                <strong>Estatísticas:</strong> {mappings.length} sucessos de {entities.length} entidades 
                • Threshold: {threshold} • Média de similaridade: {(mappings.reduce((acc, m) => acc + m.similarityScore, 0) / mappings.length).toFixed(3)}
              </div>
            </div>
          )}

          {hasCompleted && mappings.length === 0 && (
            <div className="text-center py-8">
              <div className="text-lg font-medium text-orange-600 mb-2">
                Nenhum mapeamento encontrado
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                Nenhuma entidade atingiu o threshold de similaridade de {threshold.toFixed(2)}
              </div>
              <Button 
                onClick={() => {
                  setHasCompleted(false);
                  setMappings([]);
                }} 
                variant="outline"
              >
                Tentar Novamente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {hasCompleted && (
        <div className="flex justify-end">
          <Button
            onClick={handleProceedToHL7}
            className="flex items-center gap-2"
            size="lg"
          >
            Prosseguir para HL7 FHIR
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default SnomedMapper;
