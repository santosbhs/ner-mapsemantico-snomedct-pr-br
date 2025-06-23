
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, FileText, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ClinicalTextInputProps {
  text: string;
  onTextChange: (text: string) => void;
  onNext: () => void;
}

const ClinicalTextInput = ({ text, onTextChange, onNext }: ClinicalTextInputProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const exampleTexts = [
    "Paciente do sexo masculino, 45 anos, apresenta dor torácica aguda, dispneia e sudorese. Histórico de hipertensão arterial sistêmica e diabetes mellitus tipo 2. Ao exame físico: taquicardia, estertores pulmonares bilaterais. ECG mostra alterações compatíveis com infarto agudo do miocárdio.",
    "Mulher de 32 anos com quadro de cefaleia intensa, náuseas, vômitos e fotofobia há 2 dias. Paciente relata episódios similares anteriores. Exame neurológico sem déficits focais. Diagnóstico de enxaqueca. Prescrito sumatriptano e orientações sobre fatores desencadeantes.",
    "Criança de 8 anos com febre alta (39°C), odinofagia e adenopatia cervical há 3 dias. Exame da orofaringe revela hiperemia e exsudato amigdaliano. Teste rápido para estreptococo positivo. Iniciado tratamento com amoxicilina."
  ];

  const handleExampleClick = (example: string) => {
    onTextChange(example);
    toast({
      title: "Texto de exemplo carregado",
      description: "Narrativa clínica inserida com sucesso!",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onTextChange(content);
        setIsLoading(false);
        toast({
          title: "Arquivo carregado",
          description: `${file.name} foi processado com sucesso!`,
        });
      };
      reader.readAsText(file);
    }
  };

  const canProceed = text.trim().length > 50;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Inserir Narrativa Clínica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Cole ou digite o texto da narrativa clínica:
            </label>
            <Textarea
              placeholder="Exemplo: Paciente do sexo masculino, 45 anos, apresenta dor torácica aguda..."
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              className="min-h-32 text-sm leading-relaxed"
            />
            <div className="text-xs text-muted-foreground">
              {text.length} caracteres • Mínimo recomendado: 50 caracteres
            </div>
          </div>

          <div className="flex gap-2">
            <div>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".txt,.docx,.pdf"
                onChange={handleFileUpload}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isLoading ? 'Carregando...' : 'Upload de Arquivo'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exemplos de Narrativas Clínicas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {exampleTexts.map((example, index) => (
              <div
                key={index}
                className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleExampleClick(example)}
              >
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {example}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="flex items-center gap-2"
          size="lg"
        >
          Iniciar Extração NER
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ClinicalTextInput;
