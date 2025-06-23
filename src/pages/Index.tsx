
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Brain, FileText, Cpu, Target, History, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ClinicalTextInput from "@/components/ClinicalTextInput";
import NERProcessor from "@/components/NERProcessor";
import SnomedMapper from "@/components/SnomedMapper";
import HL7Mapper from "@/components/HL7Mapper";
import AnnotationResults from "@/components/AnnotationResults";
import SavedAnnotationsList from "@/components/SavedAnnotationsList";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [clinicalText, setClinicalText] = useState('');
  const [extractedEntities, setExtractedEntities] = useState([]);
  const [snomedMappings, setSnomedMappings] = useState([]);
  const [hl7Mappings, setHL7Mappings] = useState([]);
  const [processingStep, setProcessingStep] = useState(0);

  const steps = [
    { id: 'input', title: 'Narrativa Clínica', icon: FileText },
    { id: 'ner', title: 'Extração NER', icon: Brain },
    { id: 'snomed', title: 'SNOMED CT', icon: Target },
    { id: 'hl7', title: 'HL7 FHIR', icon: Activity },
    { id: 'results', title: 'Resultados', icon: Cpu },
    { id: 'saved', title: 'Histórico', icon: History }
  ];

  // Check authentication
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const handleSnomedMappingsComplete = (mappings) => {
    console.log('SNOMED mappings complete:', mappings);
    setSnomedMappings(mappings);
    setProcessingStep(3); // Move to HL7 step
  };

  const handleHL7MappingsComplete = (mappings) => {
    console.log('HL7 mappings complete:', mappings);
    setHL7Mappings(mappings);
    setProcessingStep(4); // Move to results step
  };

  const handleTabChange = (value) => {
    const stepIndex = steps.findIndex(step => step.id === value);
    if (stepIndex !== -1) {
      setProcessingStep(stepIndex);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
            Anotação de Termos Clínicos
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            NER + Mapeamento Semântico para SNOMED CT + HL7 FHIR
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            <Badge variant="secondary">BioBERTpt</Badge>
            <Badge variant="secondary">SNOMED CT</Badge>
            <Badge variant="secondary">HL7 FHIR</Badge>
            <Badge variant="secondary">LOINC</Badge>
            <Badge variant="secondary">ICD-10</Badge>
            <Badge variant="secondary">Português Brasileiro</Badge>
            <Badge variant="secondary">Supabase Storage</Badge>
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

        <Tabs value={steps[processingStep].id} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            {steps.map((step, index) => (
              <TabsTrigger
                key={step.id}
                value={step.id}
                disabled={index > processingStep && processingStep < steps.length - 2}
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
                console.log('Entities extracted:', entities);
                setExtractedEntities(entities);
                setProcessingStep(2);
              }}
            />
          </TabsContent>

          <TabsContent value="snomed" className="mt-6">
            <SnomedMapper 
              entities={extractedEntities}
              onMappingsComplete={handleSnomedMappingsComplete}
            />
          </TabsContent>

          <TabsContent value="hl7" className="mt-6">
            <HL7Mapper 
              entities={extractedEntities}
              onMappingsComplete={handleHL7MappingsComplete}
            />
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <AnnotationResults 
              originalText={clinicalText}
              entities={extractedEntities}
              mappings={snomedMappings}
              hl7Mappings={hl7Mappings}
            />
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <SavedAnnotationsList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
