
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { saveAnnotation, SaveAnnotationData } from "@/services/annotationService";

interface SaveAnnotationDialogProps {
  annotationData: SaveAnnotationData;
}

const SaveAnnotationDialog = ({ annotationData }: SaveAnnotationDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, insira um título para a anotação.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    const result = await saveAnnotation({
      ...annotationData,
      title: title.trim()
    });

    if (result.success) {
      toast({
        title: "Anotação salva com sucesso!",
        description: `Anotação "${title}" foi salva no Supabase.`,
      });
      setIsOpen(false);
      setTitle('');
    } else {
      toast({
        title: "Erro ao salvar",
        description: result.error || "Ocorreu um erro ao salvar a anotação.",
        variant: "destructive"
      });
    }

    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2" size="lg">
          <Save className="h-4 w-4" />
          Salvar Anotação
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salvar Anotação no Supabase</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Anotação</Label>
            <Input
              id="title"
              placeholder="Ex: Caso Clínico - Infarto do Miocárdio"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving}
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Resumo:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>{annotationData.entities.length} entidades extraídas</li>
              <li>{annotationData.mappings.length} mapeamentos SNOMED CT</li>
              <li>Texto original: {annotationData.originalText.substring(0, 100)}...</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveAnnotationDialog;
