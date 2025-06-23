
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Target, Brain, Settings, ArrowRight, TreePine, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { snomedService, type SnomedSearchResult } from "@/services/snomedService";

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
  snomedSystem: string;
}

interface SnomedMapperProps {
  entities: Entity[];
  onMappingsComplete: (mappings: SnomedMapping[]) => void;
}

const SnomedMapper = ({ entities, onMappingsComplete }: SnomedMapperProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mappings, setMappings] = useState<SnomedMapping[]>([]);
  const [threshold, setThreshold] = useState(0.7);
  const [processingStep, setProcessingStep] = useState('');
  const [hasCompleted, setHasCompleted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const processRealSnomedMapping = async () => {
    setIsProcessing(true);
    setProgress(0);
    setApiError(null);
    setProcessingStep('Conectando à API SNOMED CT FHIR...');

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(15);
      setProcessingStep('Carregando terminologia SNOMED CT mais atual...');

      const newMappings: SnomedMapping[] = [];
      let processedCount = 0;

      for (const entity of entities) {
        setProgress(15 + (processedCount / entities.length) * 70);
        setProcessingStep(`Buscando "${entity.text}" na SNOMED CT Internacional...`);

        try {
          console.log(`Buscando conceitos SNOMED para: "${entity.text}"`);
          
          // Buscar na API real da SNOMED CT
          const searchResults: SnomedSearchResult[] = await snomedService.searchConcepts(entity.text, 5);
          
          // Filtrar por threshold e pegar o melhor resultado
          const bestMatch = searchResults.find(result => result.score >= threshold);
          
          if (bestMatch) {
            newMappings.push({
              entityText: entity.text,
              entityLabel: entity.label,
              snomedCode: bestMatch.concept.code,
              snomedTerm: bestMatch.concept.display,
              originalSnomedTerm: bestMatch.concept.display, // Em português já
              snomedHierarchy: bestMatch.concept.hierarchy,
              snomedSynonyms: bestMatch.concept.synonyms,
              snomedSystem: bestMatch.concept.system,
              similarityScore: bestMatch.score,
              embeddingDistance: 1 - bestMatch.score
            });

            console.log(`✅ Mapeado: "${entity.text}" → ${bestMatch.concept.code} (${bestMatch.concept.display})`);
          } else {
            console.log(`❌ Sem mapeamento para: "${entity.text}" (threshold: ${threshold})`);
          }

          // Delay entre requisições para não sobrecarregar a API
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          console.error(`Erro ao buscar "${entity.text}":`, error);
          // Continuar com próxima entidade em caso de erro
        }

        processedCount++;
      }

      setProgress(90);
      setProcessingStep('Finalizando mapeamentos...');

      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(100);
      setProcessingStep('Mapeamento SNOMED CT concluído!');

      setMappings(newMappings);
      setIsProcessing(false);
      setHasCompleted(true);

      const successRate = ((newMappings.length / entities.length) * 100).toFixed(1);

      toast({
        title: "Mapeamento SNOMED CT Concluído",
        description: `${newMappings.length} de ${entities.length} entidades mapeadas (${successRate}%)`,
      });

    } catch (error) {
      console.error('Erro no mapeamento SNOMED:', error);
      setApiError(error.message || 'Falha na conexão com a API SNOMED CT');
      setIsProcessing(false);
      
      toast({
        title: "Erro no Mapeamento",
        description: "Falha ao conectar com a API SNOMED CT. Verifique sua conexão.",
        variant: "destructive"
      });
    }
  };

  const handleProceedToHL7 = () => {
    console.log('Proceeding to HL7 with real SNOMED mappings:', mappings);
    onMappingsComplete(mappings);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.9) return 'bg-green-100 text-green-800';
    if (score >= 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Mapeamento Real para SNOMED CT Internacional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {apiError}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={() => setApiError(null)}
                >
                  Tentar Novamente
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-4 w-4" />
              <span className="font-medium">Configurações de Mapeamento Real</span>
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
              <div className="text-xs text-muted-foreground bg-white p-2 rounded border">
                <strong>API:</strong> CSIRO Ontoserver (Austrália) • 
                <strong> Base:</strong> SNOMED CT Internacional mais recente • 
                <strong> Idioma:</strong> Português brasileiro quando disponível
              </div>
            </div>
          </div>

          {!isProcessing && !hasCompleted && !apiError && (
            <div className="text-center py-8">
              <div className="space-y-4">
                <div className="text-lg font-medium">
                  Pronto para mapear {entities.length} entidades
                </div>
                <div className="text-sm text-muted-foreground max-w-md mx-auto">
                  Utilizando API FHIR para buscar correspondências na base SNOMED CT 
                  Internacional mais atual através de servidores oficiais
                </div>
                <div className="text-xs text-muted-foreground">
                  Pipeline: API FHIR → SNOMED CT → Busca Semântica → Threshold → Match
                </div>
                <Button onClick={processRealSnomedMapping} className="flex items-center gap-2" size="lg">
                  <Brain className="h-4 w-4" />
                  Executar Mapeamento Real SNOMED CT
                </Button>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">Processando Mapeamento Real</div>
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
                  ✅ {mappings.length} mapeamentos SNOMED CT encontrados
                </div>
                <Badge variant="outline">
                  Taxa: {((mappings.length / entities.length) * 100).toFixed(1)}%
                </Badge>
              </div>

              <div className="grid gap-4">
                {mappings.map((mapping, index) => (
                  <Card key={index} className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">
                            "{mapping.entityText}"
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getScoreBadge(mapping.similarityScore)}>
                              {(mapping.similarityScore * 100).toFixed(1)}%
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://browser.ihtsdotools.org/?perspective=full&conceptId1=${mapping.snomedCode}`, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium text-green-600">SNOMED CT:</span> {mapping.snomedCode}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Termo Oficial:</span> {mapping.snomedTerm}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Sistema:</span> 
                              <span className="text-xs text-gray-600 ml-1">{mapping.snomedSystem}</span>
                            </div>
                            {mapping.snomedSynonyms.length > 1 && (
                              <div className="text-xs">
                                <span className="font-medium">Sinônimos:</span> {mapping.snomedSynonyms.slice(1).join(', ')}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Score de similaridade: {mapping.similarityScore.toFixed(4)}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <TreePine className="h-4 w-4" />
                              Status da API
                            </div>
                            <div className="text-xs space-y-1">
                              <div className="text-green-600">✅ Conectado à SNOMED CT Internacional</div>
                              <div className="text-blue-600">🌐 Via CSIRO Ontoserver FHIR</div>
                              <div className="text-gray-600">📅 Base mais atual disponível</div>
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
                • <strong>Fonte:</strong> SNOMED CT Internacional via API FHIR
              </div>
            </div>
          )}

          {hasCompleted && mappings.length === 0 && (
            <div className="text-center py-8">
              <div className="text-lg font-medium text-orange-600 mb-2">
                Nenhum mapeamento encontrado
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                Nenhuma entidade atingiu o threshold de similaridade de {threshold.toFixed(2)} na base SNOMED CT real
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

      {hasCompleted && mappings.length > 0 && (
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
