
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, Database, BarChart3, Copy } from "lucide-react";
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
  similarityScore: number;
  embeddingDistance: number;
}

interface AnnotationResultsProps {
  originalText: string;
  entities: Entity[];
  mappings: SnomedMapping[];
}

const AnnotationResults = ({ originalText, entities, mappings }: AnnotationResultsProps) => {
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv' | 'xml'>('json');

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

  const renderAnnotatedText = () => {
    if (entities.length === 0) return originalText;

    let result = [];
    let lastEnd = 0;

    const sortedEntities = [...entities].sort((a, b) => a.start - b.start);

    sortedEntities.forEach((entity, index) => {
      if (entity.start > lastEnd) {
        result.push(originalText.slice(lastEnd, entity.start));
      }

      const mapping = mappings.find(m => m.entityText === entity.text);
      const hasMapping = mapping && mapping.similarityScore >= 0.8;

      result.push(
        <span
          key={index}
          className={`inline-block px-2 py-1 rounded-md mx-1 cursor-pointer hover:scale-105 transition-transform ${
            hasMapping 
              ? `${getEntityColor(entity.label)} ring-2 ring-blue-400` 
              : getEntityColor(entity.label)
          }`}
          title={
            hasMapping 
              ? `${entity.label} → SNOMED: ${mapping.snomedCode} (${(mapping.similarityScore * 100).toFixed(1)}%)`
              : `${entity.label} (${(entity.confidence * 100).toFixed(1)}%) - Sem mapeamento SNOMED`
          }
        >
          {entity.text}
          {hasMapping && <span className="ml-1 text-xs">🔗</span>}
        </span>
      );

      lastEnd = entity.end;
    });

    if (lastEnd < originalText.length) {
      result.push(originalText.slice(lastEnd));
    }

    return result;
  };

  const generateExportData = () => {
    const data = {
      metadata: {
        processedAt: new Date().toISOString(),
        totalEntities: entities.length,
        mappedEntities: mappings.length,
        mappingRate: ((mappings.length / entities.length) * 100).toFixed(1) + '%',
        originalText: originalText
      },
      entities: entities.map(entity => {
        const mapping = mappings.find(m => m.entityText === entity.text);
        return {
          text: entity.text,
          label: entity.label,
          position: { start: entity.start, end: entity.end },
          nerConfidence: entity.confidence,
          snomedMapping: mapping ? {
            code: mapping.snomedCode,
            term: mapping.snomedTerm,
            synonyms: mapping.snomedSynonyms,
            similarityScore: mapping.similarityScore
          } : null
        };
      })
    };

    switch (selectedFormat) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        const csvHeader = 'Entity,Label,Start,End,NER_Confidence,SNOMED_Code,SNOMED_Term,Similarity_Score\n';
        const csvRows = data.entities.map(entity => 
          `"${entity.text}","${entity.label}",${entity.position.start},${entity.position.end},${entity.nerConfidence},"${entity.snomedMapping?.code || ''}","${entity.snomedMapping?.term || ''}",${entity.snomedMapping?.similarityScore || ''}`
        ).join('\n');
        return csvHeader + csvRows;
      case 'xml':
        return `<?xml version="1.0" encoding="UTF-8"?>
<clinicalAnnotation>
  <metadata>
    <processedAt>${data.metadata.processedAt}</processedAt>
    <totalEntities>${data.metadata.totalEntities}</totalEntities>
    <mappedEntities>${data.metadata.mappedEntities}</mappedEntities>
    <mappingRate>${data.metadata.mappingRate}</mappingRate>
  </metadata>
  <entities>
    ${data.entities.map(entity => `
    <entity>
      <text>${entity.text}</text>
      <label>${entity.label}</label>
      <start>${entity.position.start}</start>
      <end>${entity.position.end}</end>
      <nerConfidence>${entity.nerConfidence}</nerConfidence>
      ${entity.snomedMapping ? `
      <snomedMapping>
        <code>${entity.snomedMapping.code}</code>
        <term>${entity.snomedMapping.term}</term>
        <similarityScore>${entity.snomedMapping.similarityScore}</similarityScore>
      </snomedMapping>` : ''}
    </entity>`).join('')}
  </entities>
</clinicalAnnotation>`;
    }
  };

  const handleExport = () => {
    const data = generateExportData();
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinical-annotation.${selectedFormat}`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação Concluída",
      description: `Arquivo ${selectedFormat.toUpperCase()} baixado com sucesso!`,
    });
  };

  const handleCopyResults = () => {
    const data = generateExportData();
    navigator.clipboard.writeText(data);
    toast({
      title: "Copiado!",
      description: "Resultados copiados para a área de transferência.",
    });
  };

  const stats = {
    totalEntities: entities.length,
    mappedEntities: mappings.length,
    unmappedEntities: entities.length - mappings.length,
    mappingRate: entities.length > 0 ? (mappings.length / entities.length) * 100 : 0,
    avgSimilarity: mappings.length > 0 ? mappings.reduce((acc, m) => acc + m.similarityScore, 0) / mappings.length : 0,
    byLabel: entities.reduce((acc, entity) => {
      acc[entity.label] = (acc[entity.label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resultados da Anotação Clínica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="annotated" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="annotated">Texto Anotado</TabsTrigger>
              <TabsTrigger value="entities">Entidades</TabsTrigger>
              <TabsTrigger value="mappings">Mapeamentos</TabsTrigger>
              <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
            </TabsList>

            <TabsContent value="annotated" className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="text-sm font-medium mb-3">Narrativa Clínica Anotada:</div>
                <div className="text-sm leading-relaxed">
                  {renderAnnotatedText()}
                </div>
                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    Entidades com anel azul possuem mapeamento SNOMED CT
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="entities" className="space-y-4">
              <div className="grid gap-3">
                {entities.map((entity, index) => {
                  const mapping = mappings.find(m => m.entityText === entity.text);
                  return (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={getEntityColor(entity.label)}>
                          {entity.label}
                        </Badge>
                        <div className="flex gap-2">
                          <span className="text-xs text-muted-foreground">
                            NER: {(entity.confidence * 100).toFixed(1)}%
                          </span>
                          {mapping && (
                            <Badge variant="outline" className="text-blue-600">
                              SNOMED: {(mapping.similarityScore * 100).toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="font-medium text-sm">{entity.text}</div>
                      {mapping && (
                        <div className="text-xs text-blue-600">
                          → {mapping.snomedCode}: {mapping.snomedTerm}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="mappings" className="space-y-4">
              {mappings.length > 0 ? (
                <div className="grid gap-4">
                  {mappings.map((mapping, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">"{mapping.entityText}"</div>
                            <Badge variant="outline">
                              {(mapping.similarityScore * 100).toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="text-sm text-blue-600">
                            <strong>SNOMED:</strong> {mapping.snomedCode}
                          </div>
                          <div className="text-sm">
                            <strong>Termo:</strong> {mapping.snomedTerm}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <strong>Sinônimos:</strong> {mapping.snomedSynonyms.join(', ')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum mapeamento SNOMED encontrado com o threshold atual
                </div>
              )}
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{stats.totalEntities}</div>
                    <div className="text-sm text-muted-foreground">Entidades Extraídas</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">{stats.mappedEntities}</div>
                    <div className="text-sm text-muted-foreground">Com Mapeamento</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-orange-600">{stats.unmappedEntities}</div>
                    <div className="text-sm text-muted-foreground">Sem Mapeamento</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-blue-600">{stats.mappingRate.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Taxa de Mapeamento</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Distribuição por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(stats.byLabel).map(([label, count]) => (
                      <div key={label} className="text-center">
                        <Badge className={getEntityColor(label)} variant="outline">
                          {label}
                        </Badge>
                        <div className="text-lg font-bold mt-1">{count}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {mappings.length > 0 && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm">
                      <strong>Similaridade Média:</strong> {(stats.avgSimilarity * 100).toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Resultados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Formato de Exportação:</label>
              <div className="flex gap-2">
                {(['json', 'csv', 'xml'] as const).map((format) => (
                  <Button
                    key={format}
                    variant={selectedFormat === format ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFormat(format)}
                  >
                    {format.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Baixar {selectedFormat.toUpperCase()}
            </Button>
            <Button variant="outline" onClick={handleCopyResults} className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Copiar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnnotationResults;
