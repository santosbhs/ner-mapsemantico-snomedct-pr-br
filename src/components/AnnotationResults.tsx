
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileJson, FileSpreadsheet, CheckCircle, AlertCircle, Target, Activity } from "lucide-react";
import { saveAnnotation, SaveAnnotationData } from "@/services/annotationService";
import { toast } from "@/hooks/use-toast";

interface Entity {
  text: string;
  label: string;
  start: number;
  end: number;
  confidence: number;
}

interface Mapping {
  entityText: string;
  snomedCode: string;
  snomedTerm: string;
  originalSnomedTerm: string;
  snomedHierarchy: string[];
  snomedSynonyms: string[];
  similarityScore: number;
  embeddingDistance: number;
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

interface AnnotationResultsProps {
  originalText: string;
  entities: Entity[];
  mappings: Mapping[];
  hl7Mappings?: HL7Mapping[];
}

const AnnotationResults = ({ originalText, entities, mappings, hl7Mappings = [] }: AnnotationResultsProps) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const saveAttempted = useRef(false);

  // Salvar automaticamente quando os resultados estiverem prontos (apenas uma vez)
  useEffect(() => {
    const autoSave = async () => {
      // Prevenir múltiplas tentativas de salvamento
      if (entities.length > 0 && !isSaved && !isSaving && !saveAttempted.current) {
        saveAttempted.current = true;
        setIsSaving(true);
        
        try {
          const annotationData: SaveAnnotationData = {
            title: `Anotação Automática - ${new Date().toLocaleString('pt-BR')}`,
            originalText,
            entities,
            mappings: mappings.map((mapping, index) => ({
              entityIndex: entities.findIndex(entity => entity.text === mapping.entityText),
              snomedCode: mapping.snomedCode,
              snomedTerm: mapping.snomedTerm,
              originalSnomedTerm: mapping.originalSnomedTerm,
              snomedHierarchy: mapping.snomedHierarchy,
              snomedSynonyms: mapping.snomedSynonyms,
              similarityScore: mapping.similarityScore,
              embeddingDistance: mapping.embeddingDistance
            })).filter(m => m.entityIndex !== -1), // Filtrar índices inválidos
            hl7Mappings: hl7Mappings.map((mapping, index) => ({
              entityIndex: entities.findIndex(entity => entity.text === mapping.entityText),
              hl7Code: mapping.hl7Code,
              hl7System: mapping.hl7System,
              hl7Display: mapping.hl7Display,
              hl7CodeSystemName: mapping.hl7CodeSystemName,
              hl7Version: mapping.hl7Version,
              resourceType: mapping.resourceType,
              similarityScore: mapping.similarityScore
            })).filter(m => m.entityIndex !== -1) // Filtrar índices inválidos
          };

          const result = await saveAnnotation(annotationData);
          
          if (result.success) {
            setIsSaved(true);
            setSavedId(result.annotationId);
            toast({
              title: "Anotação salva automaticamente!",
              description: "Os resultados foram salvos no Supabase com sucesso.",
            });
          } else {
            toast({
              title: "Erro ao salvar automaticamente",
              description: result.error || "Não foi possível salvar a anotação.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Erro durante salvamento:', error);
          toast({
            title: "Erro ao salvar automaticamente",
            description: "Ocorreu um erro inesperado durante o salvamento.",
            variant: "destructive"
          });
        } finally {
          setIsSaving(false);
        }
      }
    };

    // Delay para evitar múltiplas chamadas
    const timeoutId = setTimeout(autoSave, 1000);
    return () => clearTimeout(timeoutId);
  }, [entities, mappings, hl7Mappings, originalText, isSaved, isSaving]);

  const exportToJSON = () => {
    const data = {
      id: savedId,
      originalText,
      entities,
      snomedMappings: mappings,
      hl7Mappings,
      savedAt: new Date().toISOString(),
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anotacao-clinica-completa-${savedId || Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const csvData = [
      ['Entidade', 'Categoria', 'Posição', 'Confiança', 'SNOMED Code', 'SNOMED Term', 'HL7 Code', 'HL7 System', 'HL7 Display', 'Resource Type'],
      ...entities.map(entity => {
        const snomedMapping = mappings.find(m => m.entityText === entity.text);
        const hl7Mapping = hl7Mappings.find(m => m.entityText === entity.text);
        return [
          entity.text,
          entity.label,
          `${entity.start}-${entity.end}`,
          entity.confidence.toString(),
          snomedMapping?.snomedCode || '',
          snomedMapping?.snomedTerm || '',
          hl7Mapping?.hl7Code || '',
          hl7Mapping?.hl7CodeSystemName || '',
          hl7Mapping?.hl7Display || '',
          hl7Mapping?.resourceType || ''
        ];
      })
    ];
    
    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anotacao-clinica-completa-${savedId || Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Status de salvamento */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Resultados da Anotação Completa</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <span className="text-sm text-muted-foreground">Salvando...</span>
                  </>
                ) : isSaved ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Salvo no Supabase</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-600">Não salvo</span>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportToJSON}>
                  <FileJson className="h-4 w-4 mr-2" />
                  JSON
                </Button>
                <Button variant="outline" onClick={exportToCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  CSV
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Resumo dos resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Geral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{entities.length}</div>
              <div className="text-sm text-muted-foreground">Entidades Extraídas</div>
            </div>
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{mappings.length}</div>
              <div className="text-sm text-muted-foreground">SNOMED CT</div>
            </div>
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{hl7Mappings.length}</div>
              <div className="text-sm text-muted-foreground">HL7 FHIR</div>
            </div>
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {entities.length > 0 ? (((mappings.length + hl7Mappings.length) / (entities.length * 2)) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Cobertura Total</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Distribuição por Categoria:</h4>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(
                entities.reduce((acc, entity) => {
                  acc[entity.label] = (acc[entity.label] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([label, count]) => (
                <Badge key={label} variant="outline">
                  {label}: {count}
                </Badge>
              ))}
            </div>
          </div>

          {savedId && (
            <div className="text-xs text-muted-foreground">
              ID da Anotação: {savedId}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mapeamentos em abas */}
      <Tabs defaultValue="snomed" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="snomed" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            SNOMED CT ({mappings.length})
          </TabsTrigger>
          <TabsTrigger value="hl7" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            HL7 FHIR ({hl7Mappings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="snomed">
          <Card>
            <CardHeader>
              <CardTitle>Mapeamentos SNOMED CT</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Código SNOMED</TableHead>
                    <TableHead>Termo SNOMED</TableHead>
                    <TableHead>Similaridade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((mapping, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{mapping.entityText}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {entities.find(e => e.text === mapping.entityText)?.label || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{mapping.snomedCode}</TableCell>
                      <TableCell>{mapping.snomedTerm}</TableCell>
                      <TableCell>
                        <Badge variant={mapping.similarityScore > 0.8 ? "default" : "secondary"}>
                          {(mapping.similarityScore * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hl7">
          <Card>
            <CardHeader>
              <CardTitle>Mapeamentos HL7 FHIR</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Código HL7</TableHead>
                    <TableHead>Sistema</TableHead>
                    <TableHead>Display</TableHead>
                    <TableHead>Recurso FHIR</TableHead>
                    <TableHead>Similaridade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hl7Mappings.map((mapping, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{mapping.entityText}</TableCell>
                      <TableCell className="font-mono text-sm">{mapping.hl7Code}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {mapping.hl7CodeSystemName}
                        </Badge>
                      </TableCell>
                      <TableCell>{mapping.hl7Display}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {mapping.resourceType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={mapping.similarityScore > 0.8 ? "default" : "secondary"}>
                          {(mapping.similarityScore * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnnotationResults;
