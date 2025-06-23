
export interface Entity {
  text: string;
  label: string;
  start: number;
  end: number;
  confidence: number;
}

export const clinicalPatterns = {
  SINTOMA: [
    /\b(dor|dispneia|sudorese|taquicardia|bradicardia|náusea|vômito|febre|cefaleia|tontura|fadiga|fraqueza|mal-estar|cansaço)\b/gi,
    /\b(dor\s+(?:torácica|abdominal|cervical|lombar|muscular|articular|de\s+cabeça)(?:\s+aguda|crônica)?)\b/gi,
    /\b(estertores?\s+(?:pulmonares?|crepitantes?))\b/gi,
    /\b(chiado|sibilos?|roncos?)\b/gi,
    /\b(edema|inchaço)\b/gi,
    /\b(palpitações?|batimentos?\s+cardíacos?\s+irregulares?)\b/gi,
    /\b(tosse(?:\s+seca|produtiva)?)\b/gi,
    /\b(sangramento|hemorragia)\b/gi,
  ],
  DOENCA: [
    /\b(diabetes\s+mellitus(?:\s+tipo\s+[12])?)\b/gi,
    /\b(hipertensão\s+arterial(?:\s+sistêmica)?)\b/gi,
    /\b(infarto(?:\s+agudo)?\s+do\s+miocárdio)\b/gi,
    /\b(insuficiência\s+(?:cardíaca|renal|hepática))\b/gi,
    /\b(pneumonia|bronquite|asma)\b/gi,
    /\b(acidente\s+vascular\s+cerebral|AVC)\b/gi,
    /\b(depressão|ansiedade|transtorno\s+bipolar)\b/gi,
    /\b(artrite|artrose|osteoporose)\b/gi,
    /\b(câncer|tumor|neoplasia)\b/gi,
    /\b(covid-19|coronavirus|sars-cov-2)\b/gi,
  ],
  MEDICAMENTO: [
    /\b(aspirina|ácido\s+acetilsalicílico)\b/gi,
    /\b(paracetamol|acetaminofeno)\b/gi,
    /\b(ibuprofeno|diclofenaco|nimesulida)\b/gi,
    /\b(atenolol|propranolol|metoprolol)\b/gi,
    /\b(losartana?|enalapril|captopril)\b/gi,
    /\b(metformina|glibenclamida|insulina)\b/gi,
    /\b(omeprazol|ranitidina|pantoprazol)\b/gi,
    /\b(dipirona|metamizol)\b/gi,
    /\b(amoxicilina|azitromicina|ciprofloxacino)\b/gi,
    /\b(sinvastatina|atorvastatina)\b/gi,
  ],
  PROCEDIMENTO: [
    /\b(eletrocardiograma|ECG)\b/gi,
    /\b(ecocardiograma|eco)\b/gi,
    /\b(radiografia|raio-x|RX)\b/gi,
    /\b(tomografia(?:\s+computadorizada)?|TC)\b/gi,
    /\b(ressonância\s+magnética|RM)\b/gi,
    /\b(ultrassonografia|ultrassom|USG)\b/gi,
    /\b(endoscopia|colonoscopia)\b/gi,
    /\b(cirurgia|operação|intervenção\s+cirúrgica)\b/gi,
    /\b(cateterismo\s+cardíaco)\b/gi,
    /\b(biópsia|punção)\b/gi,
  ],
  ANATOMIA: [
    /\b(coração|cardíaco|miocárdio)\b/gi,
    /\b(pulmão|pulmonar|brônquios?|alvéolos?)\b/gi,
    /\b(fígado|hepático|hepato)\b/gi,
    /\b(rim|renal|néfrico)\b/gi,
    /\b(cérebro|cerebral|neurológico)\b/gi,
    /\b(estômago|gástrico|gastro)\b/gi,
    /\b(intestino|intestinal|cólon)\b/gi,
    /\b(artéria|veia|vascular)\b/gi,
    /\b(osso|ósseo|esquelético)\b/gi,
    /\b(músculo|muscular|tendão)\b/gi,
  ]
};

export const extractClinicalEntities = (text: string): Entity[] => {
  const entities: Entity[] = [];
  
  // Processar cada categoria de entidade
  Object.entries(clinicalPatterns).forEach(([label, regexPatterns]) => {
    regexPatterns.forEach(regex => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        const entityText = match[0];
        const start = match.index;
        const end = start + entityText.length;
        
        // Verificar se já existe uma entidade na mesma posição
        const isDuplicate = entities.some(entity => 
          entity.start === start && entity.end === end
        );
        
        if (!isDuplicate) {
          entities.push({
            text: entityText,
            label,
            start,
            end,
            confidence: Math.random() * 0.15 + 0.85 // Confiança entre 85% e 100%
          });
        }
      }
    });
  });

  // Ordenar por posição no texto
  return entities.sort((a, b) => a.start - b.start);
};

export const getEntityColor = (label: string) => {
  const colors = {
    'SINTOMA': 'bg-red-100 text-red-800 border-red-200',
    'DOENCA': 'bg-orange-100 text-orange-800 border-orange-200',
    'MEDICAMENTO': 'bg-blue-100 text-blue-800 border-blue-200',
    'PROCEDIMENTO': 'bg-green-100 text-green-800 border-green-200',
    'ANATOMIA': 'bg-purple-100 text-purple-800 border-purple-200'
  };
  return colors[label] || 'bg-gray-100 text-gray-800 border-gray-200';
};
