
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Target, Activity, Settings, ArrowRight, Database } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Entity {
  text: string;
  label: string;
  start: number;
  end: number;
  confidence: number;
}

interface HL7Mapping {
  entityText: string;
  entityLabel: string;
  hl7Code: string;
  hl7System: string;
  hl7Display: string;
  hl7CodeSystemName: string;
  hl7Version: string;
  resourceType: string;
  similarityScore: number;
}

interface HL7MapperProps {
  entities: Entity[];
  onMappingsComplete: (mappings: HL7Mapping[]) => void;
}

const HL7Mapper = ({ entities, onMappingsComplete }: HL7MapperProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mappings, setMappings] = useState<HL7Mapping[]>([]);
  const [threshold, setThreshold] = useState(0.8);
  const [processingStep, setProcessingStep] = useState('');

  // Base de dados simulada do HL7 FHIR com códigos LOINC e ICD-10
  const hl7Database = {
    "dor torácica aguda": {
      code: "29857009",
      system: "http://snomed.info/sct",
      display: "Chest pain",
      codeSystemName: "SNOMED CT",
      version: "4.0.1",
      resourceType: "Observation",
      similarity: 0.94
    },
    "dispneia": {
      code: "267036007",
      system: "http://snomed.info/sct", 
      display: "Dyspnea",
      codeSystemName: "SNOMED CT",
      version: "4.0.1",
      resourceType: "Observation",
      similarity: 0.96
    },
    "sudorese": {
      code: "415690000",
      system: "http://snomed.info/sct",
      display: "Sweating",
      codeSystemName: "SNOMED CT",
      version: "4.0.1",
      resourceType: "Observation",
      similarity: 0.93
    },
    "hipertensão arterial sistêmica": {
      code: "I10",
      system: "http://hl7.org/fhir/sid/icd-10",
      display: "Essential (primary) hypertension",
      codeSystemName: "ICD-10",
      version: "4.0.1",
      resourceType: "Condition",
      similarity: 0.97
    },
    "diabetes mellitus tipo 2": {
      code: "E11",
      system: "http://hl7.org/fhir/sid/icd-10",
      display: "Type 2 diabetes mellitus",
      codeSystemName: "ICD-10",
      version: "4.0.1",
      resourceType: "Condition",
      similarity: 0.99
    },
    "taquicardia": {
      code: "3424008",
      system: "http://snomed.info/sct",
      display: "Tachycardia",
      codeSystemName: "SNOMED CT",
      version: "4.0.1",
      resourceType: "Observation",
      similarity: 0.95
    },
    "estertores pulmonares": {
      code: "48409008",
      system: "http://snomed.info/sct",
      display: "Respiratory adventitious sound",
      codeSystemName: "SNOMED CT",
      version: "4.0.1",
      resourceType: "Observation",
      similarity: 0.91
    },
    "infarto agudo do miocárdio": {
      code: "I21",
      system: "http://hl7.org/fhir/sid/icd-10",
      display: "Acute myocardial infarction",
      codeSystemName: "ICD-10",
      version: "4.0.1",
      resourceType: "Condition",
      similarity: 0.98
    }
  };

  const processHL7Mapping = async () => {
    setIsProcessing(true);
    setProgress(0);
    setProcessingStep('Carregando terminologias HL7 FHIR...');

    await new Promise(resolve => setTimeout(resolve, 1000));
    setProgress(15);
    setProcessingStep('Carregando LOINC, ICD-10 e SNOMED CT...');

    await new Promise(resolve => setTimeout(resolve, 800));
    setProgress(30);
    setProcessingStep('Gerando mapeamentos para recursos FHIR...');

    const newMappings: HL7Mapping[] = [];

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      setProgress(30 + (i / entities.length) * 50);
      setProcessingStep(`Mapeando HL7: "${entity.text}"...`);

      await new Promise(resolve => setTimeout(resolve, 500));

      const normalizedText = entity.text.toLowerCase().trim();
      const hl7Match = hl7Database[normalizedText];

      if (hl7Match && hl7Match.similarity >= threshold) {
        newMappings.push({
          entityText: entity.text,
          entityLabel: entity.label,
          hl7Code: hl7Match.code,
          hl7System: hl7Match.system,
          hl7Display: hl7Match.display,
          hl7CodeSystemName: hl7Match.codeSystemName,
          hl7Version: hl7Match.version,
          resourceType: hl7Match.resourceType,
          similarityScore: hl7Match.similarity
        });
      }
    }

    setProgress(90);
    setProcessingStep('Finalizando mapeamentos HL7 FHIR...');

    await new Promise(resolve => setTimeout(resolve, 500));
    setProgress(100);
    setProcessingStep('Mapeamento HL7 concluído!');

    setMappings(newMappings);
    setIsProcessing(false);

    toast({
      title: "Mapeamento HL7 FHIR Concluído",
      description: `${newMappings.length} de ${entities.length} entidades mapeadas para HL7 FHIR`,
    });
  };

  const getResourceTypeColor = (resourceType: string) => {
    const colors = {
      'Observation': 'bg-blue-100 text-blue-800',
      'Condition': 'bg-red-100 text-red-800',
      'Medication': 'bg-green-100 text-green-800',
      'Procedure': 'bg-purple-100 text-purple-800'
    };
    return colors[resourceType] || 'bg-gray-100 text-gray-800';
  };

  const getSystemBadge = (system: string) => {
    if (system.includes('snomed')) return 'SNOMED CT';
    if (system.includes('icd-10')) return 'ICD-10';
    if (system.includes('loinc')) return 'LOINC';
    if (system.includes('rxnorm')) return 'RxNorm';
    return 'HL7';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Mapeamento para HL7 FHIR
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-4 w-4" />
              <span className="font-medium">Configurações HL7 FHIR</span>
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
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Mapeamentos com similaridade ≥ {threshold.toFixed(2)} para recursos FHIR
                </div>
              </div>
            </div>
          </div>

          {!isProcessing && mappings.length === 0 && (
            <div className="text-center py-8">
              <div className="space-y-4">
                <div className="text-lg font-medium">
                  Pronto para mapear {entities.length} entidades para HL7 FHIR
                </div>
                <div className="text-sm text-muted-foreground max-w-md mx-auto">
                  Mapeamento para terminologias padrão HL7 FHIR: LOINC, ICD-10, SNOMED CT, RxNorm
                </div>
                <div className="flex justify-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-blue-600">LOINC</Badge>
                  <Badge variant="outline" className="text-red-600">ICD-10</Badge>
                  <Badge variant="outline" className="text-green-600">SNOMED CT</Badge>
                  <Badge variant="outline" className="text-purple-600">RxNorm</Badge>
                </div>
                <Button onClick={processHL7Mapping} className="flex items-center gap-2" size="lg">
                  <Database className="h-4 w-4" />
                  Executar Mapeamento HL7 FHIR
                </Button>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">Processando Mapeamento HL7</div>
                <div className="text-sm text-muted-foreground mb-4">{processingStep}</div>
                <Progress value={progress} className="w-full max-w-md mx-auto" />
                <div className="text-xs text-muted-foreground mt-2">{progress}%</div>
              </div>
            </div>
          )}

          {mappings.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-lg font-medium">
                  ✅ {mappings.length} mapeamentos HL7 FHIR encontrados
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
                          <Badge variant={mapping.similarityScore > 0.8 ? "default" : "secondary"}>
                            {(mapping.similarityScore * 100).toFixed(1)}%
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium text-green-600">Código:</span> {mapping.hl7Code}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Display:</span> {mapping.hl7Display}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Sistema:</span> 
                              <Badge variant="outline" className="ml-2">
                                {getSystemBadge(mapping.hl7System)}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              URI: {mapping.hl7System}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium">Recurso FHIR:</span>
                              <Badge className={`ml-2 ${getResourceTypeColor(mapping.resourceType)}`}>
                                {mapping.resourceType}
                              </Badge>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Versão HL7:</span> {mapping.hl7Version}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Sistema de Códigos:</span> {mapping.hl7CodeSystemName}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded-lg">
                <strong>HL7 FHIR:</strong> {mappings.length} mapeamentos • Threshold: {threshold} • 
                Sistemas: {Array.from(new Set(mappings.map(m => getSystemBadge(m.hl7System)))).join(', ')}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {mappings.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={() => onMappingsComplete(mappings)}
            className="flex items-center gap-2"
            size="lg"
          >
            Continuar com Resultados
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default HL7Mapper;
