import { UnitCard } from "./unit-card";
import type { UnitNode } from "@/lib/progression";

export function UnitGrid({ units }: { units: UnitNode[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {units.map((unit, i) => (
        <UnitCard key={unit.id} unit={unit} index={i} />
      ))}
    </div>
  );
}
