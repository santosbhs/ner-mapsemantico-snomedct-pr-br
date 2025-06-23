
export interface SnomedConcept {
  code: string;
  display: string;
  system: string;
  definition?: string;
  synonyms: string[];
  hierarchy: string[];
  parents: string[];
  children: string[];
}

export interface SnomedSearchResult {
  concept: SnomedConcept;
  score: number;
}

// Servidores FHIR públicos com SNOMED CT
const FHIR_SERVERS = [
  'https://r4.ontoserver.csiro.au/fhir', // CSIRO Ontoserver (Austrália)
  'https://ontology.nhs.uk/authoring/fhir', // NHS (Reino Unido)  
  'https://tx.fhir.org/r4' // HL7 International
];

const SNOMED_SYSTEM = 'http://snomed.info/sct';

class SnomedService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = FHIR_SERVERS[0]; // Usar CSIRO como padrão
  }

  async searchConcepts(searchTerm: string, maxResults: number = 10): Promise<SnomedSearchResult[]> {
    console.log(`Buscando "${searchTerm}" na SNOMED CT...`);

    try {
      // Primeira tentativa: busca exata
      let results = await this.performSearch(searchTerm, maxResults);
      
      // Se não encontrou resultados suficientes, tentar busca aproximada
      if (results.length < 3) {
        console.log('Tentando busca aproximada...');
        const approximateResults = await this.performApproximateSearch(searchTerm, maxResults);
        results = [...results, ...approximateResults];
      }

      // Remover duplicatas
      const uniqueResults = results.filter((result, index, self) => 
        index === self.findIndex(r => r.concept.code === result.concept.code)
      );

      console.log(`Encontrados ${uniqueResults.length} conceitos SNOMED CT para "${searchTerm}"`);
      return uniqueResults.slice(0, maxResults);

    } catch (error) {
      console.error('Erro ao buscar na SNOMED CT:', error);
      return await this.fallbackSearch(searchTerm);
    }
  }

  private async performSearch(searchTerm: string, maxResults: number): Promise<SnomedSearchResult[]> {
    const searchUrl = `${this.baseUrl}/ValueSet/$expand`;
    
    const body = {
      resourceType: "Parameters",
      parameter: [
        {
          name: "url",
          valueUri: "http://snomed.info/sct/900000000000207008"
        },
        {
          name: "filter",
          valueString: searchTerm
        },
        {
          name: "count",
          valueInteger: maxResults
        },
        {
          name: "includeDesignations",
          valueBoolean: true
        }
      ]
    };

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/fhir+json',
        'Accept': 'application/fhir+json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Erro na busca FHIR: ${response.status}`);
    }

    const data = await response.json();
    return this.parseFHIRResponse(data, searchTerm);
  }

  private async performApproximateSearch(searchTerm: string, maxResults: number): Promise<SnomedSearchResult[]> {
    // Tentar variações do termo
    const variations = this.generateSearchVariations(searchTerm);
    const allResults: SnomedSearchResult[] = [];

    for (const variation of variations) {
      try {
        const results = await this.performSearch(variation, 5);
        allResults.push(...results);
      } catch (error) {
        console.warn(`Falha na busca por variação "${variation}":`, error);
      }
    }

    return allResults;
  }

  private generateSearchVariations(term: string): string[] {
    const variations = [term];
    
    // Remover acentos
    const withoutAccents = term.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (withoutAccents !== term) {
      variations.push(withoutAccents);
    }

    // Tentar singular/plural
    if (term.endsWith('s')) {
      variations.push(term.slice(0, -1));
    } else {
      variations.push(term + 's');
    }

    // Primeiras palavras para termos compostos
    const words = term.split(' ');
    if (words.length > 1) {
      variations.push(words[0]);
      variations.push(words[words.length - 1]);
    }

    return [...new Set(variations)];
  }

  private parseFHIRResponse(data: any, originalTerm: string): SnomedSearchResult[] {
    const results: SnomedSearchResult[] = [];

    if (data.expansion && data.expansion.contains) {
      for (const concept of data.expansion.contains) {
        const score = this.calculateSimilarity(originalTerm, concept.display);
        
        results.push({
          concept: {
            code: concept.code,
            display: concept.display,
            system: SNOMED_SYSTEM,
            synonyms: this.extractSynonyms(concept),
            hierarchy: [], // Será preenchido em uma chamada separada se necessário
            parents: [],
            children: []
          },
          score
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private extractSynonyms(concept: any): string[] {
    const synonyms = [concept.display];
    
    if (concept.designation) {
      for (const designation of concept.designation) {
        if (designation.value && !synonyms.includes(designation.value)) {
          synonyms.push(designation.value);
        }
      }
    }

    return synonyms;
  }

  private calculateSimilarity(term1: string, term2: string): number {
    const t1 = term1.toLowerCase().normalize();
    const t2 = term2.toLowerCase().normalize();

    // Exact match
    if (t1 === t2) return 1.0;

    // Contains
    if (t2.includes(t1) || t1.includes(t2)) return 0.8;

    // Levenshtein distance based similarity
    const distance = this.levenshteinDistance(t1, t2);
    const maxLength = Math.max(t1.length, t2.length);
    return Math.max(0, 1 - distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private async fallbackSearch(searchTerm: string): Promise<SnomedSearchResult[]> {
    console.log('Usando busca fallback para:', searchTerm);
    
    // Base local limitada para casos onde a API não está disponível
    const fallbackDatabase = {
      'dor': { code: '22253000', display: 'Dor', score: 0.9 },
      'febre': { code: '386661006', display: 'Febre', score: 0.9 },
      'tosse': { code: '49727002', display: 'Tosse', score: 0.9 },
      'dispneia': { code: '267036007', display: 'Dispneia', score: 0.9 },
      'hipertensão': { code: '38341003', display: 'Hipertensão arterial', score: 0.9 },
      'diabetes': { code: '73211009', display: 'Diabetes mellitus', score: 0.9 }
    };

    const result = fallbackDatabase[searchTerm.toLowerCase()];
    if (result) {
      return [{
        concept: {
          code: result.code,
          display: result.display,
          system: SNOMED_SYSTEM,
          synonyms: [result.display],
          hierarchy: [],
          parents: [],
          children: []
        },
        score: result.score
      }];
    }

    return [];
  }
}

export const snomedService = new SnomedService();
