
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Brain, FileText, Cpu, Target } from "lucide-react";
import ClinicalTextInput from "@/components/ClinicalTextInput";
import NERProcessor from "@/components/NERProcessor";
import SnomedMapper from "@/components/SnomedMapper";
import AnnotationResults from "@/components/AnnotationResults";

const Index = () => {
  const [clinicalText, setClinicalText] = useState('');
  const [extractedEntities, setExtractedEntities] = useState([]);
  const [snomedMappings, setSnomedMappings] = useState([]);
  const [processingStep, setProcessingStep] = useState(0);

  const steps = [
    { id: 'input', title: 'Narrativa Clínica', icon: FileText },
    { id: 'ner', title: 'Extração NER', icon: Brain },
    { id: 'mapping', title: 'Mapeamento SNOMED', icon: Target },
    { id: 'results', title: 'Resultados', icon: Cpu }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
            Anotação de Termos Clínicos
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            NER + Mapeamento Semântico para SNOMED CT PT-BR
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            <Badge variant="secondary">BioBERTpt</Badge>
            <Badge variant="secondary">SNOMED CT</Badge>
            <Badge variant="secondary">Similaridade Cosseno</Badge>
            <Badge variant="secondary">Português Brasileiro</Badge>
          </div>
        </div>

        {/* Pipeline Steps Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = processingStep === index;
              const isCompleted = processingStep > index;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                      isActive
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Tabs value={steps[processingStep].id} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {steps.map((step, index) => (
              <TabsTrigger
                key={step.id}
                value={step.id}
                onClick={() => setProcessingStep(index)}
                disabled={index > processingStep && processingStep < steps.length - 1}
              >
                {step.title}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="input" className="mt-6">
            <ClinicalTextInput 
              text={clinicalText}
              onTextChange={setClinicalText}
              onNext={() => setProcessingStep(1)}
            />
          </TabsContent>

          <TabsContent value="ner" className="mt-6">
            <NERProcessor 
              text={clinicalText}
              onEntitiesExtracted={(entities) => {
                setExtractedEntities(entities);
                setProcessingStep(2);
              }}
            />
          </TabsContent>

          <TabsContent value="mapping" className="mt-6">
            <SnomedMapper 
              entities={extractedEntities}
              onMappingsComplete={(mappings) => {
                setSnomedMappings(mappings);
                setProcessingStep(3);
              }}
            />
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <AnnotationResults 
              originalText={clinicalText}
              entities={extractedEntities}
              mappings={snomedMappings}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
