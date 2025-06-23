
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileJson, FileSpreadsheet, FileCode, Save } from "lucide-react";
import SaveAnnotationDialog from "./SaveAnnotationDialog";
import { SaveAnnotationData } from "@/services/annotationService";

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

interface AnnotationResultsWithSaveProps {
  originalText: string;
  entities: Entity[];
  mappings: Mapping[];
}

const AnnotationResultsWithSave = ({ originalText, entities, mappings }: AnnotationResultsWithSaveProps) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'entities' | 'mappings' | 'export'>('summary');

  // Preparar dados para salvamento
  const prepareAnnotationData = (): SaveAnnotationData => {
    return {
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
      }))
    };
  };

  const exportToJSON = () => {
    const data = {
      originalText,
      entities,
      mappings,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anotacao-clinica-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const csvData = [
      ['Entidade', 'Categoria', 'Posição', 'Confiança', 'Código SNOMED', 'Termo SNOMED', 'Similaridade'],
      ...entities.map(entity => {
        const mapping = mappings.find(m => m.entityText === entity.text);
        return [
          entity.text,
          entity.label,
          `${entity.start}-${entity.end}`,
          entity.confidence.toString(),
          mapping?.snomedCode || '',
          mapping?.snomedTerm || '',
          mapping?.similarityScore.toString() || ''
        ];
      })
    ];
    
    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anotacao-clinica-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header com botões de ação */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Resultados da Anotação</CardTitle>
            <div className="flex gap-2">
              <SaveAnnotationDialog annotationData={prepareAnnotationData()} />
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
        </CardHeader>
      </Card>

      {/* Resumo dos resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{entities.length}</div>
              <div className="text-sm text-muted-foreground">Entidades Extraídas</div>
            </div>
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{mappings.length}</div>
              <div className="text-sm text-muted-foreground">Mapeamentos SNOMED</div>
            </div>
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {((mappings.length / entities.length) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Taxa de Mapeamento</div>
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
        </CardContent>
      </Card>

      {/* Tabela de mapeamentos */}
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
    </div>
  );
};

export default AnnotationResultsWithSave;
