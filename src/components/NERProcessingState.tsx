
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Zap } from "lucide-react";

interface NERProcessingStateProps {
  isProcessing: boolean;
  progress: number;
  processingStep: string;
  onProcessStart: () => void;
}

const NERProcessingState = ({ isProcessing, progress, processingStep, onProcessStart }: NERProcessingStateProps) => {
  if (isProcessing) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">Processando com BioBERTpt</div>
          <div className="text-sm text-muted-foreground mb-4">{processingStep}</div>
          <Progress value={progress} className="w-full max-w-md mx-auto" />
          <div className="text-xs text-muted-foreground mt-2">{progress}%</div>
        </div>
      </div>
    );
  }

  return (
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
        <Button onClick={onProcessStart} className="flex items-center gap-2" size="lg">
          <Zap className="h-4 w-4" />
          Executar BioBERTpt NER
        </Button>
      </div>
    </div>
  );
};

export default NERProcessingState;
