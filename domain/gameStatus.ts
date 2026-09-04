export type ArmyCondition = "broken" | "quartered" | null;

export function getArmyCondition(
  startingModels: number,
  remainingModels: number,
): ArmyCondition {
  if (startingModels <= 0) return null;
  if (remainingModels <= Math.floor(startingModels / 4)) return "quartered";
  const breakCasualties = Math.floor(startingModels / 2) + 1;
  return startingModels - remainingModels >= breakCasualties ? "broken" : null;
}

