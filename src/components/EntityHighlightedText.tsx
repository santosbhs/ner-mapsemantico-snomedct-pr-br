
import { Entity, getEntityColor } from "@/utils/clinicalPatterns";

interface EntityHighlightedTextProps {
  text: string;
  entities: Entity[];
}

const EntityHighlightedText = ({ text, entities }: EntityHighlightedTextProps) => {
  if (entities.length === 0) return text;

  let result = [];
  let lastEnd = 0;

  const sortedEntities = [...entities].sort((a, b) => a.start - b.start);

  sortedEntities.forEach((entity, index) => {
    // Adicionar texto antes da entidade
    if (entity.start > lastEnd) {
      result.push(text.slice(lastEnd, entity.start));
    }

    // Adicionar entidade destacada
    result.push(
      <span
        key={index}
        className={`inline-block px-2 py-1 rounded-md mx-1 ${getEntityColor(entity.label)} cursor-pointer hover:scale-105 transition-transform`}
        title={`${entity.label} (${(entity.confidence * 100).toFixed(1)}%)`}
      >
        {entity.text}
      </span>
    );

    lastEnd = entity.end;
  });

  // Adicionar texto restante
  if (lastEnd < text.length) {
    result.push(text.slice(lastEnd));
  }

  return result;
};

export default EntityHighlightedText;
