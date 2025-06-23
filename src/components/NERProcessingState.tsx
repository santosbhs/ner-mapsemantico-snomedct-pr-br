
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Zap, Download, Globe } from "lucide-react";

interface NERProcessingStateProps {
  isProcessing: boolean;
  progress: number;
  processingStep: string;
  onProcessStart: () => void;
  isRealModel?: boolean;
  modelStatus?: string;
}

const NERProcessingState = ({ 
  isProcessing, 
  progress, 
  processingStep, 
  onProcessStart,
  isRealModel = false,
  modelStatus = 'unknown'
}: NERProcessingStateProps) => {
  
  if (isProcessing) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">
            Processando com BioBERTpt Real
          </div>
          <div className="text-sm text-muted-foreground mb-4">{processingStep}</div>
          <Progress value={progress} className="w-full max-w-md mx-auto" />
          <div className="text-xs text-muted-foreground mt-2">{progress}%</div>
          
          {progress < 40 && (
            <div className="text-xs text-orange-600 mt-2 flex items-center justify-center gap-1">
              <Download className="h-3 w-3" />
              Carregando modelo (pode demorar alguns minutos na primeira execução)
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <div className="space-y-4">
        <div className="text-lg font-medium">
          Pronto para extrair entidades com BioBERTpt Real
        </div>
        
        <div className="text-sm text-muted-foreground max-w-md mx-auto">
          Utilizando modelo BioBERT real para identificar: 
          sintomas, doenças, medicamentos, procedimentos e estruturas anatômicas 
          em textos clínicos em português brasileiro.
        </div>
        
        <div className="flex justify-center gap-2 flex-wrap mb-4">
          <Badge variant="outline" className="text-green-600 border-green-200">
            <Globe className="h-3 w-3 mr-1" />
            Modelo Real HF
          </Badge>
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            WebGPU/CPU
          </Badge>
          <Badge variant="outline" className="text-purple-600 border-purple-200">
            Portuguese Clinical
          </Badge>
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
          Executar BioBERTpt Real
        </Button>
        
        <div className="text-xs text-muted-foreground mt-4">
          ⚠️ Primeira execução: O modelo será baixado e pode demorar alguns minutos
        </div>
      </div>
    </div>
  );
};

export default NERProcessingState;
