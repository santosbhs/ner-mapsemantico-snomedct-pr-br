
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Eye, FileText } from "lucide-react";
import { loadAnnotations } from "@/services/annotationService";
import { toast } from "@/hooks/use-toast";

interface SavedAnnotation {
  id: string;
  title: string;
  original_text: string;
  created_at: string;
  extracted_entities: Array<{
    id: string;
    text: string;
    label: string;
    snomed_mappings: Array<{
      snomed_code: string;
      snomed_term: string;
    }>;
  }>;
}

const SavedAnnotationsList = () => {
  const [annotations, setAnnotations] = useState<SavedAnnotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedAnnotations();
  }, []);

  const loadSavedAnnotations = async () => {
    setIsLoading(true);
    const result = await loadAnnotations();
    
    if (result.success) {
      setAnnotations(result.data || []);
    } else {
      toast({
        title: "Erro ao carregar anotações",
        description: result.error || "Não foi possível carregar as anotações salvas.",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEntityStats = (entities: SavedAnnotation['extracted_entities']) => {
    const stats = entities.reduce((acc, entity) => {
      acc[entity.label] = (acc[entity.label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(stats);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Carregando Anotações Salvas...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Anotações Salvas ({annotations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {annotations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma anotação salva ainda.</p>
            <p className="text-sm">Complete uma anotação e salve para vê-la aqui.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {annotations.map((annotation) => (
              <div key={annotation.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{annotation.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(annotation.created_at)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {annotation.original_text}
                </p>
                
                <div className="flex gap-2 flex-wrap">
                  {getEntityStats(annotation.extracted_entities).map(([label, count]) => (
                    <Badge key={label} variant="secondary" className="text-xs">
                      {label}: {count}
                    </Badge>
                  ))}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {annotation.extracted_entities.length} entidades • {' '}
                  {annotation.extracted_entities.reduce((acc, entity) => acc + entity.snomed_mappings.length, 0)} mapeamentos SNOMED
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedAnnotationsList;
