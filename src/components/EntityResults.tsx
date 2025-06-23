
import { Badge } from "@/components/ui/badge";
import { Entity, getEntityColor } from "@/utils/clinicalPatterns";
import EntityHighlightedText from "./EntityHighlightedText";

interface EntityResultsProps {
  entities: Entity[];
  text: string;
}

const EntityResults = ({ entities, text }: EntityResultsProps) => {
  if (entities.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="text-lg font-medium">
        ✅ {entities.length} entidades extraídas
      </div>
      
      <div className="border rounded-lg p-4 bg-muted/20">
        <div className="text-sm font-medium mb-2">Texto com Anotações:</div>
        <div className="text-sm leading-relaxed">
          <EntityHighlightedText text={text} entities={entities} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entities.map((entity, index) => (
          <div key={index} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Badge className={getEntityColor(entity.label)}>
                {entity.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {(entity.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="font-medium text-sm">{entity.text}</div>
            <div className="text-xs text-muted-foreground">
              Posição: {entity.start}-{entity.end}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EntityResults;
